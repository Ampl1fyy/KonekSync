import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentLocation } from '../lib/maps';
import type { Shift } from '../types';

export function useNearbyShifts(radiusMeters = 5000) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const coords = await getCurrentLocation();
      if (!coords) {
        setError('Location permission required to find nearby shifts.');
        return;
      }

      const { data, error: err } = await supabase.rpc('get_nearby_shifts', {
        lat: coords.latitude,
        lng: coords.longitude,
        radius_meters: radiusMeters,
      });

      if (err) throw err;

      // Fetch business info
      const shiftIds = (data as Shift[]).map((s) => s.id);
      if (shiftIds.length === 0) { setShifts([]); return; }

      const { data: enriched } = await supabase
        .from('shifts')
        .select('*, businesses(*), skills(*)')
        .in('id', shiftIds);

      setShifts(enriched ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load shifts');
    } finally {
      setLoading(false);
    }
  }, [radiusMeters]);

  useEffect(() => { fetch(); }, [fetch]);

  return { shifts, loading, error, refetch: fetch };
}

export function useMyApplications(workerId: string) {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Stable ref so refetch doesn't change identity on every render
  const workerIdRef = useRef(workerId);
  workerIdRef.current = workerId;

  const fetch = useCallback(async () => {
    if (!workerIdRef.current) return;
    setLoading(true);
    const { data } = await supabase
      .from('applications')
      .select('*, shifts(*, businesses(*))')
      .eq('worker_id', workerIdRef.current)
      .order('created_at', { ascending: false });
    setApplications(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { applications, loading, refetch: fetch };
}

export function useBusinessShifts(businessId: string) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    const { data } = await supabase
      .from('shifts')
      .select('*, applications(*, profiles(*))')
      .eq('business_id', businessId)
      .order('time_start', { ascending: false });
    setShifts(data ?? []);
    setLoading(false);
  }, [businessId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { shifts, loading, refetch: fetch };
}
