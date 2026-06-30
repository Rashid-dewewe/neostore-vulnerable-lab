# NeoStore Vulnerable E-Commerce Security Lab — Vulnerability Guide

This app is **intentionally insecure**. Every bug below was planted on purpose for
training and is documented in the source with a `VULN(...)` comment at the
point of injection. Do not deploy this anywhere public or reuse this code in
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

**Try it:** log in as Alice, then in `orders.html`'s debug panel look up order id
`1` (Alice's order) and `2`+ (other customers' orders, once you've placed a
few). Or in `profile.html`, look up user id `5` (the seeded admin) to see
their bcrypt hash and internal notes.

**Fix:** every handler must compare the resource's owning `user_id` against
`req.user.id` (or require an explicit staff role) before reading or writing.

---

## 2. Broken Authentication

| # | Bug | File |
|---|-----|------|
| 2.1 | User enumeration — login returns "No account found" vs "Incorrect password". | `routes/auth.js` |
| 2.2 | No rate limiting / lockout on `/api/auth/login`. | `routes/auth.js` |
| 2.3 | `legacyDecodeAuth` middleware uses `jwt.decode()` instead of `jwt.verify()` — accepts **unsigned, forged** tokens. Wired to `GET /api/orders/:id`. | `middleware/auth.js` |
| 2.4 | Weak, hardcoded-style JWT secret (`neostore_secret_123`) with a 7-day expiry and no revocation. | `.env.example` |
| 2.5 | Password reset token is `base64(email:timestamp)` — predictable, unsigned, not stored hashed, and the expiry column is never checked on redemption. | `routes/auth.js` |

**Try it (2.3, the sharpest one):** craft a JWT with `{"alg":"none"}` (or any
algorithm) and a payload like `{"id": 2, "role": "customer"}` — no valid
signature required. Paste it into the "forged token" box on `orders.html`
and look up any order id. Example forged token (header.payload, empty sig):

```
eyJhbGciOiJub25lIn0.eyJpZCI6Mn0.
```

**Try it (2.5):** call `POST /api/auth/forgot-password` for a known email,
note the `debug_reset_token` field (stands in for "intercepted email"), then
call `/api/auth/reset-password`. In a real attack you wouldn't need the
debug field — just the email + a timestamp guess.

**Fix:** always `jwt.verify()` with a strong secret/asymmetric key, add
rate limiting (e.g. `express-rate-limit`), return identical login errors,
and generate reset tokens with `crypto.randomBytes(32)`, store only their
hash, and enforce `reset_token_expires` on redemption.

---

## 3. Broken Access Control

