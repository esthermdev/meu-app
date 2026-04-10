import { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import PrimaryButton from '@/components/buttons/PrimaryButton';
import CustomText from '@/components/CustomText';
import ChatBubble from '@/components/features/chat/ChatBubble';
import ChatInput from '@/components/features/chat/ChatInput';
import { fonts, fontSizes, typography } from '@/constants/Typography';
import { useAuth } from '@/context/AuthProvider';
import { useChat } from '@/hooks/useChat';
import { useChatImageUpload } from '@/hooks/useChatImageUpload';
import { MessageWithSender } from '@/types/chat';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const { user, session } = useAuth();
  const insets = useSafeAreaInsets();
  const { messages, loading, sendMessage, conversationId, clearMessages, deleteMessage, refreshMessages } = useChat(
    user?.id,
  );
  const { pickAndUploadImage, uploading } = useChatImageUpload(conversationId);
  const flatListRef = useRef<FlatList<MessageWithSender>>(null);

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      const { error } = await deleteMessage(messageId);
      if (error) {
        Alert.alert('Unable to delete', 'We could not delete this message. Please try again.');
      }
    },
    [deleteMessage],
  );

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  useFocusEffect(
    useCallback(() => {
      void refreshMessages();
      return undefined;
    }, [refreshMessages]),
  );

  if (!session) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.mainMessageText}>Need to reach the admin team?</Text>
        <Text style={styles.messageText}>Sign in to chat directly with tournament administrators.</Text>
        <PrimaryButton
          title="Sign In"
          onPress={() => router.push('/(tabs)/profile')}
          style={{ height: 35, paddingHorizontal: 15 }}
          textStyle={{ ...typography.buttonLarge }}
        />
        <Text style={styles.messageText}>
          Don&apos;t have an account?{' '}
          <Text style={styles.linkText} onPress={() => router.push('/sign-up')}>
            Sign Up
          </Text>
        </Text>
      </View>
    );
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 50 : 75}>
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
            <CustomText style={styles.emptyText}>
              Send a message to reach out to our tournament administrators. They&apos;ll respond here!
            </CustomText>
          </View>
        }
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />
      <ChatInput
        onSend={sendMessage}
        onPickImage={pickAndUploadImage}
        uploading={uploading}
        onClear={messages.length > 0 ? clearMessages : undefined}
        safeAreaBottom={false}
      />
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
  centerContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    flex: 1,
    gap: 30,
    justifyContent: 'center',
    padding: 50,
  },
  mainMessageText: {
    ...typography.textLargeBold,
    color: '#838383',
    textAlign: 'center',
  },
  messageText: {
    ...typography.textLarge,
    color: '#00000066',
    textAlign: 'center',
  },
  linkText: {
    color: '#EA1D25',
    ...typography.heading5,
    textDecorationLine: 'underline',
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
