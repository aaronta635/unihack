/**
 * Auth middleware for routes that require a valid Supabase JWT.
 * Use requireAuth then requireAdmin for admin-only routes (e.g. PDF upload).
 *
 * To grant a user admin role in Supabase:
 * - Dashboard: Authentication → Users → select user → Edit → Raw User Meta: { "role": "admin" }
 * - Or set app_metadata.role = "admin" via Dashboard or Admin API.
 */

const supabase = require('../supabase');

const BEARER_PREFIX = 'Bearer ';

/**
 * Returns the Bearer token from Authorization header, or null.
 * @param {import('express').Request} req
 * @returns {string | null}
 */
function getBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (typeof authHeader !== 'string' || !authHeader.startsWith(BEARER_PREFIX)) {
    return null;
  }
  const token = authHeader.slice(BEARER_PREFIX.length).trim();
  return token || null;
}

/**
 * Middleware: require a valid Supabase JWT. Sets req.user; sends 401 if missing or invalid.
 */
async function requireAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authorization required. Please log in.' });
  }
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: error?.message || 'Invalid or expired session. Please log in again.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

/**
 * Must be used after requireAuth. Sends 403 if the authenticated user is not an admin.
 * Admin: user.app_metadata.role === 'admin' or user.user_metadata.role === 'admin'.
 */
function requireAdmin(req, res, next) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Authorization required.' });
  }
  const role = user.app_metadata?.role ?? user.user_metadata?.role;
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can perform this action.' });
  }
  next();
}

module.exports = { getBearerToken, requireAuth, requireAdmin };
