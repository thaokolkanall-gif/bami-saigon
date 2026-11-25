const express = require('express');
const crypto = require('crypto');
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rate-limit');

const router = express.Router();

// SSE Clients for real-time notifications
let sseClients = [];

function broadcastOrderEvent(eventData) {
  for (const client of sseClients) {
    try {
      client.res.write(`data: ${JSON.stringify(eventData)}\n\n`);
    } catch (e) {
      // client disconnected
    }
  }
}

// Subscribe to SSE
router.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const clientId = Date.now() + '-' + Math.random();
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'connected', time: new Date() })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// Helper: Generate human-friendly order code e.g. BAMI-8924
function generateOrderCode() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BM${rand}`;
}

// Helper: Generate cryptographically secure unguessable tracking token
function generateTrackingToken() {
  return crypto.randomBytes(16).toString('hex');
}

// 1. PUBLIC: Create Order
router.post('/', rateLimiter({ windowMs: 60000, max: 15, message: 'Bạn đang gửi quá nhiều đơn. Vui lòng chờ ít phút!' }), (req, res) => {
  const {
    customer_name,
    customer_phone,
    order_type,
    address,
    address_note,
    delivery_zone_id,
    pickup_time,
    order_note,
    payment_method,
    items,
    promo_code,
    idempotency_key
  } = req.body;

  // Validation
  if (!customer_name || !customer_phone || !order_type || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin đơn hàng và danh sách món' });
  }

  // Check store online order acceptance
  const onlineSetting = db.prepare("SELECT value FROM settings WHERE key = 'is_online_ordering_enabled'").get();
  const pausedSetting = db.prepare("SELECT value FROM settings WHERE key = 'is_paused'").get();
  if (onlineSetting?.value === '0') {
    return res.status(400).json({ error: 'Quán hiện đang tắt tính năng nhận đơn trực tuyến. Quý khách vui lòng liên hệ qua hotline hoặc Zalo.' });
  }
  if (pausedSetting?.value === '1') {
    return res.status(400).json({ error: 'Quán đang quá tải và tạm ngưng nhận đơn mới trong ít phút. Quý khách vui lòng quay lại sau!' });
  }

  // Check pickup / delivery permission
  if (order_type === 'pickup') {
    const pickupSetting = db.prepare("SELECT value FROM settings WHERE key = 'allow_pickup'").get();
    if (pickupSetting?.value === '0') {
      return res.status(400).json({ error: 'Quán hiện không hỗ trợ hình thức nhận tại quán.' });
    }
  } else if (order_type === 'delivery') {
    const delivSetting = db.prepare("SELECT value FROM settings WHERE key = 'allow_delivery'").get();
    if (delivSetting?.value === '0') {
      return res.status(400).json({ error: 'Quán hiện không hỗ trợ giao hàng tận nơi. Quý khách vui lòng chọn Nhận tại quán.' });
    }
    if (!address) {
      return res.status(400).json({ error: 'Vui lòng nhập địa chỉ giao hàng cụ thể' });
    }
  }

  // Check Idempotency key (avoid duplicate double submission)
  if (idempotency_key) {
    const existingOrder = db.prepare('SELECT order_code, tracking_token FROM orders WHERE idempotency_key = ?').get(idempotency_key);
    if (existingOrder) {
      return res.json({
        success: true,
        order_code: existingOrder.order_code,
        tracking_token: existingOrder.tracking_token,
        is_duplicate: true
      });
    }
  }

  // Server-side Recalculation: Verify all products, prices, toppings and availability
  let subtotal = 0;
  const verifiedOrderItems = [];

  const getProduct = db.prepare('SELECT id, name, price, is_available FROM products WHERE id = ?');
  const getTopping = db.prepare('SELECT id, name, price, is_available FROM toppings WHERE id = ?');

  for (const item of items) {
    const product = getProduct.get(item.product_id);
    if (!product) {
      return res.status(400).json({ error: `Món trong giỏ hàng (ID: ${item.product_id}) không còn tồn tại trên hệ thống.` });
    }
    if (!product.is_available) {
      return res.status(400).json({ error: `Món "${product.name}" hiện đã hết hàng. Vui lòng bỏ món khỏi giỏ để tiếp tục.` });
    }

    const qty = Math.max(1, parseInt(item.quantity) || 1);
    let itemUnitPrice = product.price;
    const toppingsList = [];

    if (item.toppings && Array.isArray(item.toppings)) {
      for (const topId of item.toppings) {
        const topping = getTopping.get(topId);
        if (topping && topping.is_available) {
          itemUnitPrice += topping.price;
          toppingsList.push({ id: topping.id, name: topping.name, price: topping.price });
        }
      }
    }

    const itemSubtotal = itemUnitPrice * qty;
    subtotal += itemSubtotal;

    verifiedOrderItems.push({
      product_id: product.id,
      product_name: product.name,
      unit_price: itemUnitPrice,
      quantity: qty,
      subtotal: itemSubtotal,
      toppings_json: JSON.stringify(toppingsList),
      note: item.note || ''
    });
  }

  // Check minimum order value
  const minOrderSetting = db.prepare("SELECT value FROM settings WHERE key = 'min_order_value'").get();
  const minVal = parseInt(minOrderSetting?.value) || 0;
  if (subtotal < minVal) {
    return res.status(400).json({
      error: `Giá trị đơn hàng tối thiểu là ${minVal.toLocaleString('vi-VN')}đ (Tạm tính hiện tại: ${subtotal.toLocaleString('vi-VN')}đ)`
    });
  }

  // Calculate Delivery Fee
  let deliveryFee = 0;
  if (order_type === 'delivery') {
    if (delivery_zone_id) {
      const zone = db.prepare('SELECT fee, min_order FROM delivery_zones WHERE id = ? AND is_active = 1').get(delivery_zone_id);
      if (zone) {
        if (zone.min_order && subtotal < zone.min_order) {
          return res.status(400).json({
            error: `Khu vực này yêu cầu đơn tối thiểu ${zone.min_order.toLocaleString('vi-VN')}đ`
          });
        }
        deliveryFee = zone.fee;
      } else {
        return res.status(400).json({ error: 'Khu vực giao hàng được chọn không hợp lệ hoặc quán chưa phục vụ khu vực này.' });
      }
    } else {
      return res.status(400).json({ error: 'Quý khách vui lòng chọn khu vực giao hàng để tính phí chính xác.' });
    }
  }

  // Calculate Promotion Discount
  let discountAmount = 0;
  let validPromoId = null;
  if (promo_code) {
    const promo = db.prepare('SELECT * FROM promotions WHERE UPPER(code) = UPPER(?) AND is_active = 1').get(promo_code.trim());
    if (promo) {
      const now = new Date();
      const isDateValid = (!promo.start_date || new Date(promo.start_date) <= now) && (!promo.end_date || new Date(promo.end_date) >= now);
      const isUsesValid = !promo.max_uses || promo.used_count < promo.max_uses;
      const isMinValid = !promo.min_order_value || subtotal >= promo.min_order_value;

      if (isDateValid && isUsesValid && isMinValid) {
        if (promo.discount_type === 'percent') {
          discountAmount = Math.round((subtotal * promo.discount_value) / 100);
          if (promo.max_discount && discountAmount > promo.max_discount) {
            discountAmount = promo.max_discount;
          }
        } else {
          discountAmount = promo.discount_value;
        }
        discountAmount = Math.min(discountAmount, subtotal);
        validPromoId = promo.id;
      }
    }
  }

  const totalAmount = Math.max(0, subtotal - discountAmount + deliveryFee);
  const orderCode = generateOrderCode();
  const trackingToken = generateTrackingToken();

  // Database Transaction to save order & line items
  const createOrderTransaction = db.transaction(() => {
    const orderResult = db.prepare(`
      INSERT INTO orders (
        order_code, tracking_token, customer_name, customer_phone, order_type,
        address, address_note, delivery_zone_id, pickup_time, order_note,
        payment_method, payment_status, status, subtotal, discount_amount,
        delivery_fee, total_amount, idempotency_key
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', 'new', ?, ?, ?, ?, ?)
    `).run(
      orderCode,
      trackingToken,
      customer_name.trim(),
      customer_phone.trim(),
      order_type,
      address || null,
      address_note || null,
      delivery_zone_id || null,
      pickup_time || null,
      order_note || null,
      payment_method === 'transfer' ? 'transfer' : 'cod',
      subtotal,
      discountAmount,
      deliveryFee,
      totalAmount,
      idempotency_key || null
    );

    const orderId = orderResult.lastInsertRowid;

    // Insert order items
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal, toppings_json, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of verifiedOrderItems) {
      insertItem.run(
        orderId,
        item.product_id,
        item.product_name,
        item.unit_price,
        item.quantity,
        item.subtotal,
        item.toppings_json,
        item.note
      );
    }

    // Insert order history
    db.prepare(`
      INSERT INTO order_history (order_id, from_status, to_status, note, updated_by)
      VALUES (?, NULL, 'new', 'Khách hàng tạo đơn trực tuyến', 'Khách hàng')
    `).run(orderId);

    // Update promo usage
    if (validPromoId) {
      db.prepare('UPDATE promotions SET used_count = used_count + 1 WHERE id = ?').run(validPromoId);
    }

    // Create admin notification
    db.prepare(`
      INSERT INTO notifications (title, message, type, order_id)
      VALUES (?, ?, 'order', ?)
    `).run(
      `Đơn hàng mới #${orderCode}`,
      `Khách ${customer_name} vừa đặt đơn ${totalAmount.toLocaleString('vi-VN')}đ`,
      orderId
    );

    return { orderId, orderCode, trackingToken, totalAmount };
  });

  const createdOrder = createOrderTransaction();

  // Broadcast to admin in real-time
  broadcastOrderEvent({
    type: 'new_order',
    order_id: createdOrder.orderId,
    order_code: createdOrder.orderCode,
    total_amount: createdOrder.totalAmount,
    customer_name: customer_name.trim()
  });

  res.json({
    success: true,
    order_code: createdOrder.orderCode,
    tracking_token: createdOrder.trackingToken,
    total_amount: createdOrder.totalAmount
  });
});

