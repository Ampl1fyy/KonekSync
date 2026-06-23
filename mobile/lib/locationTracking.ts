/**
 * Shift GPS Tracking
 *
 * Pings worker location to Supabase every 5 minutes (or every 100 m of movement)
 * strictly between QR check-in and QR check-out. No tracking outside shift hours.
 *
 * IMPORTANT: Background location requires expo-task-manager and a custom dev client.
 * It will NOT run in Expo Go. Build with:
 *   npx expo run:android  |  npx expo run:ios  |  eas build --profile development
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export const SHIFT_LOCATION_TASK = 'SHIFT_LOCATION_TASK';

const STORAGE_APP_ID    = '@koneksync/tracking_app_id';
const STORAGE_WORKER_ID = '@koneksync/tracking_worker_id';

// ─── Background task definition ───────────────────────────────────────────────
// Must live at module level — expo-task-manager registers it at JS bundle load time.
// applicationId/workerId are read from AsyncStorage because module-level variables
// are not guaranteed to survive an OS-triggered background wake.
TaskManager.defineTask(
  SHIFT_LOCATION_TASK,
  async ({ data, error }: TaskManager.TaskManagerTaskBody) => {
    if (error) {
      console.warn('[GPS] Background task error:', error.message);
      return;
    }

    const { locations } = data as { locations: Location.LocationObject[] };
    if (!locations?.length) return;

    const [applicationId, workerId] = await Promise.all([
      AsyncStorage.getItem(STORAGE_APP_ID),
      AsyncStorage.getItem(STORAGE_WORKER_ID),
    ]);
    if (!applicationId || !workerId) return;

    const { latitude, longitude } = locations[locations.length - 1].coords;

    const { error: dbErr } = await supabase
      .from('shift_location_logs')
      .insert({ application_id: applicationId, worker_id: workerId, latitude, longitude });

    if (dbErr) console.warn('[GPS] Failed to log location:', dbErr.message);
  }
);

// ─── Public API ───────────────────────────────────────────────────────────────

export async function startShiftTracking(
  applicationId: string,
  workerId: string
): Promise<void> {
  try {
    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    if (fg !== 'granted') return;

    const { status: bg } = await Location.requestBackgroundPermissionsAsync();
    if (bg !== 'granted') {
      // Silently degrade — background permission denied, but don't block check-in
      return;
    }

    // Persist context before starting so the background task can read it after wakes
    await Promise.all([
      AsyncStorage.setItem(STORAGE_APP_ID, applicationId),
      AsyncStorage.setItem(STORAGE_WORKER_ID, workerId),
    ]);

    // Clear any stale instance (e.g. app crash mid-shift)
    const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(SHIFT_LOCATION_TASK);
    if (alreadyRunning) {
      await Location.stopLocationUpdatesAsync(SHIFT_LOCATION_TASK);
    }

    await Location.startLocationUpdatesAsync(SHIFT_LOCATION_TASK, {
      accuracy:                         Location.Accuracy.Balanced,
      timeInterval:                     5 * 60 * 1000, // 5 minutes
      distanceInterval:                 100,            // or 100 m of movement
      pausesUpdatesAutomatically:       false,
      showsBackgroundLocationIndicator: true,           // iOS blue pill (privacy signal)
      foregroundService: {
        notificationTitle: 'KonekSync — Shift Active',
        notificationBody:  'Your location is tracked only during active shift hours.',
        notificationColor: '#4F46E5',
      },
    });
  } catch (err) {
    // expo-task-manager not available in Expo Go — degrade silently
    console.warn('[GPS] startShiftTracking unavailable (Expo Go?):', err);
  }
}

export async function stopShiftTracking(): Promise<void> {
  try {
    // Clear persisted context first so any in-flight wake finds nothing to log
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_APP_ID),
      AsyncStorage.removeItem(STORAGE_WORKER_ID),
    ]);

    const isRunning = await Location.hasStartedLocationUpdatesAsync(SHIFT_LOCATION_TASK);
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(SHIFT_LOCATION_TASK);
    }
  } catch (err) {
    console.warn('[GPS] stopShiftTracking failed:', err);
  }
}
