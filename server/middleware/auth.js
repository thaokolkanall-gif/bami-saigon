const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bami-saigon-secret-key-2026';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Vui lòng đăng nhập để tiếp tục' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ' });
    }
    req.user = user;
    next();
  });
}

function requireOwner(req, res, next) {
  if (!req.user || req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Chỉ Chủ Quán mới có quyền thực hiện thao tác này' });
  }
  next();
}

// Customer Auth Helpers
function generateCustomerToken(customer) {
  return jwt.sign(
    { id: customer.id, phone: customer.phone, email: customer.email, full_name: customer.full_name, type: 'customer' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function authenticateCustomer(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Vui lòng đăng nhập tài khoản khách hàng' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || decoded.type !== 'customer') {
      return res.status(403).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' });
    }
    req.customer = decoded;
    next();
  });
}

// Optional Customer Auth: sets req.customer if valid token provided, but doesn't block if not
function optionalCustomer(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (!err && decoded.type === 'customer') {
        req.customer = decoded;
      }
      next();
    });
  } else {
    next();
  }
}

module.exports = {
  JWT_SECRET,
  generateToken,
  authenticateToken,
  requireOwner,
  generateCustomerToken,
  authenticateCustomer,
  optionalCustomer
};
