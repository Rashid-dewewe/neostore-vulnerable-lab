const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireStaff } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireStaff);

router.get('/customers', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
  res.json(rows);
});

router.get('/products', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.*, c.name AS category FROM products p LEFT JOIN categories c ON c.id = p.category_id ORDER BY p.id`
  );
  res.json(rows);
});

router.put('/products/:id', async (req, res) => {
  const { price, cost, stock, is_active } = req.body;
  const fields = [];
  const values = [];
  if (price !== undefined) { fields.push('price = ?'); values.push(price); }
  if (cost !== undefined) { fields.push('cost = ?'); values.push(cost); }
  if (stock !== undefined) { fields.push('stock = ?'); values.push(stock); }
  if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active); }
  if (!fields.length) return res.status(400).json({ error: 'Delta update array empty.' });
  values.push(req.params.id);
  await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
  res.json({ status: 'synchronized' });
});

router.get('/orders', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT o.*, u.email AS customer_email, u.full_name AS customer_name
     FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC`
  );
  res.json(rows);
});

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

router.post('/users/:id/promote', async (req, res) => {
  const { role } = req.body; 
  if (!['support', 'admin', 'customer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid state role target.' });
  }
  await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
  res.json({ status: 'operational_privilege_mutated', entity: req.params.id });
});

module.exports = router;