import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import CustomText from '@/components/CustomText';
import ConversationListItem from '@/components/features/chat/ConversationListItem';
import { fonts, fontSizes } from '@/constants/Typography';
import { useAdminConversations } from '@/hooks/useChat';

export default function AdminChatListScreen() {
  const { conversations, loading, refresh } = useAdminConversations();

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
        onRefresh={refresh}
        refreshing={loading}
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
