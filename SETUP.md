# NeoStore Vulnerable E-Commerce Security Lab

Stack: **Node.js + Express** API, **MySQL/MariaDB** database, plain HTML/JS +
Tailwind (CDN) frontend served statically by Express. Design tokens are
adapted from the Stitch designs you provided (`neo_admin_e_commerce/DESIGN.md`).

> ⚠️ This application is intentionally vulnerable (BOLA/IDOR, broken auth,
> broken access control, price manipulation, business logic flaws, and a
> bonus SQL injection). Run it only on an isolated machine/VM/container, never
> expose it to the internet. See `VULNERABILITIES.md` for the full catalog,
> exploit steps, and fixes.

## 1. Prerequisites

- Node.js 18+
- A running MySQL or MariaDB server you can create a database on

## 2. Set up the database

```bash
mysql -u root -p < backend/db/schema.sql
```

This creates the `neostore_lab` database and all tables.

## 3. Configure the backend

```bash
cd backend
cp .env.example .env
# edit .env with your MySQL credentials if not using root/password@localhost
npm install
npm run seed     # populates demo users, products, coupons, a sample order
```

## 4. Run it

```bash
npm start
# API + frontend now served at http://localhost:4000
```

Open `http://localhost:4000/index.html` in a browser. Log in with one of the
seeded accounts printed by `npm run seed` (also listed in
`VULNERABILITIES.md`).

## 5. Project layout

```
backend/
  server.js            Express app entry point
  db/schema.sql         Table definitions
  db/seed.js             Demo data (users/products/coupons/orders)
  middleware/auth.js    JWT + access-control middleware (contains key bugs)
  routes/
    auth.js              register/login/forgot-reset-password
    products.js          public catalog (+ bonus SQLi)
    cart.js              cart CRUD (IDOR, no quantity validation)
    checkout.js          order placement (price manipulation, coupon abuse, stock race)
    orders.js            order history/detail (IDOR, unverified JWT route)
    users.js             profile (IDOR, mass-assignment privilege escalation)
    admin.js             staff console API (broken access control)
frontend/
  index.html, product.html, cart.html, checkout.html,
  login.html, register.html, forgot-password.html,
  profile.html, orders.html, admin/dashboard.html
  js/api.js             shared fetch client + auth/session helpers
  css/tokens.css         design tokens derived from your Stitch DESIGN.md
VULNERABILITIES.md      full vulnerability catalog with exploit + fix notes
```

## 6. Resetting the lab

To wipe and reseed:

```bash
mysql -u root -p < backend/db/schema.sql
cd backend && npm run seed
```

## 7. Suggested next steps

- Work through `VULNERABILITIES.md` top to bottom — each finding has a
  "try it" walkthrough using the debug panels built into the frontend
  (cart/order/profile lookup boxes, the `X-Debug-Role` header field on the
  admin console, etc.).
- Once you've exploited a class of bug, branch/copy the route file, apply
  the listed fix, and re-run the exploit to confirm it's closed — a good
  pattern for an "intermediate/advanced" track is vulnerable-mode →
  patch-it-yourself → compare against your own fix.
- If you want a second "patched" branch for diffing later, this is a good
  point to `git commit` the vulnerable baseline first.