// 2. PUBLIC: Track Order by secure unguessable token
router.get('/track/:trackingToken', (req, res) => {
  const { trackingToken } = req.params;
  const order = db.prepare('SELECT * FROM orders WHERE tracking_token = ?').get(trackingToken);

  if (!order) {
    return res.status(404).json({ error: 'Không tìm thấy thông tin đơn hàng này hoặc mã theo dõi không đúng.' });
  }

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  const history = db.prepare('SELECT * FROM order_history WHERE order_id = ? ORDER BY id ASC').all(order.id);

  // Parse toppings
  for (const item of items) {
    try {
      item.toppings = item.toppings_json ? JSON.parse(item.toppings_json) : [];
    } catch (e) {
      item.toppings = [];
    }
  }

  res.json({
    order: {
      order_code: order.order_code,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'), // Mask phone for privacy
      order_type: order.order_type,
      address: order.address,
      address_note: order.address_note,
      pickup_time: order.pickup_time,
      order_note: order.order_note,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      status: order.status,
      cancel_reason: order.cancel_reason,
      subtotal: order.subtotal,
      discount_amount: order.discount_amount,
      delivery_fee: order.delivery_fee,
      total_amount: order.total_amount,
      created_at: order.created_at,
      items,
      history
    }
  });
});

// 3. ADMIN: List Orders with Filters & Search
router.get('/admin/list', authenticateToken, (req, res) => {
  const { status, date, search, order_type, limit = 50, page = 1 } = req.query;

  let query = 'SELECT * FROM orders WHERE 1=1';
  const params = [];

  if (status && status !== 'all') {
    query += ' AND status = ?';
    params.push(status);
  }

  if (order_type && order_type !== 'all') {
    query += ' AND order_type = ?';
    params.push(order_type);
  }

  if (date) {
    query += ' AND DATE(created_at) = DATE(?)';
    params.push(date);
  }

  if (search) {
    query += ' AND (order_code LIKE ? OR customer_phone LIKE ? OR customer_name LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  params.push(parseInt(limit), offset);

  const orders = db.prepare(query).all(...params);

  // Attach items to each order
  const getItemStmt = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
  for (const o of orders) {
    o.items = getItemStmt.all(o.id).map(it => {
      try {
        it.toppings = it.toppings_json ? JSON.parse(it.toppings_json) : [];
      } catch (e) {
        it.toppings = [];
      }
      return it;
    });
  }

  // Count unread notifications
  const unreadCount = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0').get().count;

  res.json({
    orders,
    unread_notifications: unreadCount
  });
});

// 4. ADMIN: Order Detail
router.get('/admin/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id).map(it => {
    try {
      it.toppings = it.toppings_json ? JSON.parse(it.toppings_json) : [];
    } catch (e) {
      it.toppings = [];
    }
    return it;
  });

  const history = db.prepare('SELECT * FROM order_history WHERE order_id = ? ORDER BY id ASC').all(id);

  res.json({ order, items, history });
});

