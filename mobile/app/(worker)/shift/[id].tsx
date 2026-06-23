import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';
import { formatPHP } from '../../../lib/payments';
import { format } from 'date-fns';
import type { Shift, Application } from '../../../types';

const INSURANCE_PREMIUM = 10; // PHP 10 per shift

export default function ShiftDetailScreen() {
  const { id }    = useLocalSearchParams<{ id: string }>();
  const router    = useRouter();
  const { profile } = useAuthStore();
  const [shift,        setShift]        = useState<Shift | null>(null);
  const [application,  setApplication]  = useState<Application | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [applying,     setApplying]     = useState(false);
  const [addInsurance, setAddInsurance] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ data: shiftData }, { data: appData }] = await Promise.all([
        supabase.from('shifts').select('*, businesses(*), skills(*)').eq('id', id).single(),
        profile
          ? supabase.from('applications').select('*').eq('shift_id', id).eq('worker_id', profile.id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      setShift(shiftData);
      setApplication(appData);
      setLoading(false);
    }
    load();
  }, [id, profile]);

  async function handleApply() {
    if (!profile) return;
    setApplying(true);

    const { data: app, error } = await supabase
      .from('applications')
      .insert({ shift_id: id, worker_id: profile.id })
      .select()
      .single();

    if (error) {
      Alert.alert('Error', error.message);
      setApplying(false);
      return;
    }

    // Attach insurance if opted in
    if (addInsurance && app) {
      await supabase.from('insurance_coverage').insert({
        application_id: app.id,
        worker_id:      profile.id,
      });
    }

    setApplication({ status: 'pending' } as Application);
    Alert.alert(
      'Applied!',
      addInsurance
        ? 'Your application has been submitted with MicroShield coverage (₱10 premium). Wait for business confirmation.'
        : 'Your application has been submitted. Wait for business confirmation.',
    );
    setApplying(false);
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }
  if (!shift) return null;

  const hoursTotal   = (
    (new Date(shift.time_end).getTime() - new Date(shift.time_start).getTime()) / 3600000
  ).toFixed(1);
  const estimatedPay = parseFloat(hoursTotal) * shift.hourly_rate;
  const netEstimate  = estimatedPay * 0.95; // after 5% fee

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView>
        {/* Back */}
        <View className="bg-white px-5 pt-14 pb-4">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Text className="text-primary-600 font-medium">← Back</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800">{shift.title}</Text>
          <Text className="text-gray-500 mt-1">{(shift as any).businesses?.name}</Text>
          {shift.sector && (
            <View className="mt-2 self-start bg-indigo-50 rounded-full px-3 py-1">
              <Text className="text-xs font-medium text-indigo-600">{shift.sector}</Text>
            </View>
          )}
        </View>

        <View className="px-5 py-4 gap-y-4">
          {/* Pay breakdown */}
          <View className="bg-primary-50 rounded-2xl p-4">
            <View className="flex-row justify-between mb-2">
              <View>
                <Text className="text-xs text-gray-500">Hourly Rate</Text>
                <Text className="text-2xl font-bold text-primary-600">{formatPHP(shift.hourly_rate)}</Text>
              </View>
              <View className="items-end">
                <Text className="text-xs text-gray-500">Est. Take-Home</Text>
                <Text className="text-2xl font-bold text-green-600">{formatPHP(netEstimate)}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/(worker)/fee-info' as any)}>
              <Text className="text-xs text-primary-600 font-medium">See how payouts work →</Text>
            </TouchableOpacity>
          </View>

          {/* Details */}
          <View className="bg-white rounded-2xl p-4 gap-y-3">
            <DetailRow icon="🗓" label="Date"     value={format(new Date(shift.time_start), 'MMMM d, yyyy')} />
            <DetailRow icon="🕐" label="Time"     value={`${format(new Date(shift.time_start), 'h:mm a')} – ${format(new Date(shift.time_end), 'h:mm a')} (${hoursTotal}h)`} />
            <DetailRow icon="📍" label="Location" value={shift.address} />
            <DetailRow icon="👥" label="Slots"    value={`${shift.slots_filled}/${shift.slots} filled`} />
            {(shift as any).skills && <DetailRow icon="🏷" label="Skill" value={(shift as any).skills?.name} />}
          </View>

          {/* Description */}
          {shift.description && (
            <View className="bg-white rounded-2xl p-4">
              <Text className="font-semibold text-gray-800 mb-2">About this shift</Text>
              <Text className="text-gray-600 leading-6">{shift.description}</Text>
            </View>
          )}

          {/* Insurance opt-in — only shown if not yet applied */}
          {!application && (
            <View className="bg-white rounded-2xl p-4 border border-gray-100">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <Text className="font-semibold text-gray-800 text-sm">🛡️ Add MicroShield Insurance</Text>
                  <Text className="text-xs text-gray-500 mt-0.5 leading-4">
                    ₱10 premium · ₱50,000 coverage for on-site injuries.
                    Powered by our insurance partner.
                  </Text>
                </View>
                <Switch
                  value={addInsurance}
                  onValueChange={setAddInsurance}
                  trackColor={{ true: '#4F46E5' }}
                />
              </View>
              {addInsurance && (
                <View className="mt-3 bg-indigo-50 rounded-xl p-3">
                  <Text className="text-xs text-indigo-700 leading-4">
                    ✓ Coverage is active from clock-in to clock-out only.{'\n'}
                    ✓ File an incident report from "My Shifts" if something happens.{'\n'}
                    ✓ The ₱10 premium is deducted from your shift earnings.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* CTA */}
      <View className="px-5 pb-8 pt-3 bg-white border-t border-gray-100">
        {application ? (
          <View className="bg-gray-100 rounded-xl py-4 items-center">
            <Text className="text-gray-600 font-medium capitalize">
              Status: {application.status}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            className="bg-primary-600 rounded-xl py-4 items-center"
            onPress={handleApply}
            disabled={applying || shift.status !== 'open'}
          >
            <Text className="text-white font-semibold text-base">
              {applying
                ? 'Applying...'
                : addInsurance
                  ? `Apply + Add Insurance (₱10 premium)`
                  : 'Apply for this Shift'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-row items-start">
      <Text className="w-6 mr-2">{icon}</Text>
      <View className="flex-1">
        <Text className="text-xs text-gray-400">{label}</Text>
        <Text className="text-gray-700 font-medium">{value}</Text>
      </View>
    </View>
  );
}
