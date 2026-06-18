import { NotificationRow } from './database';

export type { NotificationRow } from './database';

// A notification as rendered in the app: the stored row plus the per-user
// read status that is resolved client-side (the `notifications` table itself
// has no `is_read` column).
export type NotificationItem = Pick<NotificationRow, 'id' | 'title' | 'message' | 'type'> & {
  created_at: string;
  is_read: boolean;
};
