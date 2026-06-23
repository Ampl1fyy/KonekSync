/**
 * Shared chat UI used by both worker and business routes.
 * Renders a full-screen message thread for a given application.
 */

import { useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMessages } from '../hooks/useMessages';
import { format, isToday, isYesterday } from 'date-fns';
import type { Message } from '../types';

interface Props {
  applicationId: string;
  currentUserId: string;
  /** Display name for the header, e.g. "Chat with Juan" */
  headerTitle: string;
}

export default function ChatScreen({ applicationId, currentUserId, headerTitle }: Props) {
  const router = useRouter();
  const { messages, loading, sendMessage } = useMessages(applicationId, currentUserId);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setDraft('');
    const { error } = await sendMessage(text);
    setSending(false);

    if (error) {
      Alert.alert('Failed to send', error);
      setDraft(text); // restore on failure
    }
  }

  function scrollToBottom() {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mb-2">
          <Text className="text-primary-600 font-medium">← Back</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800">{headerTitle}</Text>
      </View>

      {/* Messages */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={scrollToBottom}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-16">
              <Text className="text-3xl mb-2">💬</Text>
              <Text className="text-gray-500 text-sm">No messages yet. Say hello!</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <MessageBubble
              message={item}
              isMine={item.sender_id === currentUserId}
              showDateSeparator={shouldShowDateSeparator(messages, index)}
            />
          )}
        />
      )}

      {/* Input bar */}
      <View className="bg-white border-t border-gray-100 px-4 py-3 flex-row items-end gap-x-3">
        <TextInput
          className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-base max-h-28"
          placeholder="Type a message..."
          value={draft}
          onChangeText={setDraft}
          multiline
          textAlignVertical="top"
          returnKeyType="default"
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!draft.trim() || sending}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            draft.trim() ? 'bg-primary-600' : 'bg-gray-300'
          }`}
        >
          {sending ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="text-white font-bold text-lg">↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MessageBubble({
  message, isMine, showDateSeparator,
}: {
  message: Message;
  isMine: boolean;
  showDateSeparator: boolean;
}) {
  const senderName = (message as any).profiles?.full_name ?? 'Unknown';
  const time = format(new Date(message.created_at), 'h:mm a');

  return (
    <>
      {showDateSeparator && (
        <DateSeparator date={new Date(message.created_at)} />
      )}
      <View className={`mb-3 max-w-[80%] ${isMine ? 'self-end' : 'self-start'}`}>
        {!isMine && (
          <Text className="text-xs text-gray-400 mb-1 ml-1">{senderName}</Text>
        )}
        <View
          className={`px-4 py-2.5 rounded-2xl ${
            isMine
              ? 'bg-primary-600 rounded-br-sm'
              : 'bg-white border border-gray-100 rounded-bl-sm'
          }`}
        >
          <Text className={`text-sm leading-5 ${isMine ? 'text-white' : 'text-gray-800'}`}>
            {message.body}
          </Text>
        </View>
        <Text className={`text-xs text-gray-400 mt-0.5 ${isMine ? 'text-right mr-1' : 'ml-1'}`}>
          {time}
        </Text>
      </View>
    </>
  );
}

function DateSeparator({ date }: { date: Date }) {
  let label: string;
  if (isToday(date))     label = 'Today';
  else if (isYesterday(date)) label = 'Yesterday';
  else                   label = format(date, 'MMMM d, yyyy');

  return (
    <View className="flex-row items-center my-4 gap-x-3">
      <View className="flex-1 h-px bg-gray-200" />
      <Text className="text-xs text-gray-400">{label}</Text>
      <View className="flex-1 h-px bg-gray-200" />
    </View>
  );
}

// Show a date separator when the current message's date differs from the previous one
function shouldShowDateSeparator(messages: Message[], index: number): boolean {
  if (index === 0) return true;
  const prev = new Date(messages[index - 1].created_at);
  const curr = new Date(messages[index].created_at);
  return prev.toDateString() !== curr.toDateString();
}
