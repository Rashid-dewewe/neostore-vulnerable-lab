const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/:id
//
// VULN(BOLA/IDOR + sensitive-data-exposure): the route is protected by
// `requireAuth` (so you must be logged in) but never checks that
// `req.params.id` matches `req.user.id`. Any logged-in customer can view
// any other user's full profile by changing the URL - including the
// admin-only `loyalty_points` and `internal_notes` fields, AND the bcrypt
// `password_hash`, which is selected with `SELECT *` and returned as-is.
router.get('/:id', requireAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'User not found.' });
  res.json(rows[0]); // includes password_hash, internal_notes, etc.
});

// GET /api/users/:id/addresses - same missing-ownership pattern as above.
router.get('/:id/addresses', requireAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM addresses WHERE user_id = ?', [req.params.id]);
  res.json(rows);
});

// PUT /api/users/:id
//
// VULN(broken-access-control + mass-assignment -> privilege escalation,
// advanced): two issues compound. (1) no ownership check, identical to the
// GET route above. (2) the handler spreads the *entire* request body
// straight into a dynamic UPDATE rather than allowlisting editable fields
// (full_name, phone). That means a logged-in customer can PUT their own id
// (no IDOR even required) with body `{ "role": "admin" }` and the query
// below will happily promote them, because `role` is just another key in
// req.body that gets forwarded to SQL.
router.put('/:id', requireAuth, async (req, res) => {
  const allowedKeysButNotEnforced = ['full_name', 'phone', 'role', 'loyalty_points']; // documents the bug, not a real guard
  const updates = req.body;
  const keys = Object.keys(updates).filter((k) => allowedKeysButNotEnforced.includes(k));
  if (!keys.length) return res.status(400).json({ error: 'No updatable fields provided.' });

  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => updates[k]);
  values.push(req.params.id);

  await pool.query(`UPDATE users SET ${setClause} WHERE id = ?`, values);
  const [rows] = await pool.query(
    'SELECT id, email, full_name, role, phone, loyalty_points FROM users WHERE id = ?',
    [req.params.id]
  );
  res.json(rows[0]);
});

module.exports = router;
