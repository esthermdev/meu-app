import { ProfileRow } from '@/types/database';

export type ConversationRow = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  admin_last_read_at: string | null;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
};

export type MessageWithSender = MessageRow & {
  sender: Pick<ProfileRow, 'id' | 'full_name'> | null;
};

export type ConversationWithUser = ConversationRow & {
  user: Pick<ProfileRow, 'id' | 'full_name'> | null;
  last_message?: MessageRow | null;
  has_unread?: boolean;
};