// 5. ADMIN: Update Order Status (Status Workflow: new -> confirmed -> preparing -> delivering -> completed)
router.put('/admin/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  const validStatuses = ['new', 'confirmed', 'preparing', 'delivering', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Trạng thái chuyển tiếp không hợp lệ' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });

  db.transaction(() => {
    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);

    db.prepare(`
      INSERT INTO order_history (order_id, from_status, to_status, note, updated_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, order.status, status, note || `Cập nhật trạng thái sang: ${status}`, req.user.full_name || req.user.username);
  })();

  res.json({ success: true, status });
});

// 6. ADMIN: Cancel Order (Mandatory reason)
router.put('/admin/:id/cancel', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { cancel_reason } = req.body;

  if (!cancel_reason || !cancel_reason.trim()) {
    return res.status(400).json({ error: 'Bắt buộc phải nhập lý do hủy đơn' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });

  db.transaction(() => {
    db.prepare('UPDATE orders SET status = "cancelled", cancel_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(cancel_reason.trim(), id);

    db.prepare(`
      INSERT INTO order_history (order_id, from_status, to_status, note, updated_by)
      VALUES (?, ?, 'cancelled', ?, ?)
    `).run(id, order.status, `Hủy đơn: ${cancel_reason.trim()}`, req.user.full_name || req.user.username);
  })();

  res.json({ success: true, message: 'Đã hủy đơn hàng thành công' });
});

// 7. ADMIN: Update Payment Status (Verify transfer / COD collection)
router.put('/admin/:id/payment', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { payment_status } = req.body;

  const validPaymentStatuses = ['unpaid', 'verified', 'paid'];
  if (!validPaymentStatuses.includes(payment_status)) {
    return res.status(400).json({ error: 'Trạng thái thanh toán không hợp lệ' });
  }

  db.prepare('UPDATE orders SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(payment_status, id);

  db.prepare('INSERT INTO audit_logs (username, action, details) VALUES (?, ?, ?)')
    .run(req.user.username, 'Cập nhật thanh toán đơn hàng', `Đơn #${id}: trạng thái thanh toán -> ${payment_status}`);

  res.json({ success: true });
});

