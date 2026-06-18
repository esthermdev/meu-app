import { FeedbackRow } from './database';

export type { FeedbackRow } from './database';

// Feedback that is shown to admins: rows are filtered to those with a
// non-null message before reaching the UI.
export type FeedbackItem = Pick<FeedbackRow, 'id' | 'subject' | 'created_at'> & {
  message: string;
};
