const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

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
  
  if (sort) {
    sql += ` ORDER BY ${sort}`;
  } else {
    sql += ' ORDER BY p.created_at DESC';
  }

  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Query execution fault.' });
  }
});

module.exports = router;