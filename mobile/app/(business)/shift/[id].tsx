import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '../../../lib/supabase';
import { initiatePayment, formatPHP, computeWages } from '../../../lib/payments';
import { hasRated, submitRating } from '../../../lib/ratings';
import { computeApplicantScore, getScoreLabel } from '../../../lib/scoring';
import { useAuthStore } from '../../../store/authStore';
import RatingModal from '../../../components/RatingModal';
import type { Application, Shift } from '../../../types';

export default function ManageShiftScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuthStore();
  const [shift, setShift] = useState<Shift | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [ratingApp, setRatingApp] = useState<Application | null>(null);

  async function load() {
    const [{ data: s }, { data: apps }] = await Promise.all([
      supabase.from('shifts').select('*, businesses(*)').eq('id', id).single(),
      supabase
        .from('applications')
        .select('*, profiles(*)')
        .eq('shift_id', id)
        .order('created_at'),
    ]);
    setShift(s);
    // Sort applicants by match score descending so best fits appear first
    const sorted = (apps ?? []).sort((a, b) => {
      const scoreA = (a as any).profiles ? computeApplicantScore((a as any).profiles) : 0;
      const scoreB = (b as any).profiles ? computeApplicantScore((b as any).profiles) : 0;
      return scoreB - scoreA;
    });
    setApplications(sorted);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function handleApprove(appId: string) {
    await supabase.from('applications').update({ status: 'approved' }).eq('id', appId);
    load();
  }

  async function handleReject(appId: string) {
    await supabase.from('applications').update({ status: 'rejected' }).eq('id', appId);
    load();
  }

  async function handleRateWorker(app: Application) {
    if (!profile) return;
    const alreadyRated = await hasRated(app.id, profile.id);
    if (alreadyRated) {
      Alert.alert('Already Rated', 'You have already rated this worker.');
      return;
    }
    setRatingApp(app);
  }

  async function handlePay(app: Application) {
    if (!app.checked_in_at || !app.checked_out_at || !shift) {
      Alert.alert('Cannot Pay', 'Worker must check in and out first.');
      return;
    }
    const worker = (app as any).profiles;
    if (!worker?.e_wallet_number || !worker?.e_wallet_provider) {
      Alert.alert('Cannot Pay', 'Worker has not set up their e-wallet.');
      return;
    }

    const hours  = (
      (new Date(app.checked_out_at!).getTime() - new Date(app.checked_in_at!).getTime()) / 3600000
    );
    const waiver = (worker.fee_waiver_count ?? 0) > 0;
    const wages  = computeWages(shift.hourly_rate, hours, waiver);
    const feeNote = waiver
      ? `${formatPHP(wages.gross)} − ₱0 fee (🎁 zero-fee waiver)`
      : `${formatPHP(wages.gross)} − ${formatPHP(wages.platformFee)} platform fee`;

    Alert.alert(
      'Confirm Payment',
      `Pay ${worker.full_name} ${formatPHP(wages.net)} via ${worker.e_wallet_provider.toUpperCase()}?\n${feeNote}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay Now',
          onPress: async () => {
            setPaying(app.id);
            const result = await initiatePayment({
              applicationId: app.id,
              workerId: app.worker_id,
              businessId: shift.business_id,
              amount: wages.gross,
              method: worker.e_wallet_provider,
              workerWalletNumber: worker.e_wallet_number,
              description: `KonekSync: ${shift.title}`,
            });
            // Consume fee waiver on success
            if (result.success && waiver) {
              await supabase
                .from('profiles')
                .update({ fee_waiver_count: worker.fee_waiver_count - 1 })
                .eq('id', app.worker_id);
            }
            setPaying(null);
            if (result.success) {
              Alert.alert('Payment Sent!', `Reference: ${result.paymentIntentId}`);
              load();
            } else {
              Alert.alert('Payment Failed', result.error);
            }
          },
        },
      ]
    );
  }

  if (loading || !shift) {
    return <View className="flex-1 items-center justify-center"><ActivityIndicator color="#4F46E5" /></View>;
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-primary-600 font-medium">← Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">{shift.title}</Text>
        <Text className="text-gray-500 text-sm">{shift.address}</Text>
      </View>

      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          shift.qr_code ? (
            <View className="bg-white rounded-2xl p-5 items-center mb-4">
              <Text className="font-semibold text-gray-700 mb-3">Check-in QR Code</Text>
              <Text className="text-xs text-gray-400 mb-3">Show or display at your business location</Text>
              <QRCode value={shift.qr_code} size={180} />
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const worker = (item as any).profiles;
          const isCheckedOut = !!item.checked_out_at;
          const isCheckedIn = !!item.checked_in_at;
          const score = worker ? computeApplicantScore(worker) : null;
          const scoreLabel = score !== null ? getScoreLabel(score) : null;

          return (
            <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 mr-2">
                  <View className="flex-row items-center gap-x-2 flex-wrap">
                    <Text className="font-semibold text-gray-800">{worker?.full_name ?? 'Worker'}</Text>
                    {scoreLabel && (
                      <View className={`rounded-full px-2 py-0.5 ${scoreLabel.bg}`}>
                        <Text className={`text-xs font-medium ${scoreLabel.text}`}>
                          {scoreLabel.label} · {score}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-gray-400 mt-0.5">
                    ⭐ {worker?.average_rating?.toFixed(1) ?? 'N/A'} ·
                    Reliability {worker?.reliability_score?.toFixed(1) ?? 'N/A'}
                  </Text>
                </View>
                <StatusBadge status={item.status} />
              </View>

              {isCheckedIn && (
                <Text className="text-xs text-green-600 mb-2">
                  ✓ Checked in · {isCheckedOut ? 'Checked out' : 'Currently working'}
                </Text>
              )}

              <View className="flex-row gap-x-2 mt-2 flex-wrap gap-y-2">
                {item.status === 'pending' && (
                  <>
                    <TouchableOpacity
                      className="flex-1 bg-primary-600 py-2.5 rounded-xl items-center"
                      onPress={() => handleApprove(item.id)}
                    >
                      <Text className="text-white font-medium text-sm">Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 border border-red-300 py-2.5 rounded-xl items-center"
                      onPress={() => handleReject(item.id)}
                    >
                      <Text className="text-red-500 font-medium text-sm">Reject</Text>
                    </TouchableOpacity>
                  </>
                )}
                {item.status === 'approved' && (
                  <TouchableOpacity
                    className="flex-1 border border-primary-200 bg-primary-50 py-2.5 rounded-xl items-center"
                    onPress={() => router.push(`/(business)/chat/${item.id}` as any)}
                  >
                    <Text className="text-primary-600 font-medium text-sm">💬 Message</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'approved' && isCheckedOut && (
                  <>
                    <TouchableOpacity
                      className="flex-1 bg-green-600 py-2.5 rounded-xl items-center"
                      onPress={() => handlePay(item)}
                      disabled={paying === item.id}
                    >
                      <Text className="text-white font-medium text-sm">
                        {paying === item.id ? 'Processing...' : 'Release Payment'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="border border-primary-600 py-2.5 px-3 rounded-xl items-center"
                      onPress={() => handleRateWorker(item)}
                    >
                      <Text className="text-primary-600 font-medium text-sm">⭐ Rate</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-gray-500">No applicants yet.</Text>
          </View>
        }
      />

      <RatingModal
        visible={ratingApp !== null}
        subjectName={(ratingApp as any)?.profiles?.full_name ?? 'Worker'}
        rateeLabel="Worker"
        onSubmit={async (score, comment) => {
          if (!ratingApp || !profile) return;
          const { error } = await submitRating({
            applicationId: ratingApp.id,
            raterId:       profile.id,
            ratedId:       ratingApp.worker_id,
            score,
            comment,
          });
          setRatingApp(null);
          if (error) Alert.alert('Error', error);
          else Alert.alert('Thank you!', 'Your rating has been submitted.');
        }}
        onDismiss={() => setRatingApp(null)}
      />
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-600',
  };
  const cls = map[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <View className={`rounded-full px-2.5 py-0.5 ${cls.split(' ')[0]}`}>
      <Text className={`text-xs capitalize ${cls.split(' ')[1]}`}>{status}</Text>
    </View>
  );
}
