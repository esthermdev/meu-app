// app/(tabs)/home/notifications.tsx
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';
import { useAuth } from '@/context/AuthProvider';
import { useNotifications } from '@/context/NotificationsProvider';
import { NotificationItem } from '@/types/notifications';

import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

const NotificationScreen = () => {
  const { session } = useAuth();
  const { notifications, unreadCount, loading, refresh, markAsRead, markAllAsRead } = useNotifications();

  // Refresh whenever the screen comes into focus so newly-arrived notifications
  // appear without the user having to pull to refresh.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleNotificationPress = (notification: NotificationItem) => {
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
        minute: '2-digit',
      });
    }
  };

  const renderNotification = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity style={styles.notificationItem} onPress={() => handleNotificationPress(item)}>
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="bullhorn" size={24} color="#EA1D25" />
        </View>
      </View>
      <View style={styles.contentContainer}>
        <CustomText style={styles.notificationTitle} allowFontScaling maxFontSizeMultiplier={1.2}>
          {item.title}
        </CustomText>
        <CustomText allowFontScaling maxFontSizeMultiplier={1.2}>
          {item.message}
        </CustomText>
        <CustomText style={styles.notificationTime} allowFontScaling maxFontSizeMultiplier={1.2}>
          {formatDate(item.created_at)}
        </CustomText>
      </View>
      {!item.is_read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {!session?.user && (
        <View style={styles.signInBanner}>
          <MaterialCommunityIcons name="information-outline" size={18} color="#EA1D25" />
          <CustomText style={styles.signInText}>
            <CustomText style={styles.signInLink} onPress={() => router.push('/sign-in')}>
              Sign in
            </CustomText>{' '}
            to mark notifications as read.
          </CustomText>
        </View>
      )}
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
          onRefresh={refresh}
          ListHeaderComponent={
            session?.user && unreadCount > 0 ? (
              <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
                <MaterialCommunityIcons name="check-all" size={18} color="#EA1D25" />
                <CustomText style={styles.markAllText}>Mark all as read</CustomText>
              </TouchableOpacity>
            ) : null
          }
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
  notificationItem: {
    alignItems: 'center',
    borderBottomColor: '#e0e0e0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 15,
  },
  iconContainer: {
    marginRight: 15,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  contentContainer: {
    flex: 1,
  },
  notificationTitle: {
    ...typography.textBold,
    color: '#333',
  },
  notificationTime: {
    ...typography.textSmall,
    color: '#969696',
    marginTop: 4,
  },
  unreadIndicator: {
    backgroundColor: '#f5a623',
    borderRadius: 4,
    height: 8,
    marginLeft: 10,
    width: 8,
  },
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#888',
    marginTop: 16,
    ...typography.textMedium,
  },
  divider: {
    backgroundColor: '#e0e0e0',
    height: 1,
    width: '100%',
  },
  notificationMessage: {
    ...typography.text,
  },
  markAllButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    paddingVertical: 5,
  },
  markAllText: {
    ...typography.textSmall,
    color: '#EA1D25',
  },
  signInBanner: {
    alignItems: 'center',
    backgroundColor: '#FDECEC',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  signInText: {
    ...typography.textSmall,
    color: '#333',
    flex: 1,
  },
  signInLink: {
    color: '#EA1D25',
    textDecorationLine: 'underline',
  },
});

export default NotificationScreen;
