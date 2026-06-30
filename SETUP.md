I'll update `SETUP.md` with comprehensive information based on all the enhancements we've made, using `README.md` as a reference.

```bash
cd /home/unix/e-commerceTask/neostore-vulnerable-lab
nano SETUP.md
```

```markdown
# NeoStore Vulnerable E-Commerce Security Lab — Setup Guide

**Stack:** Node.js + Express API, MySQL/MariaDB database, plain HTML/JS + Tailwind CSS (CDN) frontend served statically by Express. Design tokens are adapted from the Stitch designs you provided.

> ⚠️ **IMPORTANT:** This application is intentionally vulnerable (BOLA/IDOR, broken auth, broken access control, price manipulation, business logic flaws, and a bonus SQL injection). Run it only on an isolated machine/VM/container, never expose it to the internet. See `VULNERABILITIES.md` for the full catalog, exploit steps, and fixes.

---

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Quick Start](#2-quick-start)
3. [Detailed Setup](#3-detailed-setup)
4. [Project Structure](#4-project-structure)
5. [Running the Application](#5-running-the-application)
6. [Resetting the Lab](#6-resetting-the-lab)
7. [Troubleshooting](#7-troubleshooting)
8. [Testing Accounts](#8-testing-accounts)
9. [Next Steps](#9-next-steps)

---

## 1. Prerequisites

- **Node.js 18+** and npm
- **MySQL 5.7+** or **MariaDB 10.3+**
- Modern web browser (Chrome/Firefox recommended for DevTools)
- (Optional) API testing tool: Burp Suite, OWASP ZAP, Postman, or curl

---

## 2. Quick Start

```bash
# 1. Clone or unzip the project
unzip neostore-vulnerable-lab.zip
cd neostore-vulnerable-lab

# 2. Set up database
mysql -u root -p < backend/db/schema.sql

# 3. Install dependencies and seed data
cd backend
npm install
cp .env.example .env
# Edit .env with your MySQL credentials
npm run seed

# 4. Start the server
npm start

# 5. Open in browser
# http://localhost:4000
```

---

## 3. Detailed Setup

### 3.1 Database Setup

#### Option A: Using the provided schema (Recommended)

```bash
# Connect to MySQL and run the schema
mysql -u root -p < backend/db/schema.sql

# Or connect first, then source
mysql -u root -p
mysql> CREATE DATABASE IF NOT EXISTS neostore_lab;
mysql> USE neostore_lab;
mysql> SOURCE backend/db/schema.sql;
mysql> EXIT;
```

#### Option B: Create dedicated database user

```bash
# Connect to MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE neostore_lab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'neostore'@'localhost' IDENTIFIED BY 'neostorepass';
GRANT ALL PRIVILEGES ON neostore_lab.* TO 'neostore'@'localhost';
FLUSH PRIVILEGES;

# Import the schema
USE neostore_lab;
SOURCE backend/db/schema.sql;
EXIT;
```

### 3.2 Backend Configuration

```bash
cd backend

# Copy example environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

#### `.env` Configuration:

```ini
# Server
PORT=4000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=neostore           # or 'root' if using root
DB_PASSWORD=neostorepass   # your MySQL password
DB_NAME=neostore_lab

# JWT - Intentionally weak for the lab
JWT_SECRET=neostore_secret_123
JWT_EXPIRES_IN=7d
```

### 3.3 Install Dependencies

```bash
npm install
```

This installs:
- `express` - Web framework
- `mysql2` - MySQL driver with promise support
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `dotenv` - Environment variables
- `cors` - Cross-origin resource sharing
- `cookie-parser` - Cookie parsing
- `morgan` - HTTP request logging
- `nodemon` - Development auto-reload (dev dependency)

### 3.4 Seed Demo Data

```bash
npm run seed
```

This populates:
- 4 categories (Electronics, Home & Kitchen, Apparel, Outdoors)
- 11 products with realistic data
- 5 user accounts (3 customers, 1 support, 1 admin)
- 3 coupons (WELCOME10, SUMMER25, VIP50)
- Sample order for Alice
- Addresses for customers

---

## 4. Project Structure

