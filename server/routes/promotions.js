const express = require('express');
const { db } = require('../db');
const { authenticateToken, requireOwner } = require('../middleware/auth');

const router = express.Router();

// Public: Validate a promotion code for an order subtotal
router.post('/validate', (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Vui lòng nhập mã giảm giá' });
  }

  const promo = db.prepare('SELECT * FROM promotions WHERE UPPER(code) = UPPER(?) AND is_active = 1').get(code.trim());

  if (!promo) {
    return res.status(400).json({ error: 'Mã ưu đãi không tồn tại hoặc đã hết hiệu lực' });
  }

  const now = new Date();
  if (promo.start_date && new Date(promo.start_date) > now) {
    return res.status(400).json({ error: 'Chương trình ưu đãi chưa bắt đầu' });
  }

  if (promo.end_date && new Date(promo.end_date) < now) {
    return res.status(400).json({ error: 'Chương trình ưu đãi đã kết thúc' });
  }

  if (promo.max_uses && promo.used_count >= promo.max_uses) {
    return res.status(400).json({ error: 'Mã ưu đãi đã hết lượt sử dụng' });
  }

  const orderSubtotal = parseInt(subtotal) || 0;
  if (promo.min_order_value && orderSubtotal < promo.min_order_value) {
    return res.status(400).json({
      error: `Đơn hàng tối thiểu ${promo.min_order_value.toLocaleString('vi-VN')}đ để áp dụng mã này`
    });
  }

  // Calculate discount amount
  let discount = 0;
  if (promo.discount_type === 'percent') {
    discount = Math.round((orderSubtotal * promo.discount_value) / 100);
    if (promo.max_discount && discount > promo.max_discount) {
      discount = promo.max_discount;
    }
  } else {
    discount = promo.discount_value;
  }

  // Discount cannot exceed subtotal
  discount = Math.min(discount, orderSubtotal);

  res.json({
    valid: true,
    code: promo.code,
    title: promo.title,
    discount_amount: discount,
    discount_type: promo.discount_type,
    discount_value: promo.discount_value
  });
});

// Get promotions:
// - If Admin/Staff token: return all promotions for admin management
// - If Public / Customer: return active promotions
router.get('/', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const { JWT_SECRET } = require('../middleware/auth');
    const jwt = require('jsonwebtoken');
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded && (decoded.role === 'owner' || decoded.role === 'staff' || decoded.role === 'admin')) {
        const promos = db.prepare('SELECT * FROM promotions ORDER BY id DESC').all();
        return res.json(promos);
      }
    } catch (e) {
      // not admin or invalid token, fall through to public active promos
    }
  }

  // Public: return active promotions
  const promos = db.prepare('SELECT * FROM promotions WHERE is_active = 1 ORDER BY id DESC').all();
  res.json(promos);
});

// Admin: Create promotion
router.post('/', authenticateToken, requireOwner, (req, res) => {
  const { code, title, discount_type, discount_value, min_order_value, max_discount, max_uses, start_date, end_date } = req.body;
  if (!code || !title || discount_value === undefined) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ mã, tiêu đề và mức giảm giá' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO promotions (code, title, discount_type, discount_value, min_order_value, max_discount, max_uses, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      code.trim().toUpperCase(),
      title,
      discount_type || 'percent',
      parseInt(discount_value) || 0,
      parseInt(min_order_value) || 0,
      max_discount ? parseInt(max_discount) : null,
      parseInt(max_uses) || 100,
      start_date || null,
      end_date || null
    );

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Mã ưu đãi này đã tồn tại' });
    }
    res.status(500).json({ error: 'Lỗi khi lưu mã ưu đãi' });
  }
});

// Admin: Update promotion
router.put('/:id', authenticateToken, requireOwner, (req, res) => {
  const { id } = req.params;
  const { code, title, discount_type, discount_value, min_order_value, max_discount, max_uses, start_date, end_date, is_active } = req.body;

  db.prepare(`
    UPDATE promotions 
    SET code = ?, title = ?, discount_type = ?, discount_value = ?, min_order_value = ?,
        max_discount = ?, max_uses = ?, start_date = ?, end_date = ?, is_active = ?
    WHERE id = ?
  `).run(
    code.trim().toUpperCase(),
    title,
    discount_type,
    parseInt(discount_value) || 0,
    parseInt(min_order_value) || 0,
    max_discount ? parseInt(max_discount) : null,
    parseInt(max_uses) || 100,
    start_date || null,
    end_date || null,
    is_active ? 1 : 0,
    id
  );

  res.json({ success: true });
});

// Admin: Delete promotion
router.delete('/:id', authenticateToken, requireOwner, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM promotions WHERE id = ?').run(id);
  res.json({ success: true });
});

module.exports = router;
