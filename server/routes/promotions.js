const express = require('express');
const jwt = require('jsonwebtoken');
const { db, syncWriteToCloud } = require('../db');
const { JWT_SECRET, authenticateToken, requireOwner, authenticateCustomer } = require('../middleware/auth');

const router = express.Router();

// Public / Customer: Validate a promotion code for an order subtotal
router.post('/validate', (req, res) => {
  const { code, subtotal, customer_id } = req.body;
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
    return res.status(400).json({ error: 'Chương trình ưu đãi đã kết thúc theo thời hạn quy định' });
  }

  if (promo.max_uses && promo.used_count >= promo.max_uses) {
    return res.status(400).json({ error: 'Mã ưu đãi đã hết tổng số lượt sử dụng' });
  }

  // Check 1-time-per-customer rule
  const customerId = customer_id || req.body.customerId;
  if (customerId) {
    const usedClaim = db.prepare("SELECT id FROM customer_promotions WHERE customer_id = ? AND promotion_id = ? AND status = 'used'").get(customerId, promo.id);
    const orderUsed = db.prepare("SELECT id FROM orders WHERE customer_id = ? AND UPPER(promo_code) = UPPER(?) AND status != 'cancelled'").get(customerId, promo.code);
    if (usedClaim || orderUsed) {
      return res.status(400).json({ error: 'Bạn đã sử dụng mã voucher này rồi. Mỗi khách hàng chỉ được dùng 1 lần duy nhất.' });
    }
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
    discount_value: promo.discount_value,
    end_date: promo.end_date
  });
});

// Customer: Claim a voucher into personal wallet (Only 1 time per customer rule)
router.post('/claim', authenticateCustomer, (req, res) => {
  try {
    const { promo_id, code } = req.body;
    const customerId = req.customer.id;

    let promo = null;
    if (promo_id) {
      promo = db.prepare('SELECT * FROM promotions WHERE id = ? AND is_active = 1').get(promo_id);
    } else if (code) {
      promo = db.prepare('SELECT * FROM promotions WHERE UPPER(code) = UPPER(?) AND is_active = 1').get(code.trim());
    }

    if (!promo) {
      return res.status(404).json({ error: 'Mã voucher không tồn tại hoặc đã hết hiệu lực' });
    }

    const now = new Date();
    if (promo.end_date && new Date(promo.end_date) < now) {
      return res.status(400).json({ error: 'Voucher này đã hết hạn sử dụng theo thời gian quy định' });
    }

    // Check if customer already claimed / used
    const existing = db.prepare("SELECT * FROM customer_promotions WHERE customer_id = ? AND promotion_id = ?").get(customerId, promo.id);
    if (existing) {
      if (existing.status === 'used') {
        return res.status(400).json({ error: 'Bạn đã sử dụng voucher này rồi. Mỗi khách hàng chỉ được nhận và dùng 1 lần duy nhất.' });
      }
      return res.json({ 
        success: true, 
        status: 'claimed',
        message: 'Voucher đã có trong tài khoản của bạn và đang chờ bạn sử dụng!' 
      });
    }

    // Also check if customer used this voucher in prior completed order
    const orderUsed = db.prepare("SELECT id FROM orders WHERE customer_id = ? AND UPPER(promo_code) = UPPER(?) AND status != 'cancelled'").get(customerId, promo.code);
    if (orderUsed) {
      return res.status(400).json({ error: 'Bạn đã từng sử dụng mã ưu đãi này rồi. Mỗi khách hàng chỉ được dùng 1 lần duy nhất.' });
    }

    // Check overall max uses
    if (promo.max_uses && promo.used_count >= promo.max_uses) {
      return res.status(400).json({ error: 'Mã ưu đãi đã hết tổng số lượt phát' });
    }

    // Insert into customer_promotions
    db.prepare(`
      INSERT INTO customer_promotions (customer_id, promotion_id, code, status)
      VALUES (?, ?, ?, 'claimed')
    `).run(customerId, promo.id, promo.code);

    syncWriteToCloud(
      'INSERT INTO customer_promotions (customer_id, promotion_id, code, status) VALUES (?, ?, ?, ?)',
      [customerId, promo.id, promo.code, 'claimed']
    );

    res.json({ 
      success: true, 
      status: 'claimed',
      message: 'Nhận voucher thành công! Voucher đang chờ bạn sử dụng.' 
    });
  } catch (err) {
    console.error('Error claiming promotion:', err);
    res.status(500).json({ error: 'Lỗi khi lưu voucher vào tài khoản: ' + err.message });
  }
});

