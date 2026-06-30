# NeoStore — Vulnerable E-Commerce Security Lab

An intentionally vulnerable, full-stack e-commerce application built for
practicing intermediate-to-advanced web security testing: **BOLA/IDOR,
broken authentication, broken access control, privilege escalation, price
manipulation, business logic flaws,** and a bonus **SQL injection**.

> ⚠️ **This application is deliberately insecure.** Do not deploy it to a
> public server, a shared network, or reuse any of its code in a real
> product. Run it only on a local machine, an isolated VM, or a container
> with no inbound access from the internet.

---

## Tech stack

| Layer    | Technology |
|----------|------------|
| Backend  | Node.js + Express |
| Database | MySQL / MariaDB |
| Frontend | Static HTML/CSS/JS + Tailwind CSS (CDN), no build step |
| Auth     | JSON Web Tokens (JWT) — intentionally misconfigured in places |

The frontend is plain HTML/JS by design, not a framework — it keeps every
request visible and editable directly in the browser/devtools, which is
useful when the entire point of the exercise is intercepting and tampering
with requests. All vulnerabilities live in the Express API and MySQL
queries, not in the frontend code.

---

## 1. Prerequisites

- **Node.js 18+** and npm
- A running **MySQL or MariaDB** server you have credentials to create a
  database on

---

## 2. Installation

### 2.1 Unzip and enter the project

```bash
# if you download .zip
unzip neostore-vulnerable-lab.zip
cd neostore-vulnerable-lab

# OR
git clone https://github.com/Rashid-dewewe/neostore-vulnerable-lab.git
cd neostore-vulnerable-lab
```

### 2.2 Create the database

