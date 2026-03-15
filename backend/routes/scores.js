const express = require('express');
const { getSupabase } = require('../supabaseClient');
const { optionalAuth, requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

const XP_PER_LEVEL = 100;
const BASE_ATTACK = 5;
const BASE_DEFENSE = 5;

/**
 * POST /api/scores
 * Body: { score, streak, questions_answered, correct_count, player_name?, player_email?, course_id?, week_number? }
 * Optional: Authorization Bearer <token> — if present, score is tied to user and player_stats are updated (XP, attack, defense).
 */
router.post('/scores', optionalAuth, async (req, res, next) => {
  try {
    const {
      score,
      streak,
      questions_answered,
      correct_count,
      player_name,
      player_email,
      course_id,
      week_number,
    } = req.body;

    const scoreNum = Number(score) || 0;
    const payload = {
      user_id: req.user?.id ?? null,
      score: scoreNum,
      streak: Number(streak) || 0,
      questions_answered: Number(questions_answered) || 0,
      correct_count: Number(correct_count) || 0,
      player_name: player_name != null ? String(player_name).trim() : null,
      player_email: player_email != null ? String(player_email).trim() : null,
      course_id: course_id != null ? String(course_id).trim() || null : null,
      week_number: week_number != null ? Number(week_number) : null,
    };

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('scores')
      .insert(payload)
      .select('id, score, streak, questions_answered, correct_count, player_name, player_email, course_id, week_number, created_at')
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (payload.user_id && scoreNum > 0) {
      const { data: existing } = await supabase
        .from('player_stats')
        .select('xp, attack, defense, stat_points')
        .eq('user_id', payload.user_id)
        .single();

      const prevXp = existing?.xp ?? 0;
      const newXp = prevXp + scoreNum;
      const oldLevel = Math.floor(prevXp / XP_PER_LEVEL);
      const newLevel = Math.floor(newXp / XP_PER_LEVEL);
      const attackBonus = Math.max(0, (existing?.attack ?? BASE_ATTACK) - BASE_ATTACK - oldLevel);
      const defenseBonus = Math.max(0, (existing?.defense ?? BASE_DEFENSE) - BASE_DEFENSE - oldLevel);
      const attack = BASE_ATTACK + newLevel + attackBonus;
      const defense = BASE_DEFENSE + newLevel + defenseBonus;
      const statPoints = (existing?.stat_points ?? 0) + Math.max(0, newLevel - oldLevel);

      await supabase
        .from('player_stats')
        .upsert(
          {
            user_id: payload.user_id,
            xp: newXp,
            attack,
            defense,
            stat_points: statPoints,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
    }

    return res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/stats
 * Authorization: Bearer <token> required.
 * Returns { attack, defense, xp, level } for the current user (or defaults if no row yet).
 */
router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authorization required.' });
    }

    const supabase = getSupabase();
    let row = null;
    try {
      const { data, error } = await supabase
        .from('player_stats')
        .select('attack, defense, xp, stat_points')
        .eq('user_id', userId)
        .single();
      if (!error || error.code === 'PGRST116') row = data;
    } catch (_) {
      // Table may not exist yet; return defaults
    }

    const attack = row?.attack ?? BASE_ATTACK;
    const defense = row?.defense ?? BASE_DEFENSE;
    const xp = row?.xp ?? 0;
    const level = Math.floor(xp / XP_PER_LEVEL);
    const statPoints = row?.stat_points ?? 0;
    const xpInCurrentLevel = xp - level * XP_PER_LEVEL;
    const xpToNextLevel = XP_PER_LEVEL - xpInCurrentLevel;

    return res.json({
      attack,
      defense,
      xp,
      level,
      stat_points: statPoints,
      xp_in_current_level: xpInCurrentLevel,
      xp_to_next_level: xpToNextLevel,
      xp_per_level: XP_PER_LEVEL,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/stats
 * Body: { type: 'attack' | 'defense' }
 * Spend 1 stat point to add +1 to attack or defense. Requires stat_points > 0.
 */
router.patch('/stats', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authorization required.' });
    }

    const type = req.body?.type;
    if (type !== 'attack' && type !== 'defense') {
      return res.status(400).json({ error: 'Body must have type: "attack" or "defense".' });
    }

    const supabase = getSupabase();
    const { data: row, error: fetchError } = await supabase
      .from('player_stats')
      .select('attack, defense, stat_points')
      .eq('user_id', userId)
      .single();

    if (fetchError || !row) {
      return res.status(404).json({ error: 'No stats found. Play a game to earn XP first.' });
    }

    const statPoints = row.stat_points ?? 0;
    if (statPoints < 1) {
      return res.status(400).json({ error: 'No stat points left. Level up by earning more XP!' });
    }

    const update = {
      stat_points: statPoints - 1,
      updated_at: new Date().toISOString(),
    };
    if (type === 'attack') update.attack = (row.attack ?? BASE_ATTACK) + 1;
    else update.defense = (row.defense ?? BASE_DEFENSE) + 1;

    const { data: updated, error: updateError } = await supabase
      .from('player_stats')
      .update(update)
      .eq('user_id', userId)
      .select('attack, defense, xp, stat_points')
      .single();

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    const xp = updated?.xp ?? 0;
    const level = Math.floor(xp / XP_PER_LEVEL);
    const xpInCurrentLevel = xp - level * XP_PER_LEVEL;

    return res.json({
      attack: updated?.attack ?? row.attack,
      defense: updated?.defense ?? row.defense,
      xp,
      level,
      stat_points: (updated?.stat_points ?? 0),
      xp_in_current_level: xpInCurrentLevel,
      xp_to_next_level: XP_PER_LEVEL - xpInCurrentLevel,
      xp_per_level: XP_PER_LEVEL,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/leaderboard
 * Query: ?limit=20 (default 20), ?course_id= (optional, filter by course)
 */
router.get('/leaderboard', async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const courseId = req.query.course_id != null ? String(req.query.course_id).trim() || null : null;
    const supabase = getSupabase();

    let query = supabase
      .from('scores')
      .select('id, score, streak, questions_answered, correct_count, player_name, player_email, course_id, week_number, created_at')
      .order('score', { ascending: false })
      .limit(limit);
    if (courseId) query = query.eq('course_id', courseId);
    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.json({ leaderboard: data || [] });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/questions?course_id=...&week_number=...
 * Returns questions in game shape: { question, options, correct_index }
 */
router.get('/questions', async (req, res, next) => {
  try {
    const courseId = req.query.course_id != null ? String(req.query.course_id).trim() || null : null;
    const weekNum = req.query.week_number != null ? Number(req.query.week_number) : null;
    if (!courseId || weekNum == null || weekNum < 1) {
      return res.status(400).json({ error: 'Missing or invalid course_id and week_number query params.' });
    }

    const supabase = getSupabase();
    const { data: rows, error } = await supabase
      .from('questions')
      .select('id, title, choice1, choice2, choice3, choice4, answer')
      .eq('course_id', courseId)
      .eq('week_number', weekNum)
      .order('id', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const questions = (rows || []).map((r) => ({
      question: r.title || '',
      options: [r.choice1 || '', r.choice2 || '', r.choice3 || '', r.choice4 || ''],
      correct_index: Math.max(0, Math.min(3, (r.answer || 1) - 1)),
    }));

    return res.json({ questions });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