```
neostore-vulnerable-lab/
├── backend/                     # Express API server
│   ├── server.js               # Entry point, route wiring
│   ├── package.json            # Dependencies
│   ├── .env                    # Environment variables (create from .env.example)
│   ├── .env.example            # Template for .env
│   ├── db/
│   │   ├── pool.js             # MySQL connection pool
│   │   ├── schema.sql          # Database table definitions
│   │   └── seed.js             # Demo data generator
│   ├── middleware/
│   │   └── auth.js             # JWT + access-control (key bugs live here)
│   └── routes/
│       ├── auth.js             # Register, login, password reset
│       ├── products.js         # Public catalog (+ SQL injection)
│       ├── cart.js             # Cart CRUD (IDOR, no validation)
│       ├── checkout.js         # Order placement (price manipulation, coupon abuse)
│       ├── orders.js           # Order history (IDOR, unverified JWT)
│       ├── users.js            # Profile (IDOR, mass assignment)
│       └── admin.js            # Admin API (broken access control)
├── frontend/                   # Static frontend files
│   ├── index.html              # Homepage with products
│   ├── product.html            # Product detail page
│   ├── cart.html               # Shopping cart
│   ├── checkout.html           # Multi-step checkout
│   ├── login.html              # Login page
│   ├── register.html           # Registration
│   ├── forgot-password.html    # Password reset
│   ├── profile.html            # User profile
│   ├── orders.html             # Order history
│   ├── categories.html         # Category browsing (NEW)
│   ├── deals.html              # Deals & discounts (NEW)
│   ├── support.html            # Support center (NEW)
│   ├── admin/
│   │   └── dashboard.html      # Admin management console
│   ├── css/
│   │   ├── tokens.css          # Design tokens
│   │   └── main.css            # Unified styles (NEW)
│   └── js/
│       └── api.js              # API client, auth helpers
├── VULNERABILITIES.md          # Full vulnerability catalog
├── DESIGN_SOURCE.md            # Design system documentation
├── README.md                   # Project overview
└── SETUP.md                    # This file
```

---

## 5. Running the Application

### 5.1 Development Mode (with auto-reload)

```bash
npm run dev
```

### 5.2 Production Mode

```bash
npm start
```

### 5.3 Access the Application

Open your browser and navigate to:
```
http://localhost:4000
```

You'll see the NeoStore homepage with:
- ✅ Product listings
- ✅ Search functionality
- ✅ Category filter
- ✅ Navigation bar with dynamic auth state

### 5.4 Available Endpoints

| Endpoint | Description |
|----------|-------------|
| `/` | Homepage |
| `/login.html` | Login page |
| `/register.html` | Registration page |
| `/forgot-password.html` | Password reset |
| `/cart.html` | Shopping cart |
| `/checkout.html` | Checkout process |
| `/orders.html` | Order history |
| `/profile.html` | User profile |
| `/product.html?id=X` | Product details |
| `/categories.html` | Browse categories |
| `/deals.html` | Deals & discounts |
| `/support.html` | Support center |
| `/admin/dashboard.html` | Admin console |
| `/api/*` | REST API endpoints |

---

## 6. Resetting the Lab

### 6.1 Full Reset (Wipe Everything)

```bash
# Stop the server (Ctrl+C)

# Recreate database
mysql -u root -p < backend/db/schema.sql

# Reseed data
cd backend
npm run seed

# Start again
npm start
```

### 6.2 Reset Data Only (Keep Schema)

```bash
cd backend
npm run seed
```

### 6.3 Clear Session Data

In browser console:
```javascript
localStorage.clear()
```

Or manually clear browser cookies/localStorage.

---

## 7. Troubleshooting

### 7.1 "Cannot find module 'X'"

```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### 7.2 Database Connection Errors

Check your `.env` credentials:
```bash
# Test MySQL connection
mysql -u neostore -p -h localhost -e "SHOW DATABASES;"
```

Common fixes:
- Ensure MySQL is running: `sudo systemctl start mysql`
- Verify DB_USER and DB_PASSWORD in `.env`
- Check DB_NAME exists: `CREATE DATABASE IF NOT EXISTS neostore_lab;`

### 7.3 Port Already in Use

```bash
# Kill process on port 4000
sudo kill -9 $(sudo lsof -t -i:4000)

