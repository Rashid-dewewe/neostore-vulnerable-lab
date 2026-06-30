# NeoStore Vulnerable E-Commerce Security Lab — Vulnerability Guide 🎯

This app is **intentionally insecure**. Every bug below was planted on purpose for
training. Do not deploy this anywhere public or reuse this code in
a real product.

Demo accounts (created by `npm run seed`):

| role     | email                    | password      |
|----------|--------------------------|---------------|
| customer | alice@example.com        | Password123!  |
| customer | bob@example.com          | Password123!  |
| customer | carol@example.com        | Password123!  |
| support  | support@neostore.test    | Support123!   |
| admin    | admin@neostore.test      | Admin123!     |

---

## 1. BOLA / IDOR (Broken Object Level Authorization)

| # | Endpoint | File | Bug |
|---|----------|------|-----|
| 1.1 | `GET /api/cart/:cartId` | `routes/cart.js` | Returns any cart by id, no owner check. |
| 1.2 | `PUT/DELETE /api/cart/items/:itemId` | `routes/cart.js` | Mutates any cart_item by id, no owner check. |
| 1.3 | `GET /api/orders/:id` | `routes/orders.js` | Returns any order (sequential ids), no owner check, **and** uses unverified-JWT middleware (see §2.3). |
| 1.4 | `POST /api/orders/:id/cancel`, `PATCH /api/orders/:id/status` | `routes/orders.js` | Mutates any order's status, no owner check. |
| 1.5 | `GET/PUT /api/users/:id`, `GET /api/users/:id/addresses` | `routes/users.js` | Reads/writes any user's profile, no owner check. |