// Get promotions:
// - If Admin/Staff token: return all promotions for admin management
// - If Public / Customer: return active promotions with personal claim status (chờ sử dụng / đã nhận / đã dùng)
router.get('/', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  let adminUser = null;
  let customerUser = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded && (decoded.role === 'owner' || decoded.role === 'staff' || decoded.role === 'admin')) {
        adminUser = decoded;
      } else if (decoded && decoded.type === 'customer') {
        customerUser = decoded;
      }
    } catch (e) {
      // invalid token, treat as guest
    }
  }

  // Admin view
  if (adminUser) {
    const promos = db.prepare('SELECT * FROM promotions ORDER BY id DESC').all();
    return res.json(promos);
  }

  // Public / Customer view
  const promos = db.prepare('SELECT * FROM promotions WHERE is_active = 1 ORDER BY id DESC').all();

  if (customerUser) {
    const claims = db.prepare('SELECT promotion_id, status FROM customer_promotions WHERE customer_id = ?').all(customerUser.id);
    const claimMap = new Map();
    claims.forEach(c => claimMap.set(c.promotion_id, c.status));

    const ordersUsed = db.prepare("SELECT promo_code FROM orders WHERE customer_id = ? AND status != 'cancelled'").all(customerUser.id);
    const usedCodes = new Set(ordersUsed.map(o => (o.promo_code || '').toUpperCase()));

    const enriched = promos.map(p => {
      const claimStatus = claimMap.get(p.id);
      const isUsedInOrders = usedCodes.has(p.code.toUpperCase());

      let status = 'not_claimed';
      if (claimStatus === 'used' || isUsedInOrders) {
        status = 'used';
      } else if (claimStatus === 'claimed') {
        status = 'claimed';
      }

      return {
        ...p,
        claim_status: status,
        is_claimed: status === 'claimed',
        is_used: status === 'used'
      };
    });

    return res.json(enriched);
  }

  // Guest view
  const guestPromos = promos.map(p => ({
    ...p,
    claim_status: 'not_claimed',
    is_claimed: false,
    is_used: false
  }));

  res.json(guestPromos);
});

// Admin: Create promotion
router.post('/', authenticateToken, requireOwner, (req, res) => {
  const { code, title, discount_type, discount_value, min_order_value, max_discount, max_uses, start_date, end_date, once_per_customer } = req.body;
  if (!code || !title || discount_value === undefined) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ mã, tiêu đề và mức giảm giá' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO promotions (code, title, discount_type, discount_value, min_order_value, max_discount, max_uses, start_date, end_date, once_per_customer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      code.trim().toUpperCase(),
      title,
      discount_type || 'percent',
      parseInt(discount_value) || 0,
      parseInt(min_order_value) || 0,
      max_discount ? parseInt(max_discount) : null,
      parseInt(max_uses) || 100,
      start_date || null,
      end_date || null,
      once_per_customer !== undefined ? (once_per_customer ? 1 : 0) : 1
    );

    syncWriteToCloud(`
      INSERT INTO promotions (code, title, discount_type, discount_value, min_order_value, max_discount, max_uses, start_date, end_date, once_per_customer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      code.trim().toUpperCase(),
      title,
      discount_type || 'percent',
      parseInt(discount_value) || 0,
      parseInt(min_order_value) || 0,
      max_discount ? parseInt(max_discount) : null,
      parseInt(max_uses) || 100,
      start_date || null,
      end_date || null,
      once_per_customer !== undefined ? (once_per_customer ? 1 : 0) : 1
    ]);

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
  const { code, title, discount_type, discount_value, min_order_value, max_discount, max_uses, start_date, end_date, is_active, once_per_customer } = req.body;

  db.prepare(`
    UPDATE promotions 
    SET code = ?, title = ?, discount_type = ?, discount_value = ?, min_order_value = ?,
        max_discount = ?, max_uses = ?, start_date = ?, end_date = ?, is_active = ?, once_per_customer = ?
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
    is_active !== undefined ? (is_active ? 1 : 0) : 1,
    once_per_customer !== undefined ? (once_per_customer ? 1 : 0) : 1,
    id
  );

  syncWriteToCloud(`
    UPDATE promotions 
    SET code = ?, title = ?, discount_type = ?, discount_value = ?, min_order_value = ?,
        max_discount = ?, max_uses = ?, start_date = ?, end_date = ?, is_active = ?, once_per_customer = ?
    WHERE id = ?
  `, [
    code.trim().toUpperCase(),
    title,
    discount_type,
    parseInt(discount_value) || 0,
    parseInt(min_order_value) || 0,
    max_discount ? parseInt(max_discount) : null,
    parseInt(max_uses) || 100,
    start_date || null,
    end_date || null,
    is_active !== undefined ? (is_active ? 1 : 0) : 1,
    once_per_customer !== undefined ? (once_per_customer ? 1 : 0) : 1,
    id
  ]);

  res.json({ success: true });
});

// Admin: Delete promotion
router.delete('/:id', authenticateToken, requireOwner, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM promotions WHERE id = ?').run(id);
  syncWriteToCloud('DELETE FROM promotions WHERE id = ?', [id]);
  res.json({ success: true });
});

module.exports = router;
