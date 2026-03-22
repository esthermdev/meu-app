-- Drop redundant round_id column from scores table
-- This column duplicates games.round_id and is not independently queried

ALTER TABLE scores DROP COLUMN round_id;

-- Add unique index on game_id to enforce one-to-one relationship with games
CREATE UNIQUE INDEX idx_scores_game_id_unique ON scores(game_id);