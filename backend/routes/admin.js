const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireStaff } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireStaff);

// Get all customers
router.get('/customers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, email, full_name, role, phone, loyalty_points, created_at FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get all products with categories
router.get('/products', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category FROM products p LEFT JOIN categories c ON c.id = p.category_id ORDER BY p.id`
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Update product
router.put('/products/:id', async (req, res) => {
  const { price, cost, stock, is_active } = req.body;
  const fields = [];
  const values = [];
  
  try {
    if (price !== undefined) { fields.push('price = ?'); values.push(price); }
    if (cost !== undefined) { fields.push('cost = ?'); values.push(cost); }
    if (stock !== undefined) { fields.push('stock = ?'); values.push(stock); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active); }
    
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
    
    values.push(req.params.id);
    await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ status: 'success', message: 'Product updated' });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Get all orders with customer details
router.get('/orders', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.*, u.email AS customer_email, u.full_name AS customer_name
       FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get revenue reports
router.get('/reports/revenue', async (req, res) => {
  try {
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
  } catch (err) {
    console.error('Error fetching revenue report:', err);
    res.status(500).json({ error: 'Failed to fetch revenue report' });
  }
});

// Promote user
router.post('/users/:id/promote', async (req, res) => {
  const { role } = req.body; 
  if (!['support', 'admin', 'customer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  
  try {
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    res.json({ status: 'success', message: 'User role updated' });
  } catch (err) {
    console.error('Error promoting user:', err);
    res.status(500).json({ error: 'Failed to promote user' });
  }
});

module.exports = router;