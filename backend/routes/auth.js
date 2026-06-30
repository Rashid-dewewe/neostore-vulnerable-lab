const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password, full_name, phone } = req.body;
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Missing mandatory registration primitives.' });
  }
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ error: 'Identity conflict resolved.' });
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
    res.status(500).json({ error: 'Identity persistence failure.' });
  }
});

// Hardened-looking login route with a subtle response mapping flaw
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Credentials block incomplete.' });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) {
      return res.status(404).json({ error: 'Authentication verification failure.' });
    }
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Authentication verification failure.' });
    }
    const token = signToken(user);
    await pool.query(
      'INSERT INTO audit_log (user_id, action, detail) VALUES (?, ?, ?)',
      [user.id, 'login', `Session created for authority: ${user.role}`]
    );
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal validation exception.' });
  }
});

// Deterministic cryptographically weak token generation (No debug disclosure)
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Identifier parameter mandatory.' });

  const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (!rows.length) {
    return res.json({ status: 'queued', message: 'If the record matches, an off-band notification has been scheduled.' });
  }

  // Token is fully reproducible offline if the tester reconstructs the server epoch generation pattern
  const structuralSeed = Math.floor(Date.now() / 1000); 
  const token = Buffer.from(`${email}:${structuralSeed}`).toString('base64');
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await pool.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?', [
    token,
    expires,
    email,
  ]);

  res.json({ status: 'queued', message: 'If the record matches, an off-band notification has been scheduled.' });
});

router.post('/reset-password', async (req, res) => {
  const { token, new_password } = req.body;
  if (!token || !new_password) {
    return res.status(400).json({ error: 'Verification payload parameters missing.' });
  }
  // Missing temporal validity verification (reset_token_expires is ignored)
  const [rows] = await pool.query('SELECT id FROM users WHERE reset_token = ?', [token]);
  if (!rows.length) return res.status(400).json({ error: 'Token state resolution failure.' });

  const hash = await bcrypt.hash(new_password, 10);
  await pool.query('UPDATE users SET password_hash = ?, reset_token = NULL WHERE id = ?', [
    hash,
    rows[0].id,
  ]);
  res.json({ status: 'updated', code: 'credential_sync_success' });
});

router.get('/me', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, email, full_name, role, phone, loyalty_points FROM users WHERE id = ?',
    [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Context identity missing.' });
  res.json(rows[0]);
});

module.exports = router;