import { useState } from 'react';
import {
  View, Text, FlatList, RefreshControl, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNearbyShifts } from '../../hooks/useShifts';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { formatPHP } from '../../lib/payments';
import { formatDistanceToNow } from 'date-fns';
import type { Shift, Sector } from '../../types';

const SECTORS: Sector[] = [
  'Retail', 'Logistics', 'Food & Beverage', 'Healthcare',
  'Administrative', 'Catering', 'Events', 'Cleaning',
];

type AiMatch = {
  shift_id: string;
  fit_score: number;
  match_reason: string;
  shift: Shift;
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'bg-secondary-500' :
    score >= 60 ? 'bg-yellow-500' :
    'bg-gray-400';
  return (
    <View className={`${color} rounded-lg px-2 py-0.5 items-center`}>
      <Text className="text-white text-xs font-bold">{score}</Text>
    </View>
  );
}

function ShiftCard({
  shift, onPress, aiMatch,
}: {
  shift: Shift;
  onPress: () => void;
  aiMatch?: AiMatch;
}) {
  const hoursTotal = (
    (new Date(shift.time_end).getTime() - new Date(shift.time_start).getTime()) / 3600000
  ).toFixed(1);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-800">{shift.title}</Text>
          <Text className="text-sm text-gray-500 mt-0.5">
            {(shift as any).businesses?.name ?? 'Business'}
          </Text>
        </View>
        <View className="flex-row items-center gap-x-2">
          {aiMatch && <ScoreBadge score={aiMatch.fit_score} />}
          <View className="bg-primary-50 rounded-lg px-3 py-1">
            <Text className="text-primary-600 font-bold text-sm">
              {formatPHP(shift.hourly_rate)}/hr
            </Text>
          </View>
        </View>
      </View>

      {aiMatch && (
        <View className="bg-secondary-50 rounded-lg px-3 py-1.5 mb-2 flex-row items-center gap-x-1.5">
          <Text className="text-xs">✨</Text>
          <Text className="text-secondary-700 text-xs flex-1">{aiMatch.match_reason}</Text>
        </View>
      )}

      <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
        {shift.description ?? shift.role_required}
      </Text>

      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-gray-400">📍 {shift.address}</Text>
        <Text className="text-xs text-gray-400">{hoursTotal}h shift</Text>
      </View>

      <View className="flex-row items-center justify-between mt-2">
        <Text className="text-xs text-primary-600 font-medium">
          {formatDistanceToNow(new Date(shift.time_start), { addSuffix: true })}
        </Text>
        <Text className="text-xs text-gray-400">
          {shift.slots - shift.slots_filled} slot{shift.slots - shift.slots_filled !== 1 ? 's' : ''} left
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function WorkerFeedScreen() {
  const router      = useRouter();
  const { profile } = useAuthStore();
  const { shifts, loading, error, refetch } = useNearbyShifts(5000);
  const { unreadCount } = useNotifications(profile?.id ?? '');

  const [activeSector, setActiveSector]   = useState<Sector | null>(null);
  const [aiMatches, setAiMatches]         = useState<AiMatch[] | null>(null);
  const [aiLoading, setAiLoading]         = useState(false);
  const [aiError, setAiError]             = useState<string | null>(null);

  async function handleAiMatch() {
    if (!profile?.id) return;
    setAiLoading(true);
    setAiError(null);
    setAiMatches(null);
    setActiveSector(null);

    const { data, error: fnErr } = await supabase.functions.invoke('ai-match', {
      body: { worker_id: profile.id },
    });

    if (fnErr || data?.error) {
      setAiError(data?.error ?? 'AI matching failed. Please try again.');
    } else {
      setAiMatches(data.matches ?? []);
    }
    setAiLoading(false);
  }

  function clearAiMatches() {
    setAiMatches(null);
    setAiError(null);
  }

  // Build displayed list: AI-ranked order or sector-filtered normal order
  const displayedShifts: Array<{ shift: Shift; aiMatch?: AiMatch }> = (() => {
    if (aiMatches) {
      return aiMatches.map((m) => ({ shift: m.shift, aiMatch: m }));
    }
    const filtered = activeSector ? shifts.filter((s) => s.sector === activeSector) : shifts;
    return filtered.map((s) => ({ shift: s }));
  })();

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-gray-500 text-center">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100 flex-row items-end justify-between">
        <View>
          <Text className="text-2xl font-bold text-gray-800">Nearby Shifts</Text>
          <Text className="text-gray-500 text-sm mt-1">Within 5km of your location</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(worker)/notifications' as any)}
          className="mb-1 relative"
        >
          <Text className="text-2xl">🔔</Text>
          {unreadCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-4 h-4 items-center justify-center px-0.5">
              <Text className="text-white text-xs font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* AI Match banner */}
      {!aiMatches && (
        <TouchableOpacity
          onPress={handleAiMatch}
          disabled={aiLoading}
          className="mx-4 mt-3 bg-primary-600 rounded-2xl px-4 py-3 flex-row items-center justify-center gap-x-2"
        >
          {aiLoading ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text className="text-white font-semibold text-sm">Finding your best matches...</Text>
            </>
          ) : (
            <>
              <Text className="text-lg">✨</Text>
              <Text className="text-white font-semibold text-sm">Find My Best Matches (AI)</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* AI error */}
      {aiError && (
        <View className="mx-4 mt-2 bg-red-50 rounded-xl px-4 py-3 flex-row items-center justify-between">
          <Text className="text-red-600 text-xs flex-1">{aiError}</Text>
          <TouchableOpacity onPress={clearAiMatches}>
            <Text className="text-red-400 text-xs ml-2">Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* AI results header */}
      {aiMatches && (
        <View className="mx-4 mt-3 bg-secondary-50 border border-secondary-100 rounded-2xl px-4 py-3 flex-row items-center justify-between">
          <View>
            <Text className="text-secondary-700 font-semibold text-sm">AI Ranking Active</Text>
            <Text className="text-secondary-600 text-xs mt-0.5">
              {aiMatches.length} shifts ranked by fit score
            </Text>
          </View>
          <TouchableOpacity onPress={clearAiMatches} className="bg-white rounded-lg px-3 py-1.5 border border-secondary-200">
            <Text className="text-secondary-600 text-xs font-medium">Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sector filter chips (hidden when AI ranking is active) */}
      {!aiMatches && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
          className="bg-white border-b border-gray-100"
        >
          <TouchableOpacity
            onPress={() => setActiveSector(null)}
            style={{ minWidth: 48 }}
            className={`px-4 py-1.5 rounded-full border items-center ${
              activeSector === null ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
            }`}
          >
            <Text className={`text-xs font-medium ${activeSector === null ? 'text-white' : 'text-gray-600'}`}>
              All
            </Text>
          </TouchableOpacity>
          {SECTORS.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setActiveSector(activeSector === s ? null : s)}
              style={{ minWidth: 72 }}
              className={`px-4 py-1.5 rounded-full border items-center ${
                activeSector === s ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
              }`}
            >
              <Text className={`text-xs font-medium ${activeSector === s ? 'text-white' : 'text-gray-600'}`}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <FlatList
        data={displayedShifts}
        keyExtractor={(item) => item.shift.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <ShiftCard
            shift={item.shift}
            aiMatch={item.aiMatch}
            onPress={() => router.push(`/(worker)/shift/${item.shift.id}`)}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <View className="items-center py-16">
              <Text className="text-4xl mb-3">🔍</Text>
              <Text className="text-gray-500 text-center">No open shifts nearby right now.</Text>
              <Text className="text-gray-400 text-sm text-center mt-1">Pull to refresh.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
