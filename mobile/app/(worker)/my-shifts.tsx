import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useMyApplications } from '../../hooks/useShifts';
import { hasRated, submitRating } from '../../lib/ratings';
import { format } from 'date-fns';
import RatingModal from '../../components/RatingModal';
import DisputeModal from '../../components/DisputeModal';
import type { ApplicationStatus } from '../../types';

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  approved:  'bg-green-100 text-green-700',
  rejected:  'bg-red-100 text-red-700',
  withdrawn: 'bg-gray-100 text-gray-500',
};

export default function MyShiftsScreen() {
  const { profile } = useAuthStore();
  const router = useRouter();
  const { applications, loading, refetch } = useMyApplications(profile?.id ?? '');

  // Rating modal state — tracks which application is being rated
  const [ratingApp, setRatingApp] = useState<any | null>(null);

  // Dispute modal state — tracks which application a dispute is being filed for
  const [disputeApp, setDisputeApp] = useState<any | null>(null);

  async function handleOpenRating(item: any) {
    if (!profile) return;
    const alreadyRated = await hasRated(item.id, profile.id);
    if (alreadyRated) {
      Alert.alert('Already Rated', 'You have already submitted a rating for this shift.');
      return;
    }
    setRatingApp(item);
  }

  async function handleSubmitRating(score: number, comment: string) {
    if (!ratingApp || !profile) return;
    const { error } = await submitRating({
      applicationId: ratingApp.id,
      raterId:       profile.id,
      ratedId:       ratingApp.shifts?.businesses?.owner_id ?? ratingApp.shifts?.business_id,
      score,
      comment,
    });
    setRatingApp(null);
    if (error) {
      Alert.alert('Error', error);
    } else {
      Alert.alert('Thank you!', 'Your rating has been submitted.');
    }
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-800">My Shifts</Text>
      </View>

      <FlatList
        data={applications}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        renderItem={({ item }: { item: any }) => {
          const shift = item.shifts;
          if (!shift) return null;

          const colors        = STATUS_COLORS[item.status as ApplicationStatus];
          const isCheckedOut  = !!item.checked_out_at;
          const isCheckedIn   = !!item.checked_in_at;
          const showPostShift = item.status === 'approved' && isCheckedOut;

          return (
            <TouchableOpacity
              onPress={() => router.push(`/(worker)/shift/${shift.id}`)}
              className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
            >
              <View className="flex-row justify-between items-start mb-1">
                <Text className="font-semibold text-gray-800 flex-1">{shift.title}</Text>
                <View className={`rounded-full px-2.5 py-0.5 ${colors.split(' ')[0]}`}>
                  <Text className={`text-xs font-medium capitalize ${colors.split(' ')[1]}`}>
                    {item.status}
                  </Text>
                </View>
              </View>

              <Text className="text-sm text-gray-500">{shift.businesses?.name}</Text>
              <Text className="text-xs text-gray-400 mt-2">
                {format(new Date(shift.time_start), 'MMM d, h:mm a')} –{' '}
                {format(new Date(shift.time_end), 'h:mm a')}
              </Text>

              {/* Message business */}
              {item.status === 'approved' && (
                <TouchableOpacity
                  className="mt-3 border border-primary-200 rounded-xl py-2.5 items-center bg-primary-50"
                  onPress={() => router.push(`/(worker)/chat/${item.id}`)}
                >
                  <Text className="text-primary-600 font-medium text-sm">💬 Message Business</Text>
                </TouchableOpacity>
              )}

              {/* Check-in CTA */}
              {item.status === 'approved' && !isCheckedIn && (
                <TouchableOpacity
                  className="mt-2 bg-primary-600 rounded-xl py-2.5 items-center"
                  onPress={() => router.push('/qr-scan')}
                >
                  <Text className="text-white font-medium text-sm">Scan QR to Check In</Text>
                </TouchableOpacity>
              )}

              {/* Check-out CTA */}
              {isCheckedIn && !isCheckedOut && (
                <TouchableOpacity
                  className="mt-3 bg-green-600 rounded-xl py-2.5 items-center"
                  onPress={() => router.push('/qr-scan')}
                >
                  <Text className="text-white font-medium text-sm">Scan QR to Check Out</Text>
                </TouchableOpacity>
              )}

              {/* Post-shift actions: rate + dispute */}
              {showPostShift && (
                <View className="flex-row gap-x-2 mt-3">
                  <TouchableOpacity
                    className="flex-1 border border-primary-600 rounded-xl py-2.5 items-center"
                    onPress={() => handleOpenRating(item)}
                  >
                    <Text className="text-primary-600 font-medium text-sm">⭐ Rate Shift</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 border border-red-300 rounded-xl py-2.5 items-center"
                    onPress={() => setDisputeApp(item)}
                  >
                    <Text className="text-red-500 font-medium text-sm">⚠ Report Issue</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View className="items-center py-16">
              <Text className="text-4xl mb-3">📋</Text>
              <Text className="text-gray-500">No applications yet.</Text>
            </View>
          ) : null
        }
      />

      {/* Rating modal */}
      <RatingModal
        visible={ratingApp !== null}
        subjectName={ratingApp?.shifts?.businesses?.name ?? 'Business'}
        rateeLabel="Business"
        onSubmit={handleSubmitRating}
        onDismiss={() => setRatingApp(null)}
      />

      {/* Dispute modal */}
      {disputeApp && (
        <DisputeModal
          visible={disputeApp !== null}
          applicationId={disputeApp.id}
          raisedBy={profile?.id ?? ''}
          onClose={() => setDisputeApp(null)}
          onSubmitted={() => {
            setDisputeApp(null);
            refetch();
          }}
        />
      )}
    </View>
  );
}
