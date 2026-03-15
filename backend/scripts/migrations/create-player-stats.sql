-- Player stats: attack, defense, XP (and derived level). One row per user.
-- Run in Supabase SQL Editor (Dashboard → SQL). For Supabase, user_id matches auth.users(id).

CREATE TABLE IF NOT EXISTS player_stats (
  user_id UUID PRIMARY KEY,
  attack INTEGER NOT NULL DEFAULT 5,
  defense INTEGER NOT NULL DEFAULT 5,
  xp INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional: allow backend to upsert via service role (no RLS if you use backend-only access)
-- If you use Supabase RLS, add policies so users can read/update only their own row:
-- ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can read own stats" ON player_stats FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can update own stats" ON player_stats FOR UPDATE USING (auth.uid() = user_id);
-- CREATE POLICY "Service role can do all" ON player_stats FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE player_stats IS 'Per-user stats: XP from weekly game scores; attack/defense derived from level.';
