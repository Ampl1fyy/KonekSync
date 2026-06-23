import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Message } from '../types';

export function useMessages(applicationId: string, currentUserId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── Initial load + mark incoming as read ──────────────────────────────────
  const loadMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*, profiles:sender_id(id, full_name)')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: true });

    setMessages(data ?? []);
    setLoading(false);

    // Mark all messages from the other participant as read
    supabase
      .from('messages')
      .update({ is_read: true })
      .eq('application_id', applicationId)
      .neq('sender_id', currentUserId)
      .eq('is_read', false)
      .then(() => {});
  }, [applicationId, currentUserId]);

  // ─── Realtime subscription ─────────────────────────────────────────────────
  // IMPORTANT: Enable Realtime on the 'messages' table in Supabase Dashboard
  //   Dashboard → Database → Replication → Add table → messages
  useEffect(() => {
    if (!applicationId || !currentUserId) return;

    loadMessages();

    const channel = supabase
      .channel(`messages:${applicationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `application_id=eq.${applicationId}`,
        },
        async (payload) => {
          // Fetch the full row including the sender profile
          const { data } = await supabase
            .from('messages')
            .select('*, profiles:sender_id(id, full_name)')
            .eq('id', (payload.new as Message).id)
            .single();

          if (data) {
            setMessages((prev) => {
              // Deduplicate in case optimistic update already added it
              if (prev.some((m) => m.id === data.id)) return prev;
              return [...prev, data];
            });

            // Auto-mark as read if it's from the other participant
            if (data.sender_id !== currentUserId) {
              supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', data.id)
                .then(() => {});
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [applicationId, currentUserId, loadMessages]);

  // ─── Send message ──────────────────────────────────────────────────────────
  async function sendMessage(body: string): Promise<{ error: string | null }> {
    const trimmed = body.trim();
    if (!trimmed) return { error: 'Message cannot be empty.' };

    const { error } = await supabase.from('messages').insert({
      application_id: applicationId,
      sender_id:      currentUserId,
      body:           trimmed,
    });

    return { error: error?.message ?? null };
  }

  return { messages, loading, sendMessage };
}

// ─── Unread count across all applications for a user ─────────────────────────

export async function getUnreadMessageCount(userId: string): Promise<number> {
  // Count messages in applications the user participates in, not sent by them
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .neq('sender_id', userId)
    .eq('is_read', false);

  return count ?? 0;
}
