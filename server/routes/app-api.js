const express = require('express');
const { db } = require('../db');
const { generateToken, authenticateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

/**
 * Mobile App API v1
 * Dành riêng cho ứng dụng di động quản lý của chủ quán & nhân viên trong tương lai
 */

// 1. Mobile App Login
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Thiếu tên đăng nhập hoặc mật khẩu' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ success: false, error: 'Sai tài khoản hoặc mật khẩu' });
  }

  const token = generateToken(user);
  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role
      }
    }
  });
});

// 2. Mobile App Get Orders
router.get('/orders', authenticateToken, (req, res) => {
  const { status, limit = 20, page = 1 } = req.query;
  let query = 'SELECT * FROM orders WHERE 1=1';
  const params = [];

  if (status && status !== 'all') {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  params.push(parseInt(limit), offset);

  const orders = db.prepare(query).all(...params);
  res.json({ success: true, data: orders });
});

// 3. Mobile App Order Detail
router.get('/orders/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return res.status(404).json({ success: false, error: 'Không tìm thấy đơn hàng' });

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
  const history = db.prepare('SELECT * FROM order_history WHERE order_id = ? ORDER BY id ASC').all(id);

  res.json({ success: true, data: { order, items, history } });
});

// 4. Mobile App Update Order Status
router.put('/orders/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  const validStatuses = ['new', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Trạng thái không hợp lệ' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return res.status(404).json({ success: false, error: 'Không tìm thấy đơn hàng' });

  db.transaction(() => {
    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
    db.prepare(`
      INSERT INTO order_history (order_id, from_status, to_status, note, updated_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, order.status, status, note || `Cập nhật từ App di động sang: ${status}`, req.user.full_name || 'App Di Động');
  })();

  res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
});

// 5. Mobile App Stats Overview
router.get('/stats', authenticateToken, (req, res) => {
  const stats = db.prepare(`
    SELECT 
      SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as count_new,
      SUM(CASE WHEN status = 'confirmed' OR status = 'preparing' THEN 1 ELSE 0 END) as count_preparing,
      SUM(CASE WHEN status = 'delivering' THEN 1 ELSE 0 END) as count_delivering,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as count_completed,
      SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as revenue_completed
    FROM orders
  `).get();

  res.json({ success: true, data: stats });
});

// 6. Mobile Push Notification Token Registration (Ready for FCM / APNS integration)
router.post('/push/register', authenticateToken, (req, res) => {
  const { device_token, platform } = req.body;
  // Prepared for push token saving
  res.json({
    success: true,
    message: 'Đã sẵn sàng nhận Push Token khi app di động được kích hoạt trên thiết bị.',
    registered_at: new Date()
  });
});

module.exports = router;
