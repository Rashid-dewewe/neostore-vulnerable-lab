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

// GET /api/cart - the caller's own cart (correct, ownership-scoped).
router.get('/', requireAuth, async (req, res) => {
  const cartId = await getOrCreateCart(req.user.id);
  const items = await loadCart(cartId);
  res.json({ cart_id: cartId, items });
});

// GET /api/cart/:cartId
//
// VULN(BOLA/IDOR): kept as a "shareable cart link" feature, but it never
// checks that the requesting user owns `cartId`. Any authenticated user can
// enumerate small integer IDs and read another shopper's saved cart
// contents (and, indirectly, infer what they're about to buy).
router.get('/:cartId', requireAuth, async (req, res) => {
  const items = await loadCart(req.params.cartId);
  res.json({ cart_id: Number(req.params.cartId), items });
});

// POST /api/cart/items { product_id, quantity }
//
// VULN(business-logic): quantity is trusted as-is. A negative quantity
// added here survives into checkout's subtotal calculation, letting a
// shopper drag the order total below zero when combined with other items
// (see checkout.js for where this gets cashed in).
router.post('/items', requireAuth, async (req, res) => {
  const { product_id, quantity } = req.body;
  if (!product_id || quantity === undefined) {
    return res.status(400).json({ error: 'product_id and quantity are required.' });
  }
  const cartId = await getOrCreateCart(req.user.id);
  const [[product]] = await pool.query('SELECT id FROM products WHERE id = ?', [product_id]);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

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

// PUT /api/cart/items/:itemId { quantity }
//
// VULN(BOLA/IDOR): updates a cart_item purely by its primary key without
// confirming the item's cart belongs to req.user. Combined with the cart
// IDOR above, an attacker who has read another user's cart_id can also
// silently change quantities in it (denial-of-wallet / order tampering).
router.put('/items/:itemId', requireAuth, async (req, res) => {
  const { quantity } = req.body;
  if (quantity === undefined) return res.status(400).json({ error: 'quantity is required.' });
  await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, req.params.itemId]);
  res.json({ message: 'Updated.' });
});

// DELETE /api/cart/items/:itemId - same missing-ownership-check pattern as PUT above.
router.delete('/items/:itemId', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM cart_items WHERE id = ?', [req.params.itemId]);
  res.json({ message: 'Removed.' });
});

module.exports = router;
