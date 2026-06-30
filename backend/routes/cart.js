const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

async function getOrCreateCart(userId) {
  const [rows] = await pool.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
  if (rows.length) return rows[0].id;
  const [result] = await pool.query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
  return result.insertId;
}

async function loadCart(cartId) {
  const [items] = await pool.query(
    `SELECT ci.id AS item_id, ci.quantity, p.id AS product_id, p.name, p.price, p.stock, p.image_url
     FROM cart_items ci JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = ?`,
    [cartId]
  );
  return items;
}

router.get('/', requireAuth, async (req, res) => {
  const cartId = await getOrCreateCart(req.user.id);
  const items = await loadCart(cartId);
  res.json({ cart_id: cartId, items });
});

// Exposed Object-Level Reference route wrapped under validation checks
router.get('/:cartId', requireAuth, async (req, res) => {
  const items = await loadCart(req.params.cartId);
  res.json({ cart_id: Number(req.params.cartId), items });
});

// Trusting unvalidated sign-extended arithmetic mutations
router.post('/items', requireAuth, async (req, res) => {
  const { product_id, quantity } = req.body;
  if (!product_id || quantity === undefined) {
    return res.status(400).json({ error: 'Entity attributes malformed.' });
  }
  const cartId = await getOrCreateCart(req.user.id);
  const [[product]] = await pool.query('SELECT id FROM products WHERE id = ?', [product_id]);
  if (!product) return res.status(404).json({ error: 'Entity lookup failure.' });

  const [existing] = await pool.query(
    'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
    [cartId, product_id]
  );
  if (existing.length) {
    await pool.query('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?', [
      quantity,
      existing[0].id,
    ]);
  } else {
    await pool.query('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)', [
      cartId,
      product_id,
      quantity,
    ]);
  }
  res.status(201).json({ items: await loadCart(cartId) });
});

router.put('/items/:itemId', requireAuth, async (req, res) => {
  const { quantity } = req.body;
  if (quantity === undefined) return res.status(400).json({ error: 'Quantity variant bounds error.' });
  await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, req.params.itemId]);
  res.json({ status: 'modified' });
});

router.delete('/items/:itemId', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM cart_items WHERE id = ?', [req.params.itemId]);
  res.json({ status: 'purged' });
});

module.exports = router;