import { useRef } from 'react';
import { Alert, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import CustomText from '@/components/CustomText';
import { fonts, fontSizes, typography } from '@/constants/Typography';
import { MessageWithSender } from '@/types/chat';

interface ChatBubbleProps {
  message: MessageWithSender;
  isOwnMessage: boolean;
  canDelete?: boolean;
  onDeleteMessage?: (messageId: string) => Promise<void> | void;
}

export default function ChatBubble({ message, isOwnMessage, canDelete = false, onDeleteMessage }: ChatBubbleProps) {
  const senderName = message.sender?.full_name ?? 'Unknown';
  const bubbleScale = useRef(new Animated.Value(1)).current;
  const bubbleOpacity = useRef(new Animated.Value(1)).current;

  const runLongPressFeedback = (onComplete: () => void) => {
    Animated.parallel([
      Animated.timing(bubbleScale, {
        toValue: 0.9,
        duration: 50,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(bubbleOpacity, {
        toValue: 0.8,
        duration: 110,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
      Animated.parallel([
        Animated.timing(bubbleScale, {
          toValue: 1,
          duration: 130,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bubbleOpacity, {
          toValue: 1,
          duration: 130,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleLongPress = () => {
    if (!canDelete || !onDeleteMessage) return;

    runLongPressFeedback(() => {
      Alert.alert('Message options', 'What would you like to do?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete message',
          style: 'destructive',
          onPress: () => {
            void onDeleteMessage(message.id);
          },
        },
      ]);
    });
  };

  return (
    <View style={[styles.container, isOwnMessage ? styles.ownContainer : styles.otherContainer]}>
      {!isOwnMessage && <CustomText style={styles.senderName}>{senderName}</CustomText>}
      <Animated.View
        style={{
          opacity: bubbleOpacity,
          transform: [{ scale: bubbleScale }],
        }}>
        <Pressable
          style={[styles.bubble, isOwnMessage ? styles.ownBubble : styles.otherBubble]}
          onLongPress={handleLongPress}
          disabled={!canDelete || !onDeleteMessage}
          delayLongPress={350}>
          {message.image_url && (
            <Image source={{ uri: message.image_url }} style={styles.image} contentFit="cover" transition={200} />
          )}
          {message.content && (
            <CustomText style={[styles.text, isOwnMessage && styles.ownText]}>{message.content}</CustomText>
          )}
        </Pressable>
      </Animated.View>
      <CustomText style={styles.time}>
        {new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
      </CustomText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  ownContainer: {
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignItems: 'flex-start',
  },
  senderName: {
    color: '#EA1D25',
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    marginBottom: 2,
  },
  bubble: {
    borderRadius: 16,
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  ownBubble: {
    backgroundColor: '#EA1D25',
    borderBottomRightRadius: 4,
    boxShadow: '#333',
    shadowColor: '#333',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 0.5,
  },
  otherBubble: {
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 4,
    shadowColor: '#333',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.5,
    shadowRadius: 0.5,
  },
  text: {
    color: '#333',
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
  },
  ownText: {
    color: '#fff',
  },
  time: {
    color: '#5C5C5C',
    ...typography.textXSmall,
    marginVertical: 4,
    textAlign: 'right',
  },
  image: {
    borderRadius: 12,
    height: 200,
    marginBottom: 6,
    width: 220,
  },
});
