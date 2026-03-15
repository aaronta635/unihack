const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const { getSupabaseAdmin } = require('../supabaseClient');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication APIs
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: test@gmail.com
 *               password:
 *                 type: string
 *                 example: mypassword123
 *               display_name:
 *                 type: string
 *                 example: Nam
 *     responses:
 *       200:
 *         description: Signup successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Signup successful
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 88c5447e-8d6c-43c6-8a42-5a4b63d85748
 *                     email:
 *                       type: string
 *                       example: test@gmail.com
 *       400:
 *         description: Signup failed
 */
router.post('/signup', async (req, res) => {
  const { email, password, display_name } = req.body;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name,
      },
    },
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(200).json({
    message: 'Signup successful',
    user: data.user,
  });
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: test@gmail.com
 *               password:
 *                 type: string
 *                 example: mypassword123
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Login failed
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

/**
 * GET /auth/me
 * Authorization: Bearer <access_token>
 * Returns current user when token is valid.
 */
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization' });
  }
  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: error?.message || 'Invalid token' });
  }
  res.json({ user });
});

/**
 * PATCH /auth/me/role
 * Authorization: Bearer <access_token>
 * Body: { role: 'admin' | 'student' }
 * Updates the current user's role in user_metadata so the Admin/Student toggle persists.
 */
router.patch('/me/role', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization' });
  }
  const token = authHeader.slice(7);
  const { data: { user }, error: getUserError } = await supabase.auth.getUser(token);
  if (getUserError || !user) {
    return res.status(401).json({ error: getUserError?.message || 'Invalid token' });
  }

  const role = req.body?.role;
  if (role !== 'admin' && role !== 'student') {
    return res.status(400).json({ error: 'role must be "admin" or "student"' });
  }

  try {
    const admin = getSupabaseAdmin();
    const existingMeta = user.user_metadata && typeof user.user_metadata === 'object' ? { ...user.user_metadata } : {};
    const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(
      user.id,
      { user_metadata: { ...existingMeta, role } }
    );
    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }
    return res.json({ user: updated?.user ?? user, role });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to update role' });
  }
});

module.exports = router;