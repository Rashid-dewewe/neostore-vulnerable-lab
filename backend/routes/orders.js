const express = require('express');
const pool = require('../db/pool');
const { requireAuth, legacyDecodeAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/orders - correctly scoped to the logged-in user.
router.get('/', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, order_number, status, subtotal, discount, total, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json(rows);
});

// GET /api/orders/:id
//
// VULN(BOLA/IDOR + broken-authentication, chained - advanced): two bugs
// compound here. First, this route uses `legacyDecodeAuth` (see
// middleware/auth.js) which never verifies the JWT signature, so a forged
// token with any `id` claim is accepted. Second, even with a *legitimate*
// token, the query below never filters by `user_id`, so order ids are
// sequential and fully enumerable - any logged-in user (real or forged)
// can read any other customer's order, including their shipping address
// and last 4 card digits, just by walking /api/orders/1, /api/orders/2, ...
router.get('/:id', legacyDecodeAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT o.*, u.email AS customer_email, u.full_name AS customer_name
     FROM orders o JOIN users u ON u.id = o.user_id
     WHERE o.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Order not found.' });

  const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
  res.json({ ...rows[0], items });
});

// POST /api/orders/:id/cancel
//
// VULN(BOLA/IDOR + broken-access-control): same missing-ownership pattern.
// Any authenticated customer can cancel (or, with the PATCH endpoint
// below, otherwise mutate) an order that isn't theirs.
router.post('/:id/cancel', requireAuth, async (req, res) => {
  await pool.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [req.params.id]);
  res.json({ message: 'Order cancelled.' });
});

// PATCH /api/orders/:id/status { status }
//
// VULN(broken-access-control - missing function level access control):
// this is meant to be an admin/support-only fulfillment action (marking
// orders shipped/delivered) but it only requires *any* valid customer
// session, not a staff role. A regular shopper can mark their own
// 'pending' order as 'delivered' to unlock post-delivery flows (e.g. leave
// a verified review, request a refund-on-delivered-item) without ever
// paying, or interfere with other customers' orders given the IDOR above.
router.patch('/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ message: 'Status updated.' });
});

module.exports = router;
