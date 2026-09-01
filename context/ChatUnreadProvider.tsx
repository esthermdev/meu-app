// context/ChatUnreadProvider.tsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';

import { useAuth } from '@/context/AuthProvider';
import { supabase } from '@/lib/supabase';

// Tracks whether the signed-in user has admin replies they haven't seen yet, so
// the Header chat icon can show an indicator the same way the bell does. Read
// state lives in `conversations.user_last_read_at` (the mirror of the admin's
// `admin_last_read_at`), and the chat screen calls `markRead` while it's open.
type ChatUnreadContextType = {
  hasUnread: boolean;
  refresh: () => Promise<void>;
  markRead: () => Promise<void>;
};

const ChatUnreadContext = createContext<ChatUnreadContextType | undefined>(undefined);

export function ChatUnreadProvider({ children }: { children: React.ReactNode }) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const appStateRef = useRef(AppState.currentState);
  const { session } = useAuth();
  const userId = session?.user?.id;

  // Resolve the user's conversation (it only exists once they've sent a first
  // message) and check for messages from anyone else since their last read.
  const refresh = useCallback(async () => {
    if (!userId) {
      setConversationId(null);
      setHasUnread(false);
      return;
    }

    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id, user_last_read_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (conversationError) {
      console.error('Error loading conversation for unread check:', conversationError);
      return;
    }

    if (!conversation) {
      setConversationId(null);
      setHasUnread(false);
      return;
    }

    setConversationId(conversation.id);

    let unreadQuery = supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversation.id)
      .neq('sender_id', userId)
      .limit(1);

    if (conversation.user_last_read_at) {
      unreadQuery = unreadQuery.gt('created_at', conversation.user_last_read_at);
    }

    const { data: unreadMessages, error: unreadError } = await unreadQuery;

    if (unreadError) {
      console.error('Error checking for unread messages:', unreadError);
      return;
    }

    setHasUnread((unreadMessages ?? []).length > 0);
  }, [userId]);

  const markRead = useCallback(async () => {
    if (!userId) return;

    // The conversation may have just been created by the user's first message,
    // so resolve it before writing rather than relying on cached state.
    let convId = conversationId;
    if (!convId) {
      const { data } = await supabase.from('conversations').select('id').eq('user_id', userId).maybeSingle();
      if (!data) return;
      convId = data.id;
      setConversationId(convId);
    }

    setHasUnread(false);

    const { error } = await supabase
      .from('conversations')
      .update({ user_last_read_at: new Date().toISOString() })
      .eq('id', convId);

    if (error) {
      console.error('Error marking chat as read:', error);
    }
  }, [conversationId, userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Live updates while the app is open: any message in this conversation that
  // the user didn't send is an unread admin reply.
  useEffect(() => {
    if (!conversationId || !userId) return;

    const channel = supabase
      .channel(`chat-unread-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if ((payload.new as { sender_id?: string }).sender_id !== userId) {
            setHasUnread(true);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId]);

  useEffect(() => {
    // Realtime alone isn't reliable (it misses anything delivered while
    // backgrounded), so also re-check on the push the backend sends with each
    // admin reply and whenever the app returns to the foreground.
    const notificationListener = Notifications.addNotificationReceivedListener(() => {
      refresh();
    });

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        refresh();
      }
      appStateRef.current = nextState;
    });

    return () => {
      notificationListener.remove();
      appStateSubscription.remove();
    };
  }, [refresh]);

  return <ChatUnreadContext.Provider value={{ hasUnread, refresh, markRead }}>{children}</ChatUnreadContext.Provider>;
}

export function useChatUnread() {
  const context = useContext(ChatUnreadContext);
  if (context === undefined) {
    throw new Error('useChatUnread must be used within a ChatUnreadProvider');
  }
  return context;
}