| # | Bug | File |
|---|-----|------|
| 3.1 | `requireStaff` denylists only `'customer'` instead of allowlisting `'admin'` — the `'support'` role (and anything that isn't literally `customer`) reaches every `/api/admin/*` route, including price/stock edits and **role promotion**. | `middleware/auth.js` |
| 3.2 | `requireStaff` also trusts an `X-Debug-Role` request header as a full override — a leftover "internal QA" backdoor. | `middleware/auth.js` |
| 3.3 | `PATCH /api/orders/:id/status` lets any logged-in customer mark *any* order `delivered`/`shipped` — no staff check at all. | `routes/orders.js` |
| 3.4 | Admin pages are hidden client-side (nav link only renders for staff) but every API route must be hit directly to actually be safe — and they aren't. | `frontend/js/api.js`, `frontend/admin/dashboard.html` |

**Try it:** log in as `support@neostore.test`, open `/admin/dashboard.html`,
and use the Roles tab to promote yourself to `admin`
(`POST /api/admin/users/:id/promote`). Or, as a plain customer, set
`X-Debug-Role: admin` in the debug header box on that same page and reload
any tab.

**Fix:** replace the denylist with `if (role !== 'admin') return 403` (or an
explicit allowlist per route), delete the debug header entirely, and add a
staff/owner check to every status-mutating order route.

---

## 4. Privilege Escalation via Mass Assignment

| # | Bug | File |
|---|-----|------|
| 4.1 | `PUT /api/users/:id` forwards arbitrary body keys (including `role` and `loyalty_points`) straight into the SQL `UPDATE` instead of allowlisting only `full_name`/`phone`. | `routes/users.js` |

**Try it:** on `profile.html`'s "Raw profile update" panel, target your own
user id with body `{"role":"admin"}`. Then **log out and back in** (so a
fresh JWT picks up the new role claim) — your token now authorizes admin
routes.

**Fix:** explicitly allowlist editable fields server-side; never spread
`req.body` into a query. Sensitive fields like `role` should only be
settable through a dedicated, properly-authorized endpoint.

---

## 5. Price Manipulation

| # | Bug | File |
|---|-----|------|
| 5.1 | `POST /api/checkout` trusts the client-supplied `price` on every line item instead of re-reading `products.price` from the database. The forged price is even persisted into `order_items`. | `routes/checkout.js` |

**Try it:** on `checkout.html`, the "unit price" input next to every cart
item is editable — set it to `0.01` and place the order; check the returned
total and then look the order up in `orders.html`.

**Fix:** recompute `unit_price` and `subtotal` server-side from the
authoritative product record inside the same transaction that creates the
order; never trust client-sent monetary values.

---

## 6. Business Logic Flaws

| # | Bug | File |
|---|-----|------|
| 6.1 | Coupons: `times_used` is never incremented and `max_uses` is never enforced, so any code (including `VIP50`, 50% off) can be replayed indefinitely. | `routes/checkout.js` |
| 6.2 | Coupons can be **stacked** by sending an array of codes (`coupon_codes`), each discount adding on top of the last. | `routes/checkout.js` |
| 6.3 | Cart quantities accept negative numbers with no validation, which feed straight into the checkout subtotal and can drive a multi-item order's total toward zero or negative. | `routes/cart.js`, `routes/checkout.js` |
| 6.4 | Stock is read then decremented in two separate, unlocked queries (classic TOCTOU). Concurrent checkouts against a low-stock item (`Eclipse Limited Edition Sneaker`, seeded with 3 units) can oversell. | `routes/checkout.js` |

**Try it (6.1/6.2):** on `checkout.html`, enter `VIP50, VIP50, VIP50` in the
coupon field and place an order — discount stacks to 150% off, and you can
repeat it on a second order.

**Try it (6.4):** fire several concurrent `POST /api/checkout` requests for
the Eclipse sneaker (e.g. with a small script using `Promise.all`) and watch
`stock` go negative in the admin Inventory tab.

**Fix:** wrap stock check + decrement in a transaction with
`SELECT ... FOR UPDATE` (or a single atomic
`UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?` checked
for affected rows); enforce `max_uses` with an atomic increment guarded by
`times_used < max_uses`; reject non-positive quantities at the API boundary.

---

## 7. Sensitive Data Exposure (bonus)

- `GET /api/users/:id` and `GET /api/admin/customers` both `SELECT *`,
  leaking `password_hash` and `internal_notes` to any caller who can reach
  the route (see §1 and §3).
- `GET /api/admin/products` exposes wholesale `cost` alongside retail
  `price`.

---

## 8. SQL Injection (bonus, advanced)

| # | Bug | File |
|---|-----|------|
| 8.1 | `GET /api/products?sort=...` concatenates the `sort` query param directly into the SQL string instead of validating it against an allowlist of columns. | `routes/products.js` |

**Try it:** start with a harmless `?sort=price` to confirm it works, then
explore UNION-based extraction against the `products`/`users` tables (the
`products` SELECT pulls 8 columns, so a matching `UNION SELECT` needs 8
columns too).

**Fix:** allowlist `sort` against a fixed set of `{column, direction}`
pairs; never interpolate user input into SQL syntax, even for "just a
column name."

---

## Suggested exercise order

1. Recon the API surface (read this guide + `routes/*.js`).
2. BOLA tour: walk cart/order/user ids as a low-privilege customer.
3. Forge a JWT against the legacy order-detail route.
4. Escalate a `support` (or even `customer`) account to `admin` via mass
   assignment or the `X-Debug-Role` header.
5. Abuse checkout: rewrite prices, stack coupons, oversell limited stock.
6. (Bonus) Find and exploit the `sort` SQL injection.
7. For each finding, write down: endpoint, request, impact, and a one-line
   fix — then go implement the fix and confirm the exploit no longer works.
