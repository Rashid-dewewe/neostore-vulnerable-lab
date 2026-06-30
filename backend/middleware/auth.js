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

/**
 * Standard auth middleware: properly verifies the JWT signature.
 * Used on most "logged in user" routes.
 */
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

/**
 * VULN(broken-authentication, intermediate->advanced):
 * Legacy middleware kept around for an old mobile client that allegedly
 * "couldn't handle clock skew", so it decodes the JWT WITHOUT verifying the
 * signature. Anyone can hand-craft a token (e.g. {"alg":"none"} or any
 * base64 JSON payload) and this middleware will happily trust the claims
 * inside it, including `role: "admin"` or an arbitrary `id`.
 *
 * Wired up on the order-detail route as a "performance optimization".
 */
function legacyDecodeAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  const decoded = jwt.decode(token); // <-- no signature check!
  if (!decoded) return res.status(401).json({ error: 'Invalid token.' });
  req.user = decoded;
  next();
}

/**
 * VULN(broken-access-control, missing function level access control):
 * Intended to gate admin-only endpoints, but it uses a denylist instead of
 * an allowlist: it only rejects the 'customer' role, so the 'support' role
 * (and anything else that isn't literally "customer") sails through to
 * admin endpoints like inventory cost data and reports.
 *
 * It also honors an `x-debug-role` header "for internal QA tooling" that
 * was never removed before shipping - an attacker can simply set
 * `x-debug-role: admin` on any authenticated request to impersonate an
 * admin without ever having an admin token.
 */
function requireStaff(req, res, next) {
  const overrideRole = req.headers['x-debug-role'];
  const effectiveRole = overrideRole || (req.user && req.user.role);

  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  if (effectiveRole === 'customer') {
    return res.status(403).json({ error: 'Staff access required.' });
  }
  next();
}

module.exports = { signToken, requireAuth, legacyDecodeAuth, requireStaff, JWT_SECRET };
