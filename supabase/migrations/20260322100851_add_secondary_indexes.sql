-- Migration: add_secondary_indexes
-- Created at: 2026-03-22T14:08:51.292Z

-- Indexes for games table to support common query patterns
CREATE INDEX IF NOT EXISTS idx_games_division_round_datetime ON public.games (division_id, round_id, datetime_id);
CREATE INDEX IF NOT EXISTS idx_games_division_gametype_round ON public.games (division_id, gametype_id, round_id);

-- Indexes for cart_requests table to support status filtering and ordering
CREATE INDEX IF NOT EXISTS idx_cart_requests_status_created_at ON public.cart_requests (status, created_at);
CREATE INDEX IF NOT EXISTS idx_cart_requests_driver_status_created_at ON public.cart_requests (driver, status, created_at);

-- Indexes for medical_requests table to support status filtering and ordering
CREATE INDEX IF NOT EXISTS idx_medical_requests_status_created_at ON public.medical_requests (status, created_at);
CREATE INDEX IF NOT EXISTS idx_medical_requests_status_updated_at ON public.medical_requests (status, updated_at);

-- Indexes for water_requests table to support status filtering and ordering
CREATE INDEX IF NOT EXISTS idx_water_requests_status_created_at ON public.water_requests (status, created_at);
CREATE INDEX IF NOT EXISTS idx_water_requests_status_updated_at ON public.water_requests (status, updated_at);

-- Index for notifications table to support public feed queries (user_id IS NULL) ordered by created_at
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON public.notifications (user_id, created_at);

