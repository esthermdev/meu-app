import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import CustomText from '@/components/CustomText';
import { fonts, fontSizes, typography } from '@/constants/Typography';
import { MessageWithSender } from '@/types/chat';

interface ChatBubbleProps {
  message: MessageWithSender;
  isOwnMessage: boolean;
}

export default function ChatBubble({ message, isOwnMessage }: ChatBubbleProps) {
  const senderName = message.sender?.full_name ?? 'Unknown';

  return (
    <View style={[styles.container, isOwnMessage ? styles.ownContainer : styles.otherContainer]}>
      {!isOwnMessage && <CustomText style={styles.senderName}>{senderName}</CustomText>}
      <View style={[styles.bubble, isOwnMessage ? styles.ownBubble : styles.otherBubble]}>
        {message.image_url && (
          <Image source={{ uri: message.image_url }} style={styles.image} contentFit="cover" transition={200} />
        )}
        {message.content && (
          <CustomText style={[styles.text, isOwnMessage && styles.ownText]}>{message.content}</CustomText>
        )}
      </View>
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
    marginLeft: 8,
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
