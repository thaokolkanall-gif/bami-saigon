const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { db } = require('../db');
const { generateCustomerToken, authenticateCustomer, authenticateToken, requireOwner } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rate-limit');

const router = express.Router();

// 1. Customer Register
router.post('/register', rateLimiter({ windowMs: 60000, max: 10 }), (req, res) => {
  const { phone, password, full_name, email, default_address, default_address_note } = req.body;

  if (!phone || !phone.trim() || !password || password.length < 6 || !full_name || !full_name.trim()) {
    return res.status(400).json({ error: 'Vui lòng cung cấp số điện thoại, họ tên và mật khẩu (tối thiểu 6 ký tự)' });
  }

  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : null;

  // Check existing phone
  const existingPhone = db.prepare('SELECT id FROM customers WHERE phone = ?').get(cleanPhone);
  if (existingPhone) {
    return res.status(400).json({ error: 'Số điện thoại này đã được đăng ký. Vui lòng đăng nhập hoặc dùng số khác.' });
  }

  if (cleanEmail) {
    const existingEmail = db.prepare('SELECT id FROM customers WHERE email = ?').get(cleanEmail);
    if (existingEmail) {
      return res.status(400).json({ error: 'Địa chỉ email này đã được sử dụng.' });
    }
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO customers (phone, email, full_name, password_hash, default_address, default_address_note, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(cleanPhone, cleanEmail, full_name.trim(), passwordHash, default_address || null, default_address_note || null);

  const newCustomer = {
    id: result.lastInsertRowid,
    phone: cleanPhone,
    email: cleanEmail,
    full_name: full_name.trim(),
    default_address: default_address || '',
    default_address_note: default_address_note || ''
  };

  const token = generateCustomerToken(newCustomer);
  res.json({
    success: true,
    token,
    customer: newCustomer,
    message: 'Đăng ký tài khoản thành viên thành công!'
  });
});

// 2. Customer Login
router.post('/login', rateLimiter({ windowMs: 60000, max: 15 }), (req, res) => {
  const { identifier, password } = req.body; // identifier can be phone or email

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập số điện thoại (hoặc email) và mật khẩu' });
  }

  const cleanId = identifier.trim().toLowerCase();
  const customer = db.prepare(`
    SELECT * FROM customers 
    WHERE (phone = ? OR LOWER(email) = ?)
  `).get(cleanId, cleanId);

  if (!customer) {
    return res.status(401).json({ error: 'Tài khoản không tồn tại trên hệ thống' });
  }

  if (!customer.is_active) {
    return res.status(403).json({ error: 'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ hotline quán để được hỗ trợ.' });
  }

  if (!bcrypt.compareSync(password, customer.password_hash)) {
    return res.status(401).json({ error: 'Mật khẩu không chính xác' });
  }

  const token = generateCustomerToken(customer);
  res.json({
    success: true,
    token,
    customer: {
      id: customer.id,
      phone: customer.phone,
      email: customer.email,
      full_name: customer.full_name,
      default_address: customer.default_address || '',
      default_address_note: customer.default_address_note || ''
    }
  });
});

// 3. Customer Profile & Order History
router.get('/me', authenticateCustomer, (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const customer = db.prepare('SELECT id, phone, email, full_name, default_address, default_address_note, is_active, created_at FROM customers WHERE id = ?').get(req.customer.id);
  if (!customer || !customer.is_active) {
    return res.status(401).json({ error: 'Tài khoản không tồn tại hoặc đã bị khóa' });
  }

  // Get order history (match by customer_id or phone number)
  const cleanPhone = (customer.phone || '').replace(/\s+/g, '');
  const orders = db.prepare(`
    SELECT id, order_code, tracking_token, order_type, total_amount, status, payment_status, payment_method, is_prepaid, created_at
    FROM orders
    WHERE customer_id = ? OR REPLACE(customer_phone, ' ', '') = ?
    ORDER BY id DESC
    LIMIT 50
  `).all(customer.id, cleanPhone);

  res.json({
    customer,
    orders
  });
});

// 4. Update Profile
router.put('/profile', authenticateCustomer, (req, res) => {
  const { full_name, email, default_address, default_address_note } = req.body;

  if (!full_name || !full_name.trim()) {
    return res.status(400).json({ error: 'Họ tên không được để trống' });
  }

  const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : null;

  if (cleanEmail) {
    const existing = db.prepare('SELECT id FROM customers WHERE email = ? AND id != ?').get(cleanEmail, req.customer.id);
    if (existing) {
      return res.status(400).json({ error: 'Email này đã thuộc về tài khoản khác' });
    }
  }

  db.prepare(`
    UPDATE customers 
    SET full_name = ?, email = ?, default_address = ?, default_address_note = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(full_name.trim(), cleanEmail, default_address || null, default_address_note || null, req.customer.id);

  res.json({
    success: true,
    message: 'Cập nhật thông tin thành công',
    customer: {
      id: req.customer.id,
      phone: req.customer.phone,
      email: cleanEmail,
      full_name: full_name.trim(),
      default_address: default_address || '',
      default_address_note: default_address_note || ''
    }
  });
});

// 5. Change Password (Logged in)
router.post('/change-password', authenticateCustomer, (req, res) => {
  const { old_password, new_password } = req.body;
  if (!old_password || !new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
  }

  const customer = db.prepare('SELECT password_hash FROM customers WHERE id = ?').get(req.customer.id);
  if (!bcrypt.compareSync(old_password, customer.password_hash)) {
    return res.status(400).json({ error: 'Mật khẩu hiện tại không chính xác' });
  }

  const newHash = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE customers SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, req.customer.id);

  res.json({ success: true, message: 'Đổi mật khẩu thành công' });
});

// 6. Request Forgot Password Token
router.post('/forgot-password', rateLimiter({ windowMs: 60000, max: 5 }), (req, res) => {
  const { phone_or_email } = req.body;
  if (!phone_or_email || !phone_or_email.trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập số điện thoại hoặc email đã đăng ký' });
  }

  const clean = phone_or_email.trim().toLowerCase();
  const customer = db.prepare('SELECT id, phone, email, full_name FROM customers WHERE phone = ? OR LOWER(email) = ?').get(clean, clean);

  if (!customer) {
    return res.status(404).json({ error: 'Không tìm thấy tài khoản với số điện thoại hoặc email này' });
  }

  // Generate 6-digit recovery code & secure reset token
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const resetToken = crypto.randomBytes(24).toString('hex');
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

  db.prepare('UPDATE customers SET reset_token = ?, reset_token_expires = ? WHERE id = ?').run(resetToken, expires, customer.id);

  // Return reset info (In production, if email service connected, would send email. Here we provide reset link / token)
  res.json({
    success: true,
    message: 'Yêu cầu khôi phục mật khẩu đã được tiếp nhận.',
    reset_token: resetToken,
    customer_phone: customer.phone,
    note: 'Quý khách có thể sử dụng mã khôi phục để đặt lại mật khẩu hoặc liên hệ Hotline quán để được hỗ trợ ngay lập tức.'
  });
});

// 7. Reset Password with Token
router.post('/reset-password', (req, res) => {
  const { reset_token, new_password } = req.body;
  if (!reset_token || !new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
  }

  const customer = db.prepare('SELECT id, reset_token_expires FROM customers WHERE reset_token = ?').get(reset_token);
  if (!customer) {
    return res.status(400).json({ error: 'Mã khôi phục không hợp lệ hoặc đã được sử dụng' });
  }

  if (new Date(customer.reset_token_expires) < new Date()) {
    return res.status(400).json({ error: 'Mã khôi phục đã hết hạn. Vui lòng tạo yêu cầu mới.' });
  }

  const newHash = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE customers SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, customer.id);

  res.json({ success: true, message: 'Đặt lại mật khẩu thành công. Quý khách có thể đăng nhập ngay bây giờ.' });
});

// ==========================================
// ADMIN ENDPOINTS: Manage Customers
// ==========================================

// 8. Admin List All Customers (Owner/Staff)
router.get('/admin/list', authenticateToken, (req, res) => {
  const search = req.query.search ? `%${req.query.search.trim()}%` : null;

  let query = `
    SELECT 
      c.id, c.phone, c.email, c.full_name, c.default_address, c.is_active, c.created_at,
      COUNT(o.id) as total_orders,
      COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total_amount ELSE 0 END), 0) as total_spent,
      MAX(o.created_at) as last_order_date
    FROM customers c
    LEFT JOIN orders o ON (o.customer_id = c.id OR o.customer_phone = c.phone)
  `;

  let params = [];
  if (search) {
    query += ` WHERE c.phone LIKE ? OR c.full_name LIKE ? OR c.email LIKE ?`;
    params.push(search, search, search);
  }

  query += ` GROUP BY c.id ORDER BY c.id DESC`;

  const customers = db.prepare(query).all(...params);
  res.json(customers);
});

// 9. Admin Toggle Customer Status (Lock / Unlock)
router.put('/admin/:id/status', authenticateToken, requireOwner, (req, res) => {
  const customerId = req.params.id;
  const { is_active } = req.body;

  db.prepare('UPDATE customers SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(is_active ? 1 : 0, customerId);

  // Log audit
  db.prepare('INSERT INTO audit_logs (username, action, details) VALUES (?, ?, ?)')
    .run(req.user.username, is_active ? 'Mở khóa khách hàng' : 'Khóa tài khoản khách hàng', `Customer ID: ${customerId}`);

  res.json({ success: true, message: is_active ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản khách hàng' });
});

// 10. Admin Reset Customer Password Directly
router.post('/admin/:id/reset-password', authenticateToken, requireOwner, (req, res) => {
  const customerId = req.params.id;
  const newPassword = req.body.new_password || 'bami123';

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE customers SET password_hash = ?, reset_token = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hash, customerId);

  // Log audit
  db.prepare('INSERT INTO audit_logs (username, action, details) VALUES (?, ?, ?)')
    .run(req.user.username, 'Đặt lại mật khẩu khách hàng', `Customer ID: ${customerId}, Mật khẩu mới: ${newPassword}`);

  res.json({
    success: true,
    message: `Đã đặt lại mật khẩu cho khách hàng thành: "${newPassword}"`,
    new_password: newPassword
  });
});

module.exports = router;
