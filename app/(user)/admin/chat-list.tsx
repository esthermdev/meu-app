import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';

import CustomText from '@/components/CustomText';
import ConversationListItem from '@/components/features/chat/ConversationListItem';
import { fonts, fontSizes } from '@/constants/Typography';
import { useAuth } from '@/context/AuthProvider';
import { useAdminConversations } from '@/hooks/useChat';
import { supabase } from '@/lib/supabase';

export default function AdminChatListScreen() {
  const { user } = useAuth();
  const { conversations, loading, refresh } = useAdminConversations();
  const [refreshing, setRefreshing] = useState(false);
  const [adminChatNotificationsEnabled, setAdminChatNotificationsEnabled] = useState(true);
  const [updatingPreference, setUpdatingPreference] = useState(false);

  const fetchAdminChatNotificationPreference = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase.from('profiles').select('is_chat_online').eq('id', user.id).maybeSingle();

    if (error) {
      console.error('Error loading admin chat notification preference:', error);
      return;
    }

    setAdminChatNotificationsEnabled(data?.is_chat_online ?? true);
  }, [user?.id]);

  useEffect(() => {
    fetchAdminChatNotificationPreference();
  }, [fetchAdminChatNotificationPreference]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), fetchAdminChatNotificationPreference()]);
    setRefreshing(false);
  }, [fetchAdminChatNotificationPreference, refresh]);

  const handleToggleAdminChatNotifications = async (nextValue: boolean) => {
    if (!user?.id || updatingPreference) return;

    const previousValue = adminChatNotificationsEnabled;
    setAdminChatNotificationsEnabled(nextValue);
    setUpdatingPreference(true);

    const { error } = await supabase.from('profiles').update({ is_chat_online: nextValue }).eq('id', user.id);

    if (error) {
      console.error('Error updating admin chat notification preference:', error);
      setAdminChatNotificationsEnabled(previousValue);
    }

    setUpdatingPreference(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#EA1D25" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationListItem conversation={item} onPress={() => router.push(`/(user)/admin/chat/${item.id}`)} />
        )}
        onRefresh={onRefresh}
        refreshing={refreshing}
        ListHeaderComponent={
          <View style={styles.toggleCard}>
            <View style={styles.toggleRow}>
              <CustomText
                style={[styles.toggleStatus, { color: adminChatNotificationsEnabled ? '#59DE07' : '#EA1D25' }]}>
                {adminChatNotificationsEnabled ? 'Online' : 'Offline'}
              </CustomText>
              <Switch
                value={adminChatNotificationsEnabled}
                onValueChange={handleToggleAdminChatNotifications}
                disabled={updatingPreference}
                trackColor={{ false: '#EA1D25', true: '#D6F5D6' }}
                thumbColor={adminChatNotificationsEnabled ? '#59DE07' : '#828282'}
              />
            </View>
            <CustomText style={styles.toggleHelpText}>Go offline to pause chat notifications.</CustomText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CustomText style={styles.emptyText}>No conversations yet</CustomText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  toggleCard: {
    backgroundColor: '#F8F8F8',
    borderColor: '#E3E3E3',
    borderRadius: 12,
    borderWidth: 1,
    margin: 12,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  toggleTitle: {
    color: '#111',
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toggleStatus: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
  },
  toggleHelpText: {
    color: '#666',
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    marginTop: 6,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 40,
    paddingTop: 80,
  },
  emptyText: {
    color: '#999',
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
});
