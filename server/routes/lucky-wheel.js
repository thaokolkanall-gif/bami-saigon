const express = require('express');
const { db, syncWriteToCloud } = require('../db');
const { authenticateToken, requireOwner, authenticateCustomer } = require('../middleware/auth');

const router = express.Router();

// 1. PUBLIC: Get active Lucky Wheel slices (probabilities omitted for privacy & anti-cheat)
router.get('/rewards', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const enabledSetting = db.prepare("SELECT value FROM settings WHERE key = 'lucky_wheel_enabled'").get();
  const ruleSetting = db.prepare("SELECT value FROM settings WHERE key = 'lucky_wheel_rule'").get();

  const isEnabled = enabledSetting?.value !== '0';
  const rule = ruleSetting?.value || 'daily';

  const rewards = db.prepare(`
    SELECT id, label, reward_type, color, text_color, display_order 
    FROM lucky_wheel_rewards 
    WHERE is_active = 1 
    ORDER BY display_order ASC, id ASC
  `).all();

  res.json({
    enabled: isEnabled,
    rule,
    rewards
  });
});

// 2. CUSTOMER: Check current spin status (turns left)
router.get('/status', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  const enabledSetting = db.prepare("SELECT value FROM settings WHERE key = 'lucky_wheel_enabled'").get();
  const ruleSetting = db.prepare("SELECT value FROM settings WHERE key = 'lucky_wheel_rule'").get();
  const isEnabled = enabledSetting?.value !== '0';
  const rule = ruleSetting?.value || 'daily';

  if (!token) {
    return res.json({
      enabled: isEnabled,
      rule,
      is_logged_in: false,
      can_spin: false,
      spins_left: 0,
      message: 'Vui lòng đăng nhập để nhận lượt quay may mắn miễn phí'
    });
  }

  // Verify customer
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'bami_saigon_jwt_secret_key_2026';
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.json({ enabled: isEnabled, is_logged_in: false, can_spin: false, spins_left: 0 });
    }

    const customerId = decoded.id;
    let spinsCount = 0;

    if (rule === 'daily') {
      const todayRow = db.prepare(`
        SELECT count(*) as count 
        FROM lucky_wheel_spins 
        WHERE customer_id = ? AND date(created_at, 'localtime') = date('now', 'localtime')
      `).get(customerId);
      spinsCount = todayRow?.count || 0;
    } else {
      const allRow = db.prepare(`
        SELECT count(*) as count 
        FROM lucky_wheel_spins 
        WHERE customer_id = ?
      `).get(customerId);
      spinsCount = allRow?.count || 0;
    }

    const canSpin = isEnabled && spinsCount === 0;

    res.json({
      enabled: isEnabled,
      rule,
      is_logged_in: true,
      can_spin: canSpin,
      spins_left: canSpin ? 1 : 0,
      today_spins: spinsCount
    });
  } catch (err) {
    return res.json({ enabled: isEnabled, is_logged_in: false, can_spin: false, spins_left: 0 });
  }
});