**Try it:** log in as Alice, then in `orders.html` look up order id `1` (Alice's order) and `2`+ (other customers' orders, once you've placed a few). Or in `profile.html`, look up user id `5` (the seeded admin) to see their bcrypt hash and internal notes.

**NEW:** The updated frontend includes a `categories.html`, `deals.html`, and `support.html` with enhanced navigation. The BOLA vulnerabilities remain exploitable through these pages as well.

**Fix:** every handler must compare the resource's owning `user_id` against `req.user.id` (or require an explicit staff role) before reading or writing.

---

## 2. Broken Authentication

| # | Bug | File |
|---|-----|------|
| 2.1 | User enumeration — login returns "No account found" vs "Incorrect password". | `routes/auth.js` |
| 2.2 | No rate limiting / lockout on `/api/auth/login`. | `routes/auth.js` |
| 2.3 | `resolveInternalSession` middleware uses `jwt.decode()` instead of `jwt.verify()` — accepts **unsigned, forged** tokens. Wired to `GET /api/orders/:id`. | `middleware/auth.js` |
| 2.4 | Weak, hardcoded-style JWT secret (`neostore_secret_123`) with a 7-day expiry and no revocation. | `.env.example` |
| 2.5 | Password reset token is `base64(email:timestamp)` — predictable, unsigned, not stored hashed, and the expiry column is never checked on redemption. | `routes/auth.js` |

**Try it (2.3, the sharpest one):** craft a JWT with `{"alg":"none"}` (or any algorithm) and a payload like `{"id": 2, "role": "customer"}` — no valid signature required. Paste it into the "forged token" box on `orders.html` and look up any order id. Example forged token (header.payload, empty sig):

```
eyJhbGciOiJub25lIn0.eyJpZCI6Mn0.
```

**Try it (2.5):** call `POST /api/auth/forgot-password` for a known email, note the `debug_reset_token` field (stands in for "intercepted email"), then call `/api/auth/reset-password`. In a real attack you wouldn't need the debug field — just the email + a timestamp guess.

**NEW:** The enhanced frontend now includes `deals.html` which calls `Products.getAll()` — this endpoint is also vulnerable to the SQL injection described in §8.1.

**Fix:** always `jwt.verify()` with a strong secret/asymmetric key, add rate limiting (e.g. `express-rate-limit`), return identical login errors, and generate reset tokens with `crypto.randomBytes(32)`, store only their hash, and enforce `reset_token_expires` on redemption.

---

## 3. Broken Access Control

| # | Bug | File |
|---|-----|------|
| 3.1 | `requireStaff` denylists only `'customer'` instead of allowlisting `'admin'` — the `'support'` role (and anything that isn't literally `customer`) reaches every `/api/admin/*` route, including price/stock edits and **role promotion**. | `middleware/auth.js` |
| 3.2 | `requireStaff` also trusts an `X-Debug-Role` request header as a full override — a leftover "internal QA" backdoor. | `middleware/auth.js` |
| 3.3 | `PATCH /api/orders/:id/status` lets any logged-in customer mark *any* order `delivered`/`shipped` — no staff check at all. | `routes/orders.js` |
| 3.4 | Admin pages are hidden client-side (nav link only renders for staff) but every API route must be hit directly to actually be safe — and they aren't. | `frontend/js/api.js`, `frontend/admin/dashboard.html` |

**Try it:** log in as `support@neostore.test`, open `/admin/dashboard.html`, and use the Roles tab to promote yourself to `admin` (`POST /api/admin/users/:id/promote`). Or, as a plain customer, set `X-Debug-Role: admin` in the debug header box on that same page and reload any tab.

**NEW:** The improved frontend now uses `renderNav()` from `api.js` consistently across all pages. The admin link is conditionally rendered based on `Auth.isAdmin()` but the API itself remains vulnerable to direct access.

**Fix:** replace the denylist with `if (role !== 'admin') return 403` (or an explicit allowlist per route), delete the debug header entirely, and add a staff/owner check to every status-mutating order route.

---

## 4. Privilege Escalation via Mass Assignment

| # | Bug | File |
|---|-----|------|
| 4.1 | `PUT /api/users/:id` forwards arbitrary body keys (including `role` and `loyalty_points`) straight into the SQL `UPDATE` instead of allowlisting only `full_name`/`phone`. | `routes/users.js` |

**Try it:** on `profile.html`, target your own user id with body `{"role":"admin"}`. Then **log out and back in** (so a fresh JWT picks up the new role claim) — your token now authorizes admin routes.

**NEW:** The updated frontend `profile.html` now has a cleaner UI with metrics cards and better visual feedback. The mass assignment vulnerability remains exploitable through the same endpoint.

**Fix:** explicitly allowlist editable fields server-side; never spread `req.body` into a query. Sensitive fields like `role` should only be settable through a dedicated, properly-authorized endpoint.

---

## 5. Price Manipulation

| # | Bug | File |
|---|-----|------|
| 5.1 | `POST /api/checkout` trusts the client-supplied `price` on every line item instead of re-reading `products.price` from the database. The forged price is even persisted into `order_items`. | `routes/checkout.js` |

**Try it:** on `checkout.html`, the multi-step checkout process now includes a review step. Intercept the `POST /api/checkout` request and modify the `price` field to `0.01` before placing the order.

**NEW:** The enhanced checkout page now features:
- 4-step checkout flow (Shipping → Delivery → Payment → Review)
- Real-time order summary updates
- Cart item display with images
- Coupon code field
- Secure checkout badge

Despite the enhanced UI, the **price manipulation vulnerability remains** — the server still trusts client-supplied prices.

**Fix:** recompute `unit_price` and `subtotal` server-side from the authoritative product record inside the same transaction that creates the order; never trust client-sent monetary values.

---

## 6. Business Logic Flaws

| # | Bug | File |
|---|-----|------|
| 6.1 | Coupons: `times_used` is never incremented and `max_uses` is never enforced, so any code (including `VIP50`, 50% off) can be replayed indefinitely. | `routes/checkout.js` |
| 6.2 | Coupons can be **stacked** by sending an array of codes (`coupon_codes`), each discount adding on top of the last. | `routes/checkout.js` |
| 6.3 | Cart quantities accept negative numbers with no validation, which feed straight into the checkout subtotal and can drive a multi-item order's total toward zero or negative. | `routes/cart.js`, `routes/checkout.js` |
| 6.4 | Stock is read then decremented in two separate, unlocked queries (classic TOCTOU). Concurrent checkouts against a low-stock item (`Eclipse Limited Edition Sneaker`, seeded with 3 units) can oversell. | `routes/checkout.js` |

**Try it (6.1/6.2):** on `checkout.html`, enter `VIP50, VIP50, VIP50` in the coupon field and place an order — discount stacks to 150% off, and you can repeat it on a second order.

**Try it (6.4):** fire several concurrent `POST /api/checkout` requests for the Eclipse sneaker (e.g. with a small script using `Promise.all`) and watch `stock` go negative in the admin Inventory tab.

**NEW:** The enhanced `cart.html` now includes:
- Quantity increment/decrement buttons
- Remove item buttons
- Real-time subtotal updates
- Order summary sidebar
- Secure checkout badge

These UI improvements **do not fix** the underlying vulnerabilities — the server-side logic remains vulnerable.

**Fix:** wrap stock check + decrement in a transaction with `SELECT ... FOR UPDATE` (or a single atomic `UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?` checked for affected rows); enforce `max_uses` with an atomic increment guarded by `times_used < max_uses`; reject non-positive quantities at the API boundary.

---

## 7. Sensitive Data Exposure (bonus)

- `GET /api/users/:id` and `GET /api/admin/customers` both `SELECT *`, leaking `password_hash` and `internal_notes` to any caller who can reach the route (see §1 and §3).
- `GET /api/admin/products` exposes wholesale `cost` alongside retail `price`.

**Try it:** Access `GET /api/users/5` as a logged-in user to see the admin's `password_hash` and `internal_notes`.

**NEW:** The `profile.html` page now displays user data in a clean card layout, but the underlying API still returns sensitive fields.

**Fix:** Use explicit column lists in all SELECT queries (never `SELECT *` for user-facing endpoints). Remove sensitive fields from responses unless explicitly needed for admin functions with proper authorization.

---

## 8. SQL Injection (bonus, advanced)

| # | Bug | File |
|---|-----|------|
| 8.1 | `GET /api/products?sort=...` concatenates the `sort` query param directly into the SQL string instead of validating it against an allowlist of columns. | `routes/products.js` |
| 8.2 | `GET /api/products?q=...` parameter is vulnerable to time-based blind SQL injection (in addition to the UNION-based sort vector). | `routes/products.js` |

**Try it:** start with a harmless `?sort=price` to confirm it works, then explore UNION-based extraction against the `products`/`users` tables (the `products` SELECT pulls 8 columns, so a matching `UNION SELECT` needs 8 columns too).

**NEW:** The `deals.html` page calls `Products.getAll()` — this means the SQL injection is exploitable through the "Deals" page as well via URL parameters.

Example exploit: `GET /api/products?sort=price%20DESC%20UNION%20SELECT%201,2,3,4,5,6,7,8%20FROM%20users--`

**Fix:** allowlist `sort` against a fixed set of `{column, direction}` pairs; never interpolate user input into SQL syntax, even for "just a column name."

---

## 9. New Vulnerabilities in Enhanced Frontend

The enhanced frontend introduces new attack surfaces:

### 9.1 Navigation & Routing
| # | Bug | File |
|---|-----|------|
| 9.1 | The `categories.html`, `deals.html`, and `support.html` pages are served statically and don't perform server-side session validation (they rely on client-side `Auth.isLoggedIn()`). | `frontend/*.html` |

### 9.2 Support Form
| # | Bug | File |
|---|-----|------|
| 9.2 | `support.html` includes a form with no CSRF protection, no rate limiting, and no input sanitization — vulnerable to XSS and form submission abuse. | `frontend/support.html` |

**Try it:** Submit a support ticket with `<script>alert('XSS')</script>` in the message field.

### 9.3 Deals Page
| # | Bug | File |
|---|-----|------|
| 9.3 | `deals.html` generates random discounts client-side (`Math.floor(Math.random() * 30) + 10`). These discounts are purely cosmetic and don't reflect actual server-side pricing. | `frontend/deals.html` |

**Try it:** Inspect the JavaScript on `deals.html` — the discount calculation is visible and modifiable in the browser console.

**Fix:** Generate discounts server-side and include them in the product response. Never calculate business logic (discounts, pricing, taxes) client-side.

---

## 10. Suggested Exercise Order

1. **Recon** — Read the API surface (`routes/*.js`) and `VULNERABILITIES.md`.
2. **BOLA Tour** — Walk cart/order/user IDs as a low-privilege customer using the enhanced UI:
   - `orders.html` - Look up other users' orders
   - `profile.html` - Look up other users' profiles
   - `cart.html` - Access other users' carts
3. **Forge a JWT** — Against the legacy order-detail route (`/api/orders/:id`).
4. **Escalate Privileges** — Turn a `support` (or even `customer`) account into `admin` via:
   - Mass assignment on `PUT /api/users/:id`
   - `X-Debug-Role` header on admin routes
5. **Abuse Checkout** — Using the enhanced checkout UI:
   - Rewrite prices (intercept `POST /api/checkout`)
   - Stack coupons (`VIP50, VIP50, VIP50`)
   - Oversell limited stock (concurrent requests)
6. **SQL Injection** — Exploit `GET /api/products?sort=...` UNION injection.
7. **XSS Exploration** — Test the support form for cross-site scripting.
8. **Documentation** — For each finding, write down: endpoint, request, impact, and a one-line fix — then go implement the fix and confirm the exploit no longer works.

---

## 11. Quick Exploit Reference

### 11.1 IDOR Examples

```bash
# View another user's cart
GET /api/cart/2

# View another user's orders
GET /api/orders/3

# View another user's profile (includes password_hash!)
GET /api/users/2

# Update another user's role (mass assignment)
PUT /api/users/2
{"role": "admin"}
```

### 11.2 Price Manipulation

```bash
# Checkout with modified prices
POST /api/checkout
{
  "items": [
    {
      "product_id": 1,
      "name": "Aurora Wireless Headphones",
      "price": "0.01",  # ← Modified!
      "quantity": 1
    }
  ],
  "coupon_codes": ["VIP50"],
  "shipping_address": "123 Fake St",
  "payment": {"card_number": "4242"}
}
```

### 11.3 Coupon Stacking

```bash
# Stack multiple coupons
POST /api/checkout
{
  "items": [...],
  "coupon_codes": ["VIP50", "VIP50", "VIP50"],  # 150% off!
  ...
}
```

### 11.4 SQL Injection (UNION)

```bash
# Extract user data
GET /api/products?sort=price%20UNION%20SELECT%20id,email,password_hash,4,5,6,7,8%20FROM%20users--
```

### 11.5 Forged JWT

```javascript
// In browser console or using jwt.io
// Header: {"alg": "none"}
// Payload: {"id": 2, "role": "admin"}
// Signature: (empty)

const forgedToken = 'eyJhbGciOiJub25lIn0.eyJpZCI6Miwicm9sZSI6ImFkbWluIn0.';

// Use in Authorization header
fetch('/api/orders/1', {
  headers: { 'Authorization': `Bearer ${forgedToken}` }
})
```

---

## 12. Fix Summary

| Vulnerability | Fix |
|---------------|-----|
| BOLA/IDOR | Add owner check: `WHERE user_id = req.user.id` |
| Forged JWT | Use `jwt.verify()` instead of `jwt.decode()` |
| Mass Assignment | Allowlist editable fields: `['full_name', 'phone']` |
| Price Manipulation | Re-read prices from database server-side |
| Coupon Abuse | Implement atomic `times_used` increment with `max_uses` check |
| Race Condition | Use database transaction with `SELECT ... FOR UPDATE` |
| SQL Injection | Use parameterized queries or validate against allowlist |
| XSS | Sanitize all user input and use output encoding |
| CSRF | Implement CSRF tokens for state-changing requests |

---

## 13. Additional Resources

- [OWASP Top 10](https://owasp.org/Top10/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [JWT Security Best Practices](https://auth0.com/blog/ten-things-you-should-know-about-tokens-and-cookies/)
- [SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)

---

**Remember:** This lab is for educational purposes only. Practice ethical hacking and responsible disclosure. Happy hacking! 🔒
