const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function genOrderNumber() {
  return 'NEO-' + Math.floor(100000 + Math.random() * 900000);
}

// POST /api/checkout
// Body: { items: [{product_id, name, price, quantity}], coupon_code, shipping_address, payment: {card_number, exp, cvv} }
//
// VULN(price-manipulation, CWE-602 "client-side enforcement of server-side
// security"): the frontend cart keeps `price` alongside each line item (so
// it can render totals without another round trip), and this endpoint
// trusts that client-supplied price instead of re-reading the authoritative
// price from the `products` table. An attacker can intercept the request
// (e.g. with a proxy) and rewrite any item's `price` to 0.01 before the
// order is persisted - the forged price is what gets charged AND what gets
// written into order_items, so it even survives into the order history.
//
// VULN(business-logic - coupon abuse): the coupon is looked up and its
// percent_off applied, but `times_used` is never incremented and
// `max_uses` is never compared against it, so a single-use code like
// VIP50 can be replayed unlimited times. The endpoint also accepts an
// array of coupon codes and stacks every discount it finds rather than
// allowing only one.
//
// VULN(business-logic - quantity not re-validated): negative or zero
// quantities added back in cart.js flow straight through into the total
// calculation here, letting a cart with one expensive item at quantity 1
// and a "filler" item at quantity -5 reduce the total arbitrarily.
//
// VULN(business-logic - stock race condition, TOCTOU): stock is read with
// a SELECT and later reduced with a separate UPDATE with no row locking
// (no `SELECT ... FOR UPDATE`, no transaction wrapping both statements).
// Firing concurrent checkout requests for a low-stock item (see the
// "Eclipse Limited Edition Sneaker", stock = 3) can drive stock negative.
router.post('/', requireAuth, async (req, res) => {
  const { items, coupon_code, coupon_codes, shipping_address, payment } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items[] is required.' });
  }

  try {
    // Subtotal trusts the client-supplied unit price - see VULN note above.
    let subtotal = 0;
    const lineItems = [];
    for (const item of items) {
      const lineTotal = Number(item.price) * Number(item.quantity);
      subtotal += lineTotal;
      lineItems.push({
        product_id: item.product_id,
        product_name: item.name,
        unit_price: item.price,
        quantity: item.quantity,
      });
    }

    // Coupon stacking + no usage-limit enforcement (see VULN note above).
    const codes = coupon_codes || (coupon_code ? [coupon_code] : []);
    let discountPercent = 0;
    const appliedCodes = [];
    for (const code of codes) {
      const [rows] = await pool.query(
        'SELECT * FROM coupons WHERE code = ? AND active = 1',
        [code]
      );
      if (rows.length) {
        discountPercent += rows[0].percent_off;
        appliedCodes.push(code);
        // NOTE: times_used is intentionally NOT incremented here - that's
        // the bug. A correct implementation would do:
        //   UPDATE coupons SET times_used = times_used + 1 WHERE id = ? AND times_used < max_uses
        // inside the same transaction as the order insert.
      }
    }
    const discount = Math.round(subtotal * (discountPercent / 100) * 100) / 100;
    const total = Math.round((subtotal - discount) * 100) / 100;

    // Stock check-then-act without locking - the race condition.
    for (const item of lineItems) {
      const [[product]] = await pool.query('SELECT stock FROM products WHERE id = ?', [
        item.product_id,
      ]);
      if (!product || product.stock < item.quantity) {
        return res.status(409).json({ error: `Insufficient stock for product ${item.product_id}.` });
      }
    }
    for (const item of lineItems) {
      await pool.query('UPDATE products SET stock = stock - ? WHERE id = ?', [
        item.quantity,
        item.product_id,
      ]);
    }

    const orderNumber = genOrderNumber();
    const last4 = payment && payment.card_number ? String(payment.card_number).slice(-4) : '0000';

    const [orderResult] = await pool.query(
      `INSERT INTO orders (order_number, user_id, status, subtotal, discount, total, coupon_code, shipping_address, payment_last4)
       VALUES (?, ?, 'paid', ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber,
        req.user.id,
        subtotal,
        discount,
        total,
        appliedCodes.join(','),
        shipping_address || null,
        last4,
      ]
    );

    for (const item of lineItems) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [orderResult.insertId, item.product_id, item.product_name, item.unit_price, item.quantity]
      );
    }

    // Clear the user's cart now that "payment" succeeded.
    const [[cart]] = await pool.query('SELECT id FROM carts WHERE user_id = ?', [req.user.id]);
    if (cart) await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);

    res.status(201).json({
      order_id: orderResult.insertId,
      order_number: orderNumber,
      subtotal,
      discount,
      total,
      applied_coupons: appliedCodes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Checkout failed.' });
  }
});

module.exports = router;
