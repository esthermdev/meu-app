import { useEffect, useRef } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import CustomText from '@/components/CustomText';
import ChatBubble from '@/components/features/chat/ChatBubble';
import ChatInput from '@/components/features/chat/ChatInput';
import { fonts, fontSizes } from '@/constants/Typography';
import { useAuth } from '@/context/AuthProvider';
import { useAdminChat } from '@/hooks/useChat';
import { useChatImageUpload } from '@/hooks/useChatImageUpload';
import { MessageWithSender } from '@/types/chat';

export default function AdminChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { user } = useAuth();
  const { messages, loading, sendMessage, markRead } = useAdminChat(conversationId);
  const { pickAndUploadImage, uploading } = useChatImageUpload(conversationId);
  const flatListRef = useRef<FlatList<MessageWithSender>>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      markRead();
    }
  }, [messages.length, markRead]);

  const handleSend = async (content: string | null, imageUrl: string | null) => {
    if (!user?.id) return;
    await sendMessage(user.id, content, imageUrl);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#EA1D25" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatBubble message={item} isOwnMessage={item.sender_id === user?.id} />}
        contentContainerStyle={styles.messagesList}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CustomText style={styles.emptyText}>No messages in this conversation yet</CustomText>
          </View>
        }
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />
      <ChatInput onSend={handleSend} onPickImage={pickAndUploadImage} uploading={uploading} />
    </KeyboardAvoidingView>
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
  messagesList: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingVertical: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#999',
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
});
