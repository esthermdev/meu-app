import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { Redirect, router } from 'expo-router';

import CustomText from '@/components/CustomText';
import ConversationListItem from '@/components/features/chat/ConversationListItem';
import { fonts, fontSizes } from '@/constants/Typography';
import { useAuth } from '@/context/AuthProvider';
import { hasRole } from '@/context/profileRoles';
import { useAdminConversations } from '@/hooks/useChat';
import { supabase } from '@/lib/supabase';

import Swipeable from 'react-native-gesture-handler/Swipeable';

export default function AdminChatListScreen() {
  const { user, profile } = useAuth();
  const { conversations, loading, refresh, deleteConversation } = useAdminConversations();
  const [refreshing, setRefreshing] = useState(false);
  const [adminChatNotificationsEnabled, setAdminChatNotificationsEnabled] = useState(true);
  const [updatingPreference, setUpdatingPreference] = useState(false);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);

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

  const handleDeleteConversation = useCallback(
    async (conversationId: string) => {
      if (deletingConversationId) return;

      setDeletingConversationId(conversationId);
      const { error } = await deleteConversation(conversationId);

      setDeletingConversationId((currentId) => (currentId === conversationId ? null : currentId));

      if (error) {
        Alert.alert('Delete failed', 'Could not delete this conversation. Please try again.');
      }
    },
    [deleteConversation, deletingConversationId],
  );

  const confirmDeleteConversation = useCallback(
    (conversationId: string) => {
      Alert.alert(
        'Delete conversation?',
        'This will permanently delete the conversation and all messages for this user.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              void handleDeleteConversation(conversationId);
            },
          },
        ],
      );
    },
    [handleDeleteConversation],
  );

  const renderRightActions = useCallback(
    (conversationId: string) => {
      const isDeleting = deletingConversationId === conversationId;

      return (
        <View style={styles.rightActionsContainer}>
          <TouchableOpacity
            style={[styles.deleteAction, isDeleting && styles.deleteActionDisabled]}
            onPress={() => confirmDeleteConversation(conversationId)}
            disabled={isDeleting}
            activeOpacity={0.8}>
            {isDeleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <CustomText style={styles.deleteActionText}>Delete</CustomText>
            )}
          </TouchableOpacity>
        </View>
      );
    },
    [confirmDeleteConversation, deletingConversationId],
  );

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

  if (!profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#EA1D25" />
      </View>
    );
  }

  if (!hasRole(profile, 'admin')) {
    return <Redirect href="/(tabs)/profile" />;
  }

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
          <Swipeable overshootRight={false} rightThreshold={40} renderRightActions={() => renderRightActions(item.id)}>
            <ConversationListItem
              conversation={item}
              onPress={() => {
                if (deletingConversationId) return;
                router.push(`/(user)/chat/${item.id}`);
              }}
            />
          </Swipeable>
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
            <CustomText style={styles.toggleHelpText}>Going offline turns off notifications.</CustomText>
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
    padding: 10,
  },
  toggleRow: {
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
  rightActionsContainer: {
    alignItems: 'stretch',
    justifyContent: 'center',
    paddingVertical: 1,
  },
  deleteAction: {
    alignItems: 'center',
    backgroundColor: '#D81E1E',
    height: '100%',
    justifyContent: 'center',
    minWidth: 96,
    paddingHorizontal: 18,
  },
  deleteActionDisabled: {
    opacity: 0.85,
  },
  deleteActionText: {
    color: '#fff',
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
  },
});
