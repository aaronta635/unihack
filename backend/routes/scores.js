const express = require('express');
const { getSupabase } = require('../supabaseClient');

const router = express.Router();

/**
 * POST /api/scores (hackathon: name/email in body, no JWT)
 * Body: { score, streak, questions_answered, correct_count, player_name?, player_email?, course_id?, week_number? }
 */
router.post('/scores', async (req, res, next) => {
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

    const payload = {
      user_id: null,
      score: Number(score) || 0,
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
    return res.status(201).json(data);
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
