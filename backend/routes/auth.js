const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../db/pool');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, full_name, phone } = req.body;
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'email, password, and full_name are required.' });
  }
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, 'customer')`,
      [email, hash, full_name, phone || null]
    );
    const user = { id: result.insertId, email, role: 'customer', full_name };
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// POST /api/auth/login
//
// VULN(broken-authentication - user enumeration): the API returns a
// distinctly different error for "no such account" vs. "wrong password",
// letting an attacker enumerate valid customer/admin emails before running
// a credential-stuffing or password-spray attack.
//
// VULN(broken-authentication - no throttling): there is no rate limiting,
// account lockout, or CAPTCHA on this endpoint, so it's brute-forceable.
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required.' });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) {
      return res.status(404).json({ error: 'No account found with that email address.' });
    }
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }
    const token = signToken(user);
    await pool.query(
      'INSERT INTO audit_log (user_id, action, detail) VALUES (?, ?, ?)',
      [user.id, 'login', `Logged in as ${user.role}`]
    );
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// POST /api/auth/forgot-password
//
// VULN(broken-authentication - predictable reset token): the "token" is
// just base64(email:timestamp) - it is not random, not signed, and not
// stored hashed. Anyone who can guess the request's rough timestamp (e.g.
// from the HTTP `Date` response header, which this API does not strip) can
// recompute a victim's reset token without ever intercepting the email,
// and reset_token_expires is written but never checked on redemption.
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required.' });

  const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  // Always respond 200 to avoid *this particular* enumeration, but the
  // predictable token below undoes that protection anyway.
  if (!rows.length) return res.json({ message: 'If that account exists, a reset link was sent.' });

  const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await pool.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?', [
    token,
    expires,
    email,
  ]);

  // In production this would be emailed. For the lab we return it directly
  // so the vulnerability is reachable without standing up an SMTP server -
  // an attacker who can derive/guess this token gets the exact same result.
  res.json({ message: 'If that account exists, a reset link was sent.', debug_reset_token: token });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, new_password } = req.body;
  if (!token || !new_password) {
    return res.status(400).json({ error: 'token and new_password are required.' });
  }
  // VULN: expiry column is never checked here, so a token "found" long
  // after issuance (e.g. recomputed from an old timestamp guess) still works.
  const [rows] = await pool.query('SELECT id FROM users WHERE reset_token = ?', [token]);
  if (!rows.length) return res.status(400).json({ error: 'Invalid or expired token.' });

  const hash = await bcrypt.hash(new_password, 10);
  await pool.query('UPDATE users SET password_hash = ?, reset_token = NULL WHERE id = ?', [
    hash,
    rows[0].id,
  ]);
  res.json({ message: 'Password updated.' });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, email, full_name, role, phone, loyalty_points FROM users WHERE id = ?',
    [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found.' });
  res.json(rows[0]);
});

module.exports = router;