# Or change PORT in .env
PORT=4001
```

### 7.4 Seed Fails

```bash
# Check MySQL is running
sudo systemctl status mysql

# Ensure database exists
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS neostore_lab;"

# Run seed with verbose output
node backend/db/seed.js
```

### 7.5 Frontend Not Loading

- Check browser console for errors (F12)
- Verify static files are being served
- Check `server.js` static path: `app.use(express.static(path.join(__dirname, '../frontend')))`
- Try: `http://localhost:4000/index.html`

### 7.6 Admin Dashboard Access Denied

- Verify you're logged in as admin or support
- Check user role in console: `Auth.getUser()`
- For testing, use seeded admin: `admin@neostore.test` / `Admin123!`

---

## 8. Testing Accounts

| Role | Email | Password |
|------|-------|----------|
| Customer | alice@example.com | Password123! |
| Customer | bob@example.com | Password123! |
| Customer | carol@example.com | Password123! |
| Support | support@neostore.test | Support123! |
| Admin | admin@neostore.test | Admin123! |

### Register New Accounts

Use the registration page to create additional accounts:
```
http://localhost:4000/register.html
```

New users are automatically assigned the `customer` role.

---

## 9. Next Steps

### 9.1 Explore the Application

1. Browse products on the homepage
2. Search and filter products
3. Add items to cart
4. Complete checkout
5. View order history
6. Update profile

### 9.2 Start Security Testing

1. Read `VULNERABILITIES.md` for the full vulnerability catalog
2. Work through the suggested exercise order:
   - BOLA/IDOR exploration
   - JWT forgery
   - Privilege escalation
   - Price manipulation
   - Business logic abuse
   - SQL injection (bonus)

### 9.3 Testing Tools

- **Browser DevTools** (F12): Network tab, Console, Application storage
- **Burp Suite** / **OWASP ZAP**: Intercept and modify requests
- **Postman** / **curl**: API testing
- **SQLMap**: Automated SQL injection (advanced)

### 9.4 Security Testing Tips

1. Always authenticate first (login)
2. Use Burp Suite to intercept and modify requests
3. Check for IDOR by incrementing IDs
4. Test mass assignment by adding unexpected fields
5. Try SQL injection in search fields
6. Manipulate price values in checkout
7. Test coupon stacking and replay attacks

---

## 10. Design System

The application uses a unified design system defined in:
- `frontend/css/tokens.css` - Design tokens (colors, spacing, typography)
- `frontend/css/main.css` - Global styles and components

### Key Design Tokens

```css
--color-primary: #0041c8
--color-surface: #f7f9fb
--color-error: #ba1a1a
--radius-md: 0.5rem
--font-family-display: 'Geist', sans-serif
--font-family-body: 'Inter', sans-serif
--font-family-mono: 'JetBrains Mono', monospace
```

### Components

All pages use:
- Unified navigation via `renderNav()` in `api.js`
- Consistent button styles: `.btn-primary`, `.btn-secondary`, `.btn-danger`
- Card components: `.card`, `.admin-card`
- Form inputs: `.input`
- Badges: `.badge-*` and `.status-badge-*`
- Toast notifications: `toast(message, type)`

---

## 11. Contributing & Customization

### Adding New Products

Edit `backend/db/seed.js` and add products to the `products` array:
```javascript
['SKU-XXX', 'Product Name', 'Description', 'Category', price, cost, stock, 'image_url']
```

### Adding New Pages

1. Create HTML file in `frontend/`
2. Include `api.js` and call `renderNav()`
3. Add route in `server.js`:
```javascript
app.get('/new-page.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'new-page.html'));
});
```

### Modifying Styles

1. Edit `frontend/css/main.css` for global styles
2. Use Tailwind classes for page-specific styles
3. Add custom styles in `<style>` tags if needed

---

## 12. License & Disclaimer

This project is for **educational and training purposes only**.

> ⚠️ **WARNING:** This application contains intentional security vulnerabilities. Do not deploy in production or expose to the internet. Use only in isolated environments for security training.

---

## 13. Support

For issues:
1. Check the troubleshooting section above
2. Review `VULNERABILITIES.md` for known issues
3. Check the server logs for errors
4. Open browser console (F12) for frontend errors

Happy Hacking! 🚀

