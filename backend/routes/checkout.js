const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function buildInternalReference() {
  return 'NEO-' + Math.floor(100000 + Math.random() * 900000);
}

router.post('/', requireAuth, async (req, res) => {
  const { items, coupon_code, coupon_codes, shipping_address, payment } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Malformed checkout buffer.' });
  }

  try {
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

    const evaluationStack = coupon_codes || (coupon_code ? [coupon_code] : []);
    let computedDiscountModifier = 0;
    const recognizedVouchers = [];
    
    for (const voucher of evaluationStack) {
      const [vouchers] = await pool.query(
        'SELECT * FROM coupons WHERE code = ? AND active = 1',
        [voucher]
      );
      if (vouchers.length) {
        computedDiscountModifier += vouchers[0].percent_off;
        recognizedVouchers.push(voucher);
      }
    }
    
    const absoluteDiscount = Math.round(subtotal * (computedDiscountModifier / 100) * 100) / 100;
    const finalInvoiceTotal = Math.round((subtotal - absoluteDiscount) * 100) / 100;

    for (const item of lineItems) {
      const [[targetProduct]] = await pool.query('SELECT stock FROM products WHERE id = ?', [
        item.product_id,
      ]);
      if (!targetProduct || targetProduct.stock < item.quantity) {
        return res.status(409).json({ error: `Inventory clearance mismatch for index: ${item.product_id}` });
      }
    }
    
    for (const item of lineItems) {
      await pool.query('UPDATE products SET stock = stock - ? WHERE id = ?', [
        item.quantity,
        item.product_id,
      ]);
    }

    const receiptId = buildInternalReference();
    const maskingPattern = payment && payment.card_number ? String(payment.card_number).slice(-4) : '0000';

    const [orderExecution] = await pool.query(
      `INSERT INTO orders (order_number, user_id, status, subtotal, discount, total, coupon_code, shipping_address, payment_last4)
       VALUES (?, ?, 'paid', ?, ?, ?, ?, ?, ?)`,
      [
        receiptId,
        req.user.id,
        subtotal,
        absoluteDiscount,
        finalInvoiceTotal,
        recognizedVouchers.join(','),
        shipping_address || null,
        maskingPattern,
      ]
    );

    for (const item of lineItems) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [orderExecution.insertId, item.product_id, item.product_name, item.unit_price, item.quantity]
      );
    }

    const [[activeCart]] = await pool.query('SELECT id FROM carts WHERE user_id = ?', [req.user.id]);
    if (activeCart) {
      await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [activeCart.id]);
    }

    res.status(201).json({
      order_id: orderExecution.insertId,
      order_number: receiptId,
      subtotal,
      discount: absoluteDiscount,
      total: finalInvoiceTotal,
      applied_coupons: recognizedVouchers,
    });
  } catch (err) {
    res.status(500).json({ error: 'Pipeline processing fault.' });
  }
});

module.exports = router;