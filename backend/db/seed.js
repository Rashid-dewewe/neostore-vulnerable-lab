const bcrypt = require('bcryptjs');
const pool = require('./pool');

async function seed() {
  const conn = await pool.getConnection();
  try {
    const categories = ['Electronics', 'Home & Kitchen', 'Apparel', 'Outdoors'];
    const categoryIds = {};
    for (const name of categories) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const [res] = await conn.query(
        'INSERT INTO categories (name, slug) VALUES (?, ?)',
        [name, slug]
      );
      categoryIds[name] = res.insertId;
    }

    const products = [
      ['NEO-AUD-001', 'Aurora Wireless Headphones', 'Studio-grade ANC headphones with 40h battery life.', 'Electronics', 179.99, 64.0, 42, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'],
      ['NEO-WAT-002', 'Pulse Fitness Watch', 'GPS fitness watch with heart-rate and sleep tracking.', 'Electronics', 129.5, 41.0, 8, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'],
      ['NEO-KEY-003', 'Mechanik 87-Key Keyboard', 'Hot-swappable mechanical keyboard, brown switches.', 'Electronics', 99.0, 33.5, 65, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600'],
      ['NEO-BLN-004', 'Glacier Stand Mixer', '6-quart stand mixer with 10 speeds.', 'Home & Kitchen', 249.0, 102.0, 15, 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600'],
      ['NEO-MUG-005', 'Strata Ceramic Mug Set (4)', 'Hand-glazed stoneware mugs, dishwasher safe.', 'Home & Kitchen', 34.99, 11.0, 120, 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600'],
      ['NEO-JKT-006', 'Summit Shell Jacket', 'Waterproof breathable shell for alpine conditions.', 'Outdoors', 219.0, 78.0, 23, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600'],
      ['NEO-TEE-007', 'Foundation Crew Tee', '100% organic cotton, relaxed fit.', 'Apparel', 28.0, 6.5, 200, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600'],
      ['NEO-PCK-008', 'Trailhead 32L Daypack', 'Lightweight daypack with hydration sleeve.', 'Outdoors', 89.0, 29.0, 4, 'https://images.unsplash.com/photo-1622260614153-03223fb72052?w=600'],
      ['NEO-LMP-009', 'Halo Desk Lamp', 'Dimmable LED desk lamp with USB-C passthrough.', 'Home & Kitchen', 59.0, 18.0, 54, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600'],
      ['NEO-SNK-010', 'Velocity Running Shoe', 'Responsive foam midsole, breathable knit upper.', 'Apparel', 134.0, 47.0, 31, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'],
      ['NEO-LTD-011', 'Eclipse Limited Edition Sneaker', 'Limited drop, 3 units only.', 'Apparel', 299.0, 110.0, 3, 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600'],
    ];

    const productIds = {};
    for (const p of products) {
      const [sku, name, description, catName, price, cost, stock, image] = p;
      const [res] = await conn.query(
        `INSERT INTO products (sku, name, description, category_id, price, cost, stock, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [sku, name, description, categoryIds[catName], price, cost, stock, image]
      );
      productIds[sku] = res.insertId;
    }

    const pass = (plain) => bcrypt.hashSync(plain, 10);
    const users = [
      ['alice@example.com', 'Password123!', 'Alice Chen', 'customer', '555-0101', 320, null],
      ['bob@example.com', 'Password123!', 'Bob Martinez', 'customer', '555-0102', 75, null],
      ['carol@example.com', 'Password123!', 'Carol Singh', 'customer', '555-0103', 1450, null],
      ['support@neostore.test', 'Support123!', 'Dana Reyes (Support)', 'support', '555-0900', 0, 'L1 support agent - order lookups only'],
      ['admin@neostore.test', 'Admin123!', 'NeoStore Admin', 'admin', '555-0001', 0, 'Root store administrator'],
    ];
    const userIds = {};
    for (const [email, plain, full_name, role, phone, loyalty, notes] of users) {
      const [res] = await conn.query(
        `INSERT INTO users (email, password_hash, full_name, role, phone, loyalty_points, internal_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [email, pass(plain), full_name, role, phone, loyalty, notes]
      );
      userIds[email] = res.insertId;
    }

    await conn.query(
      `INSERT INTO addresses (user_id, label, line1, city, state, postal_code, country) VALUES
       (?, 'Home', '482 Birchwood Ave', 'Austin', 'TX', '78701', 'USA'),
       (?, 'Home', '19 Lakeshore Dr', 'Madison', 'WI', '53703', 'USA'),
       (?, 'Home', '77 Cedar Park Ln', 'Denver', 'CO', '80203', 'USA')`,
      [userIds['alice@example.com'], userIds['bob@example.com'], userIds['carol@example.com']]
    );

    await conn.query(
      `INSERT INTO coupons (code, percent_off, max_uses, times_used, active) VALUES
       ('WELCOME10', 10, 1000, 0, 1),
       ('SUMMER25', 25, 50, 0, 1),
       ('VIP50', 50, 5, 0, 1)`
    );

    const [orderRes] = await conn.query(
      `INSERT INTO orders (order_number, user_id, status, subtotal, discount, total, coupon_code, shipping_address, payment_last4)
       VALUES ('NEO-100001', ?, 'delivered', 179.99, 0, 179.99, NULL, '482 Birchwood Ave, Austin, TX 78701', '4242')`,
      [userIds['alice@example.com']]
    );
    await conn.query(
      `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
       VALUES (?, ?, 'Aurora Wireless Headphones', 179.99, 1)`,
      [orderRes.insertId, productIds['NEO-AUD-001']]
    );

  } finally {
    conn.release();
    await pool.end();
  }
}

seed().catch((err) => {
  process.exit(1);
});