// 3. CUSTOMER: Spin the Lucky Wheel
router.post('/spin', authenticateCustomer, (req, res) => {
  const enabledSetting = db.prepare("SELECT value FROM settings WHERE key = 'lucky_wheel_enabled'").get();
  const ruleSetting = db.prepare("SELECT value FROM settings WHERE key = 'lucky_wheel_rule'").get();

  if (enabledSetting?.value === '0') {
    return res.status(400).json({ error: 'Chương trình Vòng quay may mắn hiện đang tạm ngưng.' });
  }

  const rule = ruleSetting?.value || 'daily';
  const customerId = req.customer.id;
  const customerPhone = req.customer.phone;

  // Check turn eligibility
  if (rule === 'daily') {
    const todayRow = db.prepare(`
      SELECT count(*) as count 
      FROM lucky_wheel_spins 
      WHERE customer_id = ? AND date(created_at, 'localtime') = date('now', 'localtime')
    `).get(customerId);
    if ((todayRow?.count || 0) > 0) {
      return res.status(400).json({ error: 'Bạn đã sử dụng hết 1 lượt quay miễn phí của ngày hôm nay. Hãy quay lại vào ngày mai nhé!' });
    }
  } else {
    const allRow = db.prepare(`
      SELECT count(*) as count 
      FROM lucky_wheel_spins 
      WHERE customer_id = ?
    `).get(customerId);
    if ((allRow?.count || 0) > 0) {
      return res.status(400).json({ error: 'Bạn đã sử dụng lượt quay may mắn của tài khoản này.' });
    }
  }

  // Get active slices
  const rewards = db.prepare(`
    SELECT id, label, reward_type, reward_value, probability, color, text_color, display_order 
    FROM lucky_wheel_rewards 
    WHERE is_active = 1 
    ORDER BY display_order ASC, id ASC
  `).all();

  if (!rewards || rewards.length === 0) {
    return res.status(400).json({ error: 'Vòng quay đang được cấu hình. Vui lòng quay lại sau.' });
  }

  // Weighted random algorithm
  const totalWeight = rewards.reduce((sum, r) => sum + Math.max(1, parseInt(r.probability) || 1), 0);
  let randomVal = Math.random() * totalWeight;
  let targetIndex = 0;

  for (let i = 0; i < rewards.length; i++) {
    const w = Math.max(1, parseInt(rewards[i].probability) || 1);
    if (randomVal <= w) {
      targetIndex = i;
      break;
    }
    randomVal -= w;
  }

  const chosenReward = rewards[targetIndex];

  // 1. Record spin in DB
  const spinRes = db.prepare(`
    INSERT INTO lucky_wheel_spins (customer_id, customer_phone, reward_id, reward_label, reward_code)
    VALUES (?, ?, ?, ?, ?)
  `).run(customerId, customerPhone, chosenReward.id, chosenReward.label, chosenReward.reward_value || null);

  syncWriteToCloud(`
    INSERT OR REPLACE INTO lucky_wheel_spins (id, customer_id, customer_phone, reward_id, reward_label, reward_code)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [spinRes.lastInsertRowid, customerId, customerPhone, chosenReward.id, chosenReward.label, chosenReward.reward_value || null]);

  // 2. If prize is voucher / gift, add directly to customer promotions wallet
  let promoTitle = '';
  if ((chosenReward.reward_type === 'voucher' || chosenReward.reward_type === 'free_item') && chosenReward.reward_value) {
    const promo = db.prepare('SELECT id, code, title FROM promotions WHERE UPPER(code) = UPPER(?) AND is_active = 1').get(chosenReward.reward_value);
    if (promo) {
      promoTitle = promo.title;
      const existing = db.prepare('SELECT id, status FROM customer_promotions WHERE customer_id = ? AND promotion_id = ?').get(customerId, promo.id);
      if (!existing) {
        const cpRes = db.prepare(`
          INSERT INTO customer_promotions (customer_id, promotion_id, code, status)
          VALUES (?, ?, ?, 'claimed')
        `).run(customerId, promo.id, promo.code);

        syncWriteToCloud(`
          INSERT OR REPLACE INTO customer_promotions (id, customer_id, promotion_id, code, status)
          VALUES (?, ?, ?, ?, 'claimed')
        `, [cpRes.lastInsertRowid, customerId, promo.id, promo.code]);
      } else if (existing.status === 'used') {
        db.prepare("UPDATE customer_promotions SET status = 'claimed', claimed_at = CURRENT_TIMESTAMP, used_at = NULL, order_id = NULL WHERE id = ?").run(existing.id);
        syncWriteToCloud("UPDATE customer_promotions SET status = 'claimed', claimed_at = CURRENT_TIMESTAMP, used_at = NULL, order_id = NULL WHERE id = ?", [existing.id]);
      }
    }
  }

  res.json({
    success: true,
    target_index: targetIndex,
    reward: {
      id: chosenReward.id,
      label: chosenReward.label,
      reward_type: chosenReward.reward_type,
      reward_value: chosenReward.reward_value,
      title: promoTitle || chosenReward.label
    }
  });
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// 4. ADMIN: Get all slices & wheel settings
router.get('/admin/rewards', authenticateToken, requireOwner, (req, res) => {
  const enabledSetting = db.prepare("SELECT value FROM settings WHERE key = 'lucky_wheel_enabled'").get();
  const ruleSetting = db.prepare("SELECT value FROM settings WHERE key = 'lucky_wheel_rule'").get();

  const rewards = db.prepare('SELECT * FROM lucky_wheel_rewards ORDER BY display_order ASC, id ASC').all();
  const totalSpins = db.prepare('SELECT count(*) as count FROM lucky_wheel_spins').get();

  res.json({
    enabled: enabledSetting?.value !== '0',
    rule: ruleSetting?.value || 'daily',
    total_spins: totalSpins?.count || 0,
    rewards
  });
});

// 5. ADMIN: Create reward slice
router.post('/admin/rewards', authenticateToken, requireOwner, (req, res) => {
  const { label, reward_type, reward_value, probability, color, text_color, display_order, is_active } = req.body;
  if (!label || !label.trim()) {
    return res.status(400).json({ error: 'Tên phần thưởng không được để trống' });
  }

  const result = db.prepare(`
    INSERT INTO lucky_wheel_rewards (label, reward_type, reward_value, probability, color, text_color, display_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    label.trim(),
    reward_type || 'voucher',
    reward_value ? reward_value.trim().toUpperCase() : null,
    parseInt(probability) || 10,
    color || '#F5BD42',
    text_color || '#4A2115',
    parseInt(display_order) || 0,
    is_active !== undefined ? (is_active ? 1 : 0) : 1
  );

  syncWriteToCloud(`
    INSERT OR REPLACE INTO lucky_wheel_rewards (id, label, reward_type, reward_value, probability, color, text_color, display_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    result.lastInsertRowid,
    label.trim(),
    reward_type || 'voucher',
    reward_value ? reward_value.trim().toUpperCase() : null,
    parseInt(probability) || 10,
    color || '#F5BD42',
    text_color || '#4A2115',
    parseInt(display_order) || 0,
    is_active !== undefined ? (is_active ? 1 : 0) : 1
  ]);

  res.json({ success: true, id: result.lastInsertRowid });
});

// 6. ADMIN: Update reward slice
router.put('/admin/rewards/:id', authenticateToken, requireOwner, (req, res) => {
  const { id } = req.params;
  const { label, reward_type, reward_value, probability, color, text_color, display_order, is_active } = req.body;

  db.prepare(`
    UPDATE lucky_wheel_rewards
    SET label = ?, reward_type = ?, reward_value = ?, probability = ?, color = ?, text_color = ?, display_order = ?, is_active = ?
    WHERE id = ?
  `).run(
    label.trim(),
    reward_type || 'voucher',
    reward_value ? reward_value.trim().toUpperCase() : null,
    parseInt(probability) || 10,
    color || '#F5BD42',
    text_color || '#4A2115',
    parseInt(display_order) || 0,
    is_active !== undefined ? (is_active ? 1 : 0) : 1,
    id
  );

  syncWriteToCloud(`
    UPDATE lucky_wheel_rewards
    SET label = ?, reward_type = ?, reward_value = ?, probability = ?, color = ?, text_color = ?, display_order = ?, is_active = ?
    WHERE id = ?
  `, [
    label.trim(),
    reward_type || 'voucher',
    reward_value ? reward_value.trim().toUpperCase() : null,
    parseInt(probability) || 10,
    color || '#F5BD42',
    text_color || '#4A2115',
    parseInt(display_order) || 0,
    is_active !== undefined ? (is_active ? 1 : 0) : 1,
    id
  ]);

  res.json({ success: true });
});

// 7. ADMIN: Delete reward slice
router.delete('/admin/rewards/:id', authenticateToken, requireOwner, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM lucky_wheel_rewards WHERE id = ?').run(id);
  syncWriteToCloud('DELETE FROM lucky_wheel_rewards WHERE id = ?', [id]);
  res.json({ success: true });
});

// 8. ADMIN: Update wheel general settings (enable/disable, rules)
router.put('/admin/settings', authenticateToken, requireOwner, (req, res) => {
  const { enabled, rule } = req.body;
  const enabledVal = enabled ? '1' : '0';
  const ruleVal = rule === 'once' ? 'once' : 'daily';

  db.prepare("INSERT INTO settings (key, value) VALUES ('lucky_wheel_enabled', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(enabledVal);
  db.prepare("INSERT INTO settings (key, value) VALUES ('lucky_wheel_rule', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(ruleVal);

  syncWriteToCloud("INSERT INTO settings (key, value) VALUES ('lucky_wheel_enabled', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [enabledVal]);
  syncWriteToCloud("INSERT INTO settings (key, value) VALUES ('lucky_wheel_rule', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [ruleVal]);

  res.json({ success: true, enabled: enabledVal === '1', rule: ruleVal });
});

// 9. ADMIN: View recent spin history
router.get('/admin/history', authenticateToken, requireOwner, (req, res) => {
  const history = db.prepare(`
    SELECT s.id, s.customer_id, s.customer_phone, s.reward_label, s.reward_code, s.created_at, c.full_name as customer_name
    FROM lucky_wheel_spins s
    LEFT JOIN customers c ON s.customer_id = c.id
    ORDER BY s.id DESC
    LIMIT 60
  `).all();

  res.json(history);
});

module.exports = router;
