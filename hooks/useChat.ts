import { useCallback, useEffect, useRef, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { ConversationWithUser, MessageWithSender } from '@/types/chat';

import { RealtimeChannel } from '@supabase/supabase-js';

// Cast to any for new tables not yet in database.types.ts
// Remove after running: npm run schema:sync
const db = supabase as any;

const mergeUniqueMessages = (messages: MessageWithSender[]) => {
  const messageMap = new Map<string, MessageWithSender>();

  messages.forEach((message) => {
    messageMap.set(message.id, message);
  });

  return Array.from(messageMap.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
};

/**
 * Hook for user-side chat: manages a single conversation with the admin team.
 */
export function useChat(userId: string | undefined) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Load or create conversation
  const initConversation = useCallback(async () => {
    if (!userId) return;
    try {
      // Try to find existing conversation
      const { data: existing } = await db.from('conversations').select('id').eq('user_id', userId).maybeSingle();

      if (existing) {
        setConversationId(existing.id);
      }
      // If no conversation exists, we'll create it on first message send
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load messages for a conversation
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    const { data, error } = await db
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(id, full_name)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(mergeUniqueMessages((data as MessageWithSender[]) ?? []));
  }, [conversationId]);

  // Subscribe to new messages via realtime
  useEffect(() => {
    if (!conversationId) return;

    loadMessages();

    channelRef.current = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch the full message with sender info
          const { data } = await db
            .from('messages')
            .select('*, sender:profiles!messages_sender_id_fkey(id, full_name)')
            .eq('id', (payload.new as any).id)
            .single();

          if (data) {
            setMessages((prev) => mergeUniqueMessages([...prev, data as MessageWithSender]));
          }
        },
      )
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [conversationId, loadMessages]);

  // Initialize on mount
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    initConversation();
  }, [initConversation, userId]);

  // Send a message (creates conversation if needed)
  const sendMessage = useCallback(
    async (content: string | null, imageUrl: string | null) => {
      if (!userId) return;
      if (!content && !imageUrl) return;

      let convId = conversationId;

      // Create conversation on first message
      if (!convId) {
        const { data: newConv, error: convError } = await db
          .from('conversations')
          .upsert({ user_id: userId }, { onConflict: 'user_id' })
          .select('id')
          .single();

        if (convError || !newConv) {
          console.error('Error creating conversation:', convError);
          return;
        }
        convId = newConv.id;
        setConversationId(convId);
      }

      // Insert message
      const { error } = await db.from('messages').insert({
        conversation_id: convId,
        sender_id: userId,
        content,
        image_url: imageUrl,
      });

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      const { error: notificationError } = await supabase.functions.invoke('admin-chat-message', {
        body: {
          conversationId: convId,
          senderId: userId,
        },
      });

      if (notificationError) {
        console.error('Error sending admin chat notification:', notificationError);
      }

      // Update conversation timestamp
      await db.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId);
    },
    [userId, conversationId],
  );

  // Clear all messages in the conversation
  const clearMessages = useCallback(async () => {
    if (!conversationId) return;

    const { error } = await db.from('messages').delete().eq('conversation_id', conversationId);

    if (error) {
      console.error('Error clearing messages:', error);
      return;
    }

    setMessages([]);
  }, [conversationId]);

  return { messages, loading, sendMessage, conversationId, clearMessages };
}

/**
 * Hook for admin-side: list all conversations with latest message.
 */
export function useAdminConversations() {
  const [conversations, setConversations] = useState<ConversationWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadConversations = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const { data, error } = await db
        .from('conversations')
        .select('*, user:profiles!conversations_user_id_fkey(id, full_name)')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }

      // Fetch last message for each conversation
      const convos = await Promise.all(
        (data ?? []).map(async (conv: any) => {
          const { data: lastMsg } = await db
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Check if there are unread messages (last message newer than admin_last_read_at)
          const hasUnread =
            lastMsg && (!conv.admin_last_read_at || new Date(lastMsg.created_at) > new Date(conv.admin_last_read_at));

          return { ...conv, last_message: lastMsg, has_unread: !!hasUnread } as ConversationWithUser;
        }),
      );

      setConversations(convos);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations(true);

    channelRef.current = supabase
      .channel('admin-conversations-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          loadConversations();
        },
      )
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [loadConversations]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    const { error } = await db.from('conversations').delete().eq('id', conversationId);

    if (error) {
      console.error('Error deleting conversation:', error);
      return { error };
    }

    setConversations((prev) => prev.filter((conversation) => conversation.id !== conversationId));
    return { error: null };
  }, []);

  return { conversations, loading, refresh: loadConversations, deleteConversation };
}

/**
 * Hook for admin-side: view a single conversation's messages.
 */
export function useAdminChat(conversationId: string) {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadMessages = useCallback(async () => {
    const { data, error } = await db
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(id, full_name)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(mergeUniqueMessages((data as MessageWithSender[]) ?? []));
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    loadMessages();

    channelRef.current = supabase
      .channel(`admin-chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const { data } = await db
            .from('messages')
            .select('*, sender:profiles!messages_sender_id_fkey(id, full_name)')
            .eq('id', (payload.new as any).id)
            .single();

          if (data) {
            setMessages((prev) => mergeUniqueMessages([...prev, data as MessageWithSender]));
          }
        },
      )
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [conversationId, loadMessages]);

  const sendMessage = useCallback(
    async (senderId: string, content: string | null, imageUrl: string | null) => {
      if (!content && !imageUrl) return;

      const { error } = await db.from('messages').insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        image_url: imageUrl,
      });

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      const { error: notificationError } = await supabase.functions.invoke('user-chat-message', {
        body: {
          conversationId,
          senderId,
        },
      });

      if (notificationError) {
        console.error('Error sending user chat notification:', notificationError);
      }

      await db.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);
    },
    [conversationId],
  );

  const markRead = useCallback(async () => {
    await db.from('conversations').update({ admin_last_read_at: new Date().toISOString() }).eq('id', conversationId);
  }, [conversationId]);

  return { messages, loading, sendMessage, markRead };
}
