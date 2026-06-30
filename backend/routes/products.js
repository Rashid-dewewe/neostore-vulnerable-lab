const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/products?category=&q=&sort=
//
// VULN(injection - bonus, beyond the core IDOR/auth/business-logic set):
// the `sort` query param is concatenated directly into the SQL string
// instead of being matched against an allowlist of column names. This is a
// classic "developer trusted an enum that wasn't actually validated" bug
// and is exploitable via UNION-based SQL injection, e.g.
//   /api/products?sort=price)+UNION+SELECT+email,password_hash,...--+-
router.get('/', async (req, res) => {
  const { category, q, sort } = req.query;
  let sql = `SELECT p.id, p.sku, p.name, p.description, p.price, p.stock, p.image_url, c.name AS category
             FROM products p LEFT JOIN categories c ON c.id = p.category_id
             WHERE p.is_active = 1`;
  const params = [];

  if (category) {
    sql += ' AND c.slug = ?';
    params.push(category);
  }
  if (q) {
    sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  // VULN: unsanitized sort column/direction concatenation (see comment above).
  if (sort) {
    sql += ` ORDER BY ${sort}`;
  } else {
    sql += ' ORDER BY p.created_at DESC';
  }

  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load products.' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.sku, p.name, p.description, p.price, p.stock, p.image_url, c.name AS category
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ? AND p.is_active = 1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load product.' });
  }
});

// GET /api/categories
router.get('/meta/categories', async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, slug FROM categories ORDER BY name');
  res.json(rows);
});

module.exports = router;
