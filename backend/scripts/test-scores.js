/**
 * Test scores API: sign in with Supabase Auth, POST a score, GET leaderboard.
 * Requires in .env: SUPABASE_URL, SUPABASE_ANON_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD
 * Backend must be running on http://localhost:3000
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

async function main() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_ANON_KEY?.trim();
  const email = process.env.TEST_USER_EMAIL?.trim();
  const password = process.env.TEST_USER_PASSWORD?.trim();

  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
    process.exit(1);
  }
  if (!email || !password) {
    console.error('Missing TEST_USER_EMAIL or TEST_USER_PASSWORD in .env (use a real Supabase Auth user to test)');
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) {
    console.error('Sign in failed:', authError.message);
    process.exit(1);
  }
  const token = auth.session?.access_token;
  if (!token) {
    console.error('No access token after sign in');
    process.exit(1);
  }
  console.log('Signed in as', email);

  // POST score
  const body = { score: 100, streak: 5, questions_answered: 10, correct_count: 8 };
  const postRes = await fetch(`${API_BASE}/api/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const postData = await postRes.json().catch(() => ({}));
  if (!postRes.ok) {
    console.error('POST /api/scores failed', postRes.status, postData);
    process.exit(1);
  }
  console.log('POST /api/scores OK', postData);

  // GET leaderboard
  const getRes = await fetch(`${API_BASE}/api/leaderboard?limit=5`);
  const { leaderboard } = await getRes.json().catch(() => ({}));
  if (!getRes.ok) {
    console.error('GET /api/leaderboard failed', getRes.status);
    process.exit(1);
  }
  console.log('GET /api/leaderboard OK', leaderboard?.length || 0, 'entries');
  console.log(JSON.stringify(leaderboard, null, 2));
}

main();
