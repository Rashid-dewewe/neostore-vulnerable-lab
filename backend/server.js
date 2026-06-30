const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Route Imports
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

const app = express();

// --- ADVANCED FEATURE ENHANCEMENTS ---

// 1. Strict CORS Guard configuration instead of wild-card assignment
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://127.0.0.1:4000'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Blocked by Security Policy: Cross-Origin Resource Sharing Violation.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-debug-role', 'Cookie']
}));

app.use(express.json());
app.use(cookieParser());

// 2. Custom Advanced Telemetry Hook for Traffic Diagnostics
morgan.token('client-role', (req) => req.headers['x-debug-role'] || 'standard-user');
app.use(morgan(':remote-addr - [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] - Role Context: [:client-role] (Engine Response: :response-time ms)'));

// --- API LAYER MAPPINGS ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ 
  status: 'ok', 
  lab: 'NeoStore Vulnerable E-Commerce',
  timestamp: new Date(),
  environment: process.env.NODE_ENV || 'development'
}));

// 3. Fallback Route Mapping for Single Page Integrity or Query Sanitation
// Serves static client folder assets securely
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Global Error Interceptor for Unhandled Exception Handling
app.use((err, req, res, next) => {
  console.error(`[Engine Core Exception Error]: ${err.stack}`);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Internal Threat Mitigation / Server Processing Interruption Event.'
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\x1b[32m[Core Initialized]\x1b[0m Security Lab Engine online and listening on network interface port: ${PORT}`);
});