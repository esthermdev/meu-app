import { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { Redirect, useFocusEffect, useLocalSearchParams } from 'expo-router';

import CustomText from '@/components/CustomText';
import AdminChatInput from '@/components/features/chat/AdminChatInput';
import ChatBubble from '@/components/features/chat/ChatBubble';
import { fonts, fontSizes } from '@/constants/Typography';
import { useAuth } from '@/context/AuthProvider';
import { hasRole } from '@/context/profileRoles';
import { useAdminChat } from '@/hooks/useChat';
import { useChatImageUpload } from '@/hooks/useChatImageUpload';
import { MessageWithSender } from '@/types/chat';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const { messages, loading, sendMessage, markRead, deleteMessage, refreshMessages } = useAdminChat(conversationId);
  const { pickAndUploadImage, uploading } = useChatImageUpload(conversationId);
  const flatListRef = useRef<FlatList<MessageWithSender>>(null);

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      if (!user?.id) return;
      const { error } = await deleteMessage(messageId, user.id);
      if (error) {
        Alert.alert('Unable to delete', 'We could not delete this message. Please try again.');
      }
    },
    [deleteMessage, user?.id],
  );

  const scrollToBottom = useCallback((animated = false, delay = 0) => {
    const runScroll = () => flatListRef.current?.scrollToEnd({ animated });
    if (delay > 0) {
      setTimeout(runScroll, delay);
      return;
    }
    requestAnimationFrame(runScroll);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(true, 100);
      markRead();
    }
  }, [messages.length, markRead, scrollToBottom]);

  useFocusEffect(
    useCallback(() => {
      void refreshMessages();
      void markRead();
      return undefined;
    }, [markRead, refreshMessages]),
  );

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const keyboardDelay = Platform.OS === 'ios' ? 50 : 120;

    const handleKeyboardToggle = () => {
      scrollToBottom(false, keyboardDelay);
    };

    const showSub = Keyboard.addListener(showEvent, handleKeyboardToggle);
    const hideSub = Keyboard.addListener(hideEvent, handleKeyboardToggle);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollToBottom]);

  const handleSend = async (content: string | null, imageUrl: string | null) => {
    if (!user?.id) return;
    await sendMessage(user.id, content, imageUrl);
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled={Platform.OS === 'ios'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 50 : 0}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isOwnMessage = item.sender_id === user?.id;
          return (
            <ChatBubble
              message={item}
              isOwnMessage={isOwnMessage}
              canDelete={isOwnMessage}
              onDeleteMessage={handleDeleteMessage}
            />
          );
        }}
        contentContainerStyle={styles.messagesList}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CustomText style={styles.emptyText}>No messages in this conversation yet</CustomText>
          </View>
        }
        onContentSizeChange={() => scrollToBottom(false)}
        onLayout={() => scrollToBottom(false)}
      />
      <AdminChatInput onSend={handleSend} onPickImage={pickAndUploadImage} uploading={uploading} />
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