// 8. ADMIN: Update internal notes
router.put('/admin/:id/notes', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { internal_notes } = req.body;
  db.prepare('UPDATE orders SET internal_notes = ? WHERE id = ?').run(internal_notes, id);
  res.json({ success: true });
});

// 9. ADMIN: Mark notifications read
router.post('/admin/notifications/mark-read', authenticateToken, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE is_read = 0').run();
  res.json({ success: true });
});

// 10. ADMIN: Dashboard Statistics Overview
router.get('/admin/stats/overview', authenticateToken, (req, res) => {
  const counts = db.prepare(`
    SELECT 
      SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as count_new,
      SUM(CASE WHEN status = 'confirmed' OR status = 'preparing' THEN 1 ELSE 0 END) as count_preparing,
      SUM(CASE WHEN status = 'delivering' THEN 1 ELSE 0 END) as count_delivering,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as count_completed,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as count_cancelled,
      -- Revenue of completed orders
      SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as completed_revenue,
      -- Actual cash/verified collected amount
      SUM(CASE WHEN payment_status IN ('verified', 'paid') THEN total_amount ELSE 0 END) as collected_amount,
      -- Today's revenue
      SUM(CASE WHEN status = 'completed' AND DATE(created_at) = DATE('now', 'localtime') THEN total_amount ELSE 0 END) as today_revenue,
      SUM(CASE WHEN DATE(created_at) = DATE('now', 'localtime') THEN 1 ELSE 0 END) as today_orders
    FROM orders
  `).get();

  const recentOrders = db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 5').all();

  res.json({
    stats: counts,
    recentOrders
  });
});

module.exports = router;
