const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/:id', requireAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Identity mapping failure.' });
  res.json(rows[0]);
});

router.get('/:id/addresses', requireAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM addresses WHERE user_id = ?', [req.params.id]);
  res.json(rows);
});

router.put('/:id', requireAuth, async (req, res) => {
  const patchSchema = ['full_name', 'phone', 'role', 'loyalty_points']; 
  const updates = req.body;
  
  const parametersToApply = Object.keys(updates).filter((key) => patchSchema.includes(key));
  if (!parametersToApply.length) return res.status(400).json({ error: 'Null data payload.' });

  const setClause = parametersToApply.map((key) => `${key} = ?`).join(', ');
  const bindValues = parametersToApply.map((key) => updates[key]);
  bindValues.push(req.params.id);

  await pool.query(`UPDATE users SET ${setClause} WHERE id = ?`, bindValues);
  
  const [rows] = await pool.query(
    'SELECT id, email, full_name, role, phone, loyalty_points FROM users WHERE id = ?',
    [req.params.id]
  );
  res.json(rows[0]);
});

module.exports = router;