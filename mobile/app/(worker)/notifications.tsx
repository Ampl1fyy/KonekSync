/**
 * Notification center for workers.
 * Shows the last 50 notifications with an unread indicator.
 * Tapping any row marks it read; header button marks all read.
 */

import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import type { Notification } from '../../types';

export default function NotificationsScreen() {
  const router     = useRouter();
  const { profile } = useAuthStore();
  const { notifications, unreadCount, loading, markAllRead, markRead, refetch } =
    useNotifications(profile?.id ?? '');

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mb-2">
          <Text className="text-primary-600 font-medium">← Back</Text>
        </TouchableOpacity>
        <View className="flex-row justify-between items-center">
          <Text className="text-xl font-bold text-gray-800">Notifications</Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead}>
              <Text className="text-sm text-primary-600 font-medium">Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
          renderItem={({ item }) => (
            <NotificationRow notification={item} onPress={() => markRead(item.id)} />
          )}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="text-4xl mb-3">🔔</Text>
              <Text className="text-gray-500">No notifications yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function NotificationRow({
  notification, onPress,
}: {
  notification: Notification;
  onPress: () => void;
}) {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-5 py-4 border-b border-gray-100 flex-row items-start ${
        notification.is_read ? 'bg-white' : 'bg-indigo-50'
      }`}
    >
      {/* Unread dot */}
      <View className="mt-1.5 mr-3 w-2 h-2 rounded-full">
        {!notification.is_read && (
          <View className="w-2 h-2 rounded-full bg-primary-600" />
        )}
      </View>

      <View className="flex-1">
        <Text className={`text-sm font-semibold ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
          {notification.title}
        </Text>
        <Text className="text-sm text-gray-500 mt-0.5 leading-5">{notification.body}</Text>
        <Text className="text-xs text-gray-400 mt-1">{timeAgo}</Text>
      </View>
    </TouchableOpacity>
  );
}
