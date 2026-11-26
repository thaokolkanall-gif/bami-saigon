const express = require('express');
const bcrypt = require('bcryptjs');
const { db, syncWriteToCloud } = require('../db');
const { generateToken, authenticateToken, requireOwner } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rate-limit');

const router = express.Router();

// Admin Login (Protected by strict rate limiter)
router.post('/login', rateLimiter({ windowMs: 60000, max: 5, message: 'Đăng nhập sai quá nhiều lần. Vui lòng đợi 1 phút để thử lại.' }), (req, res) => {
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
  syncWriteToCloud('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

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

// Emergency Admin Password Recovery using Master Secret Key
router.post('/admin-recovery', rateLimiter({ windowMs: 60000, max: 5 }), (req, res) => {
  const { recovery_key, new_password } = req.body;

  if (!recovery_key || !new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'Vui lòng cung cấp Khóa khôi phục khẩn cấp và mật khẩu mới (tối thiểu 6 ký tự)' });
  }

  // Check against env or database settings
  const recSetting = db.prepare("SELECT value FROM settings WHERE key = 'admin_recovery_key'").get();
  const validKey = process.env.ADMIN_RECOVERY_KEY || recSetting?.value || 'BAMI_ADMIN_MASTER_KEY_2026';

  if (recovery_key.trim() !== validKey.trim()) {
    return res.status(403).json({ error: 'Khóa khôi phục khẩn cấp không chính xác!' });
  }

  const newHash = bcrypt.hashSync(new_password, 10);
  
  // Ensure admin user exists or update password
  const adminUser = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
  if (adminUser) {
    db.prepare("UPDATE users SET password_hash = ?, is_active = 1 WHERE username = 'admin'").run(newHash);
    syncWriteToCloud("UPDATE users SET password_hash = ?, is_active = 1 WHERE username = 'admin'", [newHash]);
  } else {
    db.prepare("INSERT INTO users (username, password_hash, full_name, role, is_active) VALUES ('admin', ?, 'Chủ Quán Bami', 'owner', 1)").run(newHash);
    syncWriteToCloud("INSERT INTO users (username, password_hash, full_name, role, is_active) VALUES ('admin', ?, 'Chủ Quán Bami', 'owner', 1)", [newHash]);
  }

  // Audit log
  db.prepare('INSERT INTO audit_logs (username, action, details) VALUES (?, ?, ?)')
    .run('Hệ thống', 'Khôi phục khẩn cấp mật khẩu Admin', 'Đặt lại mật khẩu Admin thành công qua Master Recovery Key');

  res.json({
    success: true,
    message: 'Khôi phục tài khoản Admin thành công! Bạn có thể dùng mật khẩu mới để đăng nhập ngay bây giờ.'
  });
});

module.exports = router;
