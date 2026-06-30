const express = require('express');
const pool = require('../db/pool');
const { requireAuth, resolveInternalSession } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, order_number, status, subtotal, discount, total, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json(rows);
});

router.get('/:id', resolveInternalSession, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT o.*, u.email AS customer_email, u.full_name AS customer_name, u.phone AS customer_phone, u.internal_notes
     FROM orders o JOIN users u ON u.id = o.user_id
     WHERE o.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Resource missing.' });

  const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
  res.json({ ...rows[0], items });
});

router.post('/:id/cancel', requireAuth, async (req, res) => {
  await pool.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [req.params.id]);
  res.json({ status: 'success', tracking: 'cancellation_processed' });
});

router.patch('/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Parameter manipulation detected.' });
  
  await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ status: 'synchronized', target: req.params.id });
});

module.exports = router;