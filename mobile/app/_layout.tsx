import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { saveFCMToken } from '../lib/firebase';
import '../global.css';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { session, profile, loading, setSession, fetchProfile } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    fetchProfile(session.user.id);
    saveFCMToken(session.user.id).catch(() => {});
  }, [session]);

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)');
    } else if (session && inAuthGroup) {
      // Wait for profile to load so we can route to the correct group
      if (!profile) return;
      if (profile.role === 'business') {
        router.replace('/(business)');
      } else {
        router.replace('/(worker)');
      }
    }
  }, [session, segments, loading, profile]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(worker)" />
      <Stack.Screen name="(business)" />
      <Stack.Screen name="qr-scan" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
