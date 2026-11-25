const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { generateToken, authenticateToken, requireOwner } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rate-limit');

const router = express.Router();

// Admin Login
router.post('/login', rateLimiter({ windowMs: 60000, max: 10, message: 'Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 1 phút.' }), (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role
    }
  });
});

// Check current user session
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, username, full_name, role, is_active, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user || !user.is_active) {
    return res.status(401).json({ error: 'Tài khoản không tồn tại hoặc đã bị khóa' });
  }
  res.json(user);
});

// Change password
router.post('/change-password', authenticateToken, (req, res) => {
  const { old_password, new_password } = req.body;
  if (!old_password || !new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(old_password, user.password_hash)) {
    return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
  }

  const newHash = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);

  res.json({ success: true, message: 'Đổi mật khẩu thành công' });
});

// Staff Management (Owner only)
router.get('/staff', authenticateToken, requireOwner, (req, res) => {
  const staffList = db.prepare('SELECT id, username, full_name, role, is_active, created_at FROM users ORDER BY id ASC').all();
  res.json(staffList);
});

router.post('/staff', authenticateToken, requireOwner, (req, res) => {
  const { username, password, full_name, role } = req.body;
  if (!username || !password || !full_name) {
    return res.status(400).json({ error: 'Vui lòng điền đủ thông tin nhân viên' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: 'Tên đăng nhập này đã được sử dụng' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)').run(
    username,
    hash,
    full_name,
    role === 'owner' ? 'owner' : 'staff'
  );

  res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/staff/:id/status', authenticateToken, requireOwner, (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'Không thể tự khóa tài khoản của chính mình' });
  }

  db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(is_active ? 1 : 0, id);
  res.json({ success: true });
});

module.exports = router;
