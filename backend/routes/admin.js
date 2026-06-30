const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireStaff } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireStaff);
// NOTE: every route below is "protected" by requireStaff, which (see
// middleware/auth.js) actually only blocks the literal 'customer' role and
// honors the X-Debug-Role header override. That single shared bug is what
// makes the whole /api/admin/* surface reachable by the low-privilege
// 'support' role, and by any customer who sets X-Debug-Role: support (or
// admin) on their request.

// GET /api/admin/customers
//
// VULN(broken-access-control + sensitive-data-exposure): intended for
// admins to manage customers, reachable by 'support' due to the
// requireStaff bug. It also returns password_hash and internal_notes for
// every customer via SELECT *.
router.get('/customers', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
  res.json(rows);
});

// GET /api/admin/products
//
// VULN(sensitive-data-exposure): exposes wholesale `cost` alongside retail
// `price` to any staff-or-impersonated-staff caller, leaking margin data.
router.get('/products', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.*, c.name AS category FROM products p LEFT JOIN categories c ON c.id = p.category_id ORDER BY p.id`
  );
  res.json(rows);
});

// PUT /api/admin/products/:id { price, cost, stock, is_active }
//
// VULN(broken-access-control): inventory/price edits should be admin-only,
// but again only requireStaff (the confused-deputy check) gates this.
// A 'support' agent - or anyone abusing X-Debug-Role - can directly edit
// live retail prices and stock counts.
router.put('/products/:id', async (req, res) => {
  const { price, cost, stock, is_active } = req.body;
  const fields = [];
  const values = [];
  if (price !== undefined) { fields.push('price = ?'); values.push(price); }
  if (cost !== undefined) { fields.push('cost = ?'); values.push(cost); }
  if (stock !== undefined) { fields.push('stock = ?'); values.push(stock); }
  if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active); }
  if (!fields.length) return res.status(400).json({ error: 'No fields to update.' });
  values.push(req.params.id);
  await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
  res.json({ message: 'Product updated.' });
});

// GET /api/admin/orders - all orders across all customers.
router.get('/orders', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT o.*, u.email AS customer_email, u.full_name AS customer_name
     FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC`
  );
  res.json(rows);
});

// GET /api/admin/reports/revenue - simple aggregate report.
router.get('/reports/revenue', async (req, res) => {
  const [[totals]] = await pool.query(
    `SELECT COUNT(*) AS order_count, COALESCE(SUM(total),0) AS revenue, COALESCE(AVG(total),0) AS avg_order_value
     FROM orders WHERE status != 'cancelled'`
  );
  const [byProduct] = await pool.query(
    `SELECT p.name, SUM(oi.quantity) AS units_sold, SUM(oi.unit_price * oi.quantity) AS revenue
     FROM order_items oi JOIN products p ON p.id = oi.product_id
     GROUP BY p.id ORDER BY revenue DESC LIMIT 10`
  );
  res.json({ totals, top_products: byProduct });
});

// POST /api/admin/users/:id/promote
//
// VULN(broken-access-control, the sharpest example): this is explicitly a
// "promote a user to admin" action and STILL only checks requireStaff, so
// a support agent (a real but low-privilege role) can mint new admins, and
// the X-Debug-Role header bypass means a plain customer can too.
router.post('/users/:id/promote', async (req, res) => {
  const { role } = req.body; // expected: 'support' | 'admin'
  if (!['support', 'admin', 'customer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }
  await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
  res.json({ message: `User ${req.params.id} role set to ${role}.` });
});

module.exports = router;
