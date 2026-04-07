import { StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomText from '@/components/CustomText';
import { fonts, fontSizes } from '@/constants/Typography';
import { ConversationWithUser } from '@/types/chat';

import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ConversationListItemProps {
  conversation: ConversationWithUser;
  onPress: () => void;
}

export default function ConversationListItem({ conversation, onPress }: ConversationListItemProps) {
  const userName = conversation.user?.full_name ?? 'Unknown User';
  const lastMessage = conversation.last_message;
  const preview = lastMessage?.image_url ? '📷 Photo' : (lastMessage?.content ?? 'No messages yet');
  const time = lastMessage
    ? new Date(lastMessage.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : '';
  const isUnread = conversation.has_unread ?? false;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <MaterialCommunityIcons name="account-circle" size={44} color="#ccc" />
        {isUnread && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <CustomText style={[styles.name, isUnread && styles.nameUnread]} numberOfLines={1}>
            {userName}
          </CustomText>
          {time ? <CustomText style={[styles.time, isUnread && styles.timeUnread]}>{time}</CustomText> : null}
        </View>
        <CustomText style={[styles.preview, isUnread && styles.previewUnread]} numberOfLines={1}>
          {preview}
        </CustomText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomColor: '#F0F0F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  avatar: {
    marginRight: 12,
    position: 'relative',
  },
  unreadDot: {
    backgroundColor: '#EA1D25',
    borderColor: '#fff',
    borderRadius: 7,
    borderWidth: 2,
    height: 14,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 14,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    color: '#333',
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.md,
  },
  nameUnread: {
    fontFamily: fonts.bold,
  },
  time: {
    color: '#999',
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    marginLeft: 8,
  },
  timeUnread: {
    color: '#EA1D25',
    fontFamily: fonts.semiBold,
  },
  preview: {
    color: '#888',
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    marginTop: 2,
  },
  previewUnread: {
    color: '#333',
    fontFamily: fonts.medium,
  },
});
