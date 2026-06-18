// context/NotificationsProvider.tsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';

import { useAuth } from '@/context/AuthProvider';
import { supabase } from '@/lib/supabase';
import { NotificationItem } from '@/types/notifications';

// Centralizes the public-announcement notifications plus the per-user read
// status (which lives in `notification_read_status`, since the `notifications`
// table itself has no `is_read` column). Both the Header bell indicator and the
// notifications screen consume this so they stay in sync when items are read.
type NotificationsContextType = {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markAsRead: (notification: NotificationItem) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const appStateRef = useRef(AppState.currentState);
  const { session } = useAuth();
  const userId = session?.user?.id;

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);

      if (!userId) {
        // If not logged in, just fetch notifications without read status
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .is('user_id', null)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching notifications:', error);
          return;
        }

        const notificationsWithReadStatus = (data || []).map((notification) => ({
          ...notification,
          created_at: notification.created_at || '',
          is_read: false, // If not logged in, treat all as unread
        }));

        setNotifications(notificationsWithReadStatus);
      } else {
        // If logged in, fetch notifications and join with read status
        // First get all notifications
        const { data: notificationsData, error: notificationsError } = await supabase
          .from('notifications')
          .select('*')
          .is('user_id', null)
          .order('created_at', { ascending: false });

        if (notificationsError) {
          console.error('Error fetching notifications:', notificationsError);
          return;
        }

        // Then get all read statuses for this user
        const { data: readStatusData, error: readStatusError } = await supabase
          .from('notification_read_status')
          .select('notification_id')
          .eq('user_id', userId);

        if (readStatusError) {
          console.error('Error fetching read status:', readStatusError);
          return;
        }

        // Convert read status data to a Set for faster lookups
        const readNotificationIds = new Set((readStatusData || []).map((status) => status.notification_id));

        // Combine the data
        const notificationsWithReadStatus = (notificationsData || []).map((notification) => ({
          ...notification,
          created_at: notification.created_at || '',
          is_read: readNotificationIds.has(notification.id),
        }));

        setNotifications(notificationsWithReadStatus);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();

    // Set up a subscription to listen for new announcements
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: 'user_id=is.null', // Only listen for public announcements
        },
        (payload) => {
          // Add the new notification to our state
          const newNotification = {
            ...(payload.new as NotificationItem),
            is_read: false, // New notifications are unread by default
          };
          setNotifications((prev) => [newNotification, ...prev]);
        },
      )
      .subscribe();

    // Refresh when a push notification arrives in the foreground. Realtime alone
    // isn't reliable (it requires realtime to be enabled on the table and misses
    // notifications delivered while backgrounded), so we re-fetch on the push
    // that the backend sends alongside each new notification.
    const notificationListener = Notifications.addNotificationReceivedListener(() => {
      fetchNotifications();
    });

    // Refresh when the app returns to the foreground, catching anything that
    // arrived while it was backgrounded.
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        fetchNotifications();
      }
      appStateRef.current = nextState;
    });

    return () => {
      supabase.removeChannel(channel);
      notificationListener.remove();
      appStateSubscription.remove();
    };
  }, [fetchNotifications]);

  const markAsRead = async (notification: NotificationItem) => {
    if (!notification.is_read && session?.user) {
      try {
        // Create a user-specific read status for this notification
        const { error } = await supabase.from('notification_read_status').insert({
          notification_id: notification.id,
          user_id: session.user.id,
        });

        if (error && error.code !== '23505') {
          // Ignore unique violation errors
          console.error('Error marking notification as read:', error);
          return;
        }

        // Update local state
        setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)));
      } catch (error) {
        console.error('Unexpected error:', error);
      }
    }
  };

  const markAllAsRead = async () => {
    if (!session?.user) return;

    const unread = notifications.filter((n) => !n.is_read);
    if (unread.length === 0) return;

    try {
      // Insert a read status row for every currently-unread notification
      const { error } = await supabase.from('notification_read_status').insert(
        unread.map((n) => ({
          notification_id: n.id,
          user_id: session.user.id,
        })),
      );

      if (error && error.code !== '23505') {
        // Ignore unique violation errors (already-read items)
        console.error('Error marking all notifications as read:', error);
        return;
      }

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  const unreadCount = notifications.reduce((count, n) => (n.is_read ? count : count + 1), 0);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refresh: fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
