-- Stat points: earn 1 per level up; spend on +1 Attack or +1 Defense.
-- Run in Supabase SQL Editor.

ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS stat_points INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN player_stats.stat_points IS 'Unspent points from leveling up; spend via +1 Attack or +1 Defense.';
