// app/(tabs)/home/notifications.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  created_at: string;
  is_read: boolean; // This will be derived from notification_read_status
}

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();
  const router = useRouter();

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
            ...payload.new as Notification,
            is_read: false // New notifications are unread by default
          };
          setNotifications(prev => [newNotification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      if (!session?.user) {
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
        
        const notificationsWithReadStatus = (data || []).map(notification => ({
          ...notification,
          created_at: notification.created_at || '',
          is_read: false // If not logged in, treat all as unread
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
          .eq('user_id', session.user.id);
        
        if (readStatusError) {
          console.error('Error fetching read status:', readStatusError);
          return;
        }
        
        // Convert read status data to a Set for faster lookups
        const readNotificationIds = new Set(
          (readStatusData || []).map(status => status.notification_id)
        );
        
        // Combine the data
        const notificationsWithReadStatus = (notificationsData || []).map(notification => ({
          ...notification,
          created_at: notification.created_at || '',
          is_read: readNotificationIds.has(notification.id)
        }));
        
        setNotifications(notificationsWithReadStatus);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notification: Notification) => {
    if (!notification.is_read && session?.user) {
      try {
        // Create a user-specific read status for this notification
        const { error } = await supabase
          .from('notification_read_status')
          .insert({
            notification_id: notification.id,
            user_id: session.user.id,
          });
          
        if (error && error.code !== '23505') { // Ignore unique violation errors
          console.error('Error marking notification as read:', error);
          return;
        }
        
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        );
      } catch (error) {
        console.error('Unexpected error:', error);
      }
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    markAsRead(notification);
    // You can add navigation logic here if you want announcements to link somewhere
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={[
        styles.notificationItem, 
        !item.is_read && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons name="campaign" size={24} color="#444" />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>{formatDate(item.created_at)}</Text>
      </View>
      {!item.is_read && (
        <View style={styles.unreadIndicator} />
      )}
    </TouchableOpacity>
  );

  const handleMarkAllAsRead = async () => {
    if (session?.user) {
      try {
        // Get all unread notification IDs
        const unreadNotifications = notifications
          .filter(n => !n.is_read)
          .map(n => ({ 
            notification_id: n.id, 
            user_id: session.user.id 
          }));
          
        if (unreadNotifications.length > 0) {
          const { error } = await supabase
            .from('notification_read_status')
            .upsert(unreadNotifications, { 
              onConflict: 'notification_id,user_id',
              ignoreDuplicates: true 
            });
            
          if (error) {
            console.error('Error marking all as read:', error);
            return;
          }
          
          // Update local state
          setNotifications(prev => 
            prev.map(n => ({ ...n, is_read: true }))
          );
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      }
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <Stack.Screen 
        options={{
          headerTitle: 'Announcements',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ marginLeft: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row' }}>
              {session?.user && (
                <TouchableOpacity 
                  onPress={handleMarkAllAsRead}
                  style={{ marginRight: 15 }}
                  disabled={notifications.filter(n => !n.is_read).length === 0}
                >
                  <Text 
                    style={{ 
                      color: notifications.filter(n => !n.is_read).length === 0 ? '#ccc' : '#EA1D25',
                      fontFamily: 'GeistMedium'
                    }}
                  >
                    Mark all read
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                onPress={fetchNotifications}
                style={{ marginRight: 10 }}
              >
                <MaterialIcons name="refresh" size={24} color="#000" />
              </TouchableOpacity>
            </View>
          )
        }} 
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA1D25" />
        </View>
      ) : notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchNotifications}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="campaign" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No announcements yet</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  unreadNotification: {
    backgroundColor: '#f8f8f8',
    borderLeftColor: '#EA1D25',
    borderLeftWidth: 4,
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  contentContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'GeistMedium',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
    fontFamily: 'GeistRegular',
  },
  notificationTime: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'GeistLight',
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EA1D25',
    alignSelf: 'flex-start',
    margin: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
    fontFamily: 'GeistMedium',
  },
});

export default NotificationScreen;