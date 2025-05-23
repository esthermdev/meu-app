// app/(tabs)/home/notifications.tsx
import { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  created_at: string;
  is_read: boolean;
}

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

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
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      // Less than a minute ago
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      // Less than an hour ago
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      // Less than a day ago
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      // More than a day ago
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity style={styles.notificationItem} onPress={() => handleNotificationPress(item)}>
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="bullhorn" size={24} color="#EA1D25" />
        </View>
      </View>
      <View style={styles.contentContainer}>
        <CustomText style={styles.notificationTitle} allowFontScaling maxFontSizeMultiplier={1.2}>{item.title}</CustomText>
        <CustomText allowFontScaling maxFontSizeMultiplier={1.2}>{item.message}</CustomText>
        <CustomText style={styles.notificationTime} allowFontScaling maxFontSizeMultiplier={1.2}>{formatDate(item.created_at)}</CustomText>
      </View>
      {!item.is_read && (
        <View style={styles.unreadIndicator} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>      
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
          <CustomText style={styles.emptyText}>No announcements yet</CustomText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 20
  },
  notificationItem: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
    paddingVertical: 15
  },
  iconContainer: {
    marginRight: 15,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F2F2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  notificationTitle: {
    ...typography.textBold,
    color: '#333',
  },
  notificationMessage: {
    ...typography.text
  },
  notificationTime: {
    ...typography.textSmall,
    color: '#969696',
    marginTop: 4
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f5a623',
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#888',
    marginTop: 16,
    ...typography.textMedium
  },
});

export default NotificationScreen;