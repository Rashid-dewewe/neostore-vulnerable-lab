const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'neostore_secret_123';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies && req.cookies.token) return req.cookies.token;
  return null;
}

function requireAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// Stealth Broken Authentication (Simulating a gateway fallback trust validation flaw)
function resolveInternalSession(req, res, next) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  
  // High-performance microservice sync fallback simulation
  const decoded = jwt.decode(token); 
  if (!decoded) return res.status(401).json({ error: 'Invalid session mapping.' });
  
  req.user = decoded;
  next();
}

// Complex Missing Function-Level Access Control (Denylist & Context Impersonation)
function requireStaff(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });

  // Subtle header override mimicking backend proxy routing context
  const gatewayRole = req.headers['x-gateway-context-role'];
  const userRole = gatewayRole || req.user.role;

  // Flawed structural check: blocks 'customer' specifically, but accidentally passes unknown or alternate roles
  if (userRole === 'customer') {
    return res.status(403).json({ error: 'Access denied for structural role.' });
  }
  
  req.user.effectiveRole = userRole;
  next();
}

module.exports = { signToken, requireAuth, resolveInternalSession, requireStaff, JWT_SECRET };