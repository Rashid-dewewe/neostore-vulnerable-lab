const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files - point to the frontend folder (one level up)
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/checkout', require('./routes/checkout'));
app.use('/api/admin', require('./routes/admin'));

// Serve HTML files from frontend folder
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'login.html'));
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'register.html'));
});

app.get('/forgot-password.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'forgot-password.html'));
});

app.get('/cart.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'cart.html'));
});

app.get('/checkout.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'checkout.html'));
});

app.get('/orders.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'orders.html'));
});

app.get('/profile.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'profile.html'));
});

app.get('/product.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'product.html'));
});

app.get('/admin/dashboard.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin/dashboard.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Resource not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(` NeoStore Vulnerable Lab running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});