```bash
# 1. connect
sudo mysql

# create DB and user
CREATE USER 'neostore'@'localhost' IDENTIFIED BY 'neostorepass';
GRANT ALL PRIVILEGES ON neostore_lab.* TO 'neostore'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

This creates the `neostore_lab` database and all tables (users, products,
carts, orders, coupons, etc.).

### 2.3 Configure environment variables

```bash
cd backend
touch .env
```

Edit `.env` and set `DB_USER` / `DB_PASSWORD` to match your local MySQL
login:

```ini
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=neostore
DB_PASSWORD=neostorepass
DB_NAME=neostore_lab
JWT_SECRET=neostore_secret_123   # intentionally weak — see vulnerability list
JWT_EXPIRES_IN=7d
```

### 2.4 Install dependencies

```bash
npm install
```

### 2.5 Seed demo data

```bash
npm run seed
```

This populates demo categories, products, coupons, a sample order, and the
following accounts (also printed to the console):

| Role     | Email                   | Password      |
|----------|--------------------------|---------------|
| customer | alice@example.com        | Password123!  |
| customer | bob@example.com          | Password123!  |
| customer | carol@example.com        | Password123!  |
| support  | support@neostore.test    | Support123!   |
| admin    | admin@neostore.test      | Admin123!     |

---

## 3. Running the app

```bash
npm start
```

```
NeoStore vulnerable lab API listening on http://localhost:4000
```

Open **http://localhost:4000/index.html** and log in with any seeded
account above.

For active development with auto-restart:

```bash
npm run dev
```

### Resetting the lab

```bash
mysql -u root -p < backend/db/schema.sql
cd backend && npm run seed
```

---

## 4. Project structure

```
app/
├── backend/
│   ├── server.js              Express entry point / route wiring
│   ├── db/
│   │   ├── schema.sql          Table definitions
│   │   ├── seed.js             Demo users/products/coupons/orders
│   │   └── pool.js             MySQL connection pool
│   ├── middleware/
│   │   └── auth.js             JWT + access-control middleware (key bugs live here)
│   └── routes/
│       ├── auth.js             register / login / forgot-password / reset-password
│       ├── products.js         public catalog (+ bonus SQL injection)
│       ├── cart.js             cart CRUD (IDOR, no quantity validation)
│       ├── checkout.js         order placement (price manipulation, coupon abuse, stock race)
│       ├── orders.js           order history/detail (IDOR, unverified JWT route)
│       ├── users.js            profile (IDOR, mass-assignment privilege escalation)
│       └── admin.js            staff console API (broken access control)
├── frontend/
│   ├── index.html, product.html, cart.html, checkout.html
│   ├── login.html, register.html, forgot-password.html
│   ├── profile.html, orders.html
│   ├── admin/dashboard.html    staff console UI
│   ├── js/api.js               shared fetch client + session helpers
│   └── css/tokens.css          design tokens derived from the provided Stitch design
├── VULNERABILITIES.md          full vulnerability catalog (exploit + fix detail)
├── SETUP.md                    original setup notes
└── README.md                   this file
```

---

## 5. Vulnerability catalog

Every bug below is marked in the source with a `VULN(...)` comment at the
exact point it's introduced, and most pages have a built-in **debug
panel** so you can trigger the exploit straight from the browser UI
(no Burp/Postman required, though either works). Full step-by-step
exploitation and remediation notes live in **`VULNERABILITIES.md`** —
this is the summary.

### 5.1 BOLA / IDOR (Broken Object Level Authorization)
- `GET /api/cart/:cartId` — returns *any* cart by id, no owner check
- `PUT` / `DELETE /api/cart/items/:itemId` — mutates any cart item by id
- `GET /api/orders/:id` — returns any order (sequential ids), no owner check
- `POST /api/orders/:id/cancel`, `PATCH /api/orders/:id/status` — mutate any order
- `GET` / `PUT /api/users/:id`, `GET /api/users/:id/addresses` — read/write any user's profile

### 5.2 Broken Authentication
- Login leaks whether an email exists (different error for "no account" vs. "wrong password")
- No rate limiting / lockout on the login endpoint
- A "legacy" middleware (`legacyDecodeAuth`) calls `jwt.decode()` instead of `jwt.verify()` on the order-detail route — **accepts forged, unsigned JWTs**
- Weak, hardcoded-style JWT secret with a 7-day expiry and no revocation
- Password reset token is `base64(email:timestamp)` — predictable, unsigned, and the expiry column is never actually checked on redemption

### 5.3 Broken Access Control
- The staff-gating middleware (`requireStaff`) denylists only the literal `'customer'` role instead of allowlisting `'admin'` — so the `support` role reaches every admin endpoint, including price edits and **role promotion**
- That same middleware trusts an `X-Debug-Role` header as a full role override (a leftover "QA" backdoor)
- `PATCH /api/orders/:id/status` lets *any* customer mark *any* order as delivered/shipped — no staff check at all
- Admin nav links are hidden client-side, but every underlying API route is reachable directly

### 5.4 Privilege Escalation (Mass Assignment)
- `PUT /api/users/:id` forwards arbitrary request body keys — including `role` and `loyalty_points` — straight into the SQL update, letting a customer set their own `role: "admin"`

### 5.5 Price Manipulation
- `POST /api/checkout` trusts the client-supplied `price` on every line item instead of re-reading it from the database; the forged price is even persisted into order history

### 5.6 Business Logic Flaws
- Coupons: usage count is never incremented and `max_uses` is never enforced — any code can be replayed indefinitely
- Coupons can be **stacked** by sending multiple codes in one request
- Cart quantities accept negative numbers, which feed straight into checkout's subtotal
- Stock is checked and decremented in two separate, unlocked queries — a classic TOCTOU race condition exploitable against a seeded low-stock item

### 5.7 Sensitive Data Exposure (bonus)
- Several endpoints `SELECT *`, leaking bcrypt password hashes and internal admin-only notes to any caller who can reach the route
- Wholesale product cost is exposed alongside retail price

### 5.8 SQL Injection (bonus, advanced)
- `GET /api/products?sort=...` concatenates the `sort` query parameter directly into SQL instead of validating it against an allowlist of columns — exploitable via UNION-based injection

---

## 6. Suggested exercise order

1. Read the API surface in `backend/routes/*.js`.
2. **IDOR tour** — as a low-privilege customer, walk cart/order/user ids using the debug lookup panels.
3. **Forge a JWT** against the legacy order-detail route.
4. **Escalate privileges** — turn a `support` (or even `customer`) account into `admin` via mass assignment or the `X-Debug-Role` header.
5. **Abuse checkout** — rewrite prices, stack coupons, oversell limited stock.
6. *(Bonus)* find and exploit the `sort` SQL injection.
7. For each finding: document endpoint, request, impact, and a one-line fix — then implement the fix in a copy of the route and confirm the exploit no longer works.

For full step-by-step walkthroughs (including example forged tokens and concrete request bodies), see **`VULNERABILITIES.md`**.
