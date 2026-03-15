-- Add user_id to scores so logged-in players get scores and stats tied to their account.
-- Run in Supabase SQL Editor if your scores table doesn't have user_id yet.

ALTER TABLE scores ADD COLUMN IF NOT EXISTS user_id UUID;

COMMENT ON COLUMN scores.user_id IS 'Supabase auth user id when score submitted with Bearer token; null for anonymous.';
