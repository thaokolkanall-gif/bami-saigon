const express = require('express');
const { db } = require('../db');
const ordersRouter = require('./orders');
const { authenticateToken, requireOwner } = require('../middleware/auth');

const router = express.Router();

// Helper: Extract order code BMxxxx from description or content string
function extractOrderCode(text) {
  if (!text) return null;
  const match = text.toUpperCase().match(/BM\d{4}/);
  if (match) return match[0];
  
  // Also try to find numbers e.g. BAMI 8924 -> BM8924
  const bamiMatch = text.toUpperCase().match(/BAMI\s*(\d{4})/);
  if (bamiMatch) return `BM${bamiMatch[1]}`;

  return null;
}

// 1. WEBHOOK: Receive automated bank transfer notification (SePay, Casso, PayOS, etc.)
router.post('/webhook', (req, res) => {
  try {
    const payload = req.body;
    console.log('Received Payment Webhook:', JSON.stringify(payload));

    // Optional token verification
    const webhookSecretSetting = db.prepare("SELECT value FROM settings WHERE key = 'webhook_secret'").get();
    const expectedSecret = webhookSecretSetting?.value || 'bami_webhook_sec_2026';
    const authHeader = req.headers['authorization'] || req.headers['x-api-key'] || req.query.token;

    if (authHeader && authHeader !== expectedSecret && authHeader !== `Bearer ${expectedSecret}` && authHeader !== `Apikey ${expectedSecret}`) {
      console.warn('Webhook secret mismatch (non-blocking for demo/sandbox, logging warning)');
    }

    let transactions = [];

    // Format 1: Casso { error: 0, data: [ ... ] }
    if (payload.data && Array.isArray(payload.data)) {
      transactions = payload.data.map(item => ({
        amount: parseFloat(item.amount || 0),
        description: item.description || item.content || '',
        reference: item.reference || item.tid || String(item.id || ''),
        raw: item
      }));
    }
    // Format 2: SePay { transferAmount, content, referenceCode, ... }
    else if (payload.transferAmount || payload.content || payload.description) {
      transactions.push({
        amount: parseFloat(payload.transferAmount || payload.amount || 0),
        description: payload.content || payload.description || '',
        reference: payload.referenceCode || payload.reference || payload.id || '',
        raw: payload
      });
    }
    // Format 3: PayOS { data: { amount, description, orderCode, ... } }
    else if (payload.data && (payload.data.amount || payload.data.description)) {
      transactions.push({
        amount: parseFloat(payload.data.amount || 0),
        description: payload.data.description || '',
        reference: payload.data.reference || String(payload.data.orderCode || ''),
        raw: payload.data
      });
    }
    // Generic fallback
    else if (payload.amount && (payload.order_code || payload.description)) {
      transactions.push({
        amount: parseFloat(payload.amount),
        description: payload.description || payload.order_code || '',
        reference: payload.transaction_id || '',
        raw: payload
      });
    }

    if (transactions.length === 0) {
      return res.status(200).json({ success: true, message: 'Webhook received but no valid transaction found' });
    }

    const processedOrders = [];

    for (const tx of transactions) {
      const orderCode = extractOrderCode(tx.description);
      if (!orderCode) {
        console.log(`Could not extract order code from transaction text: "${tx.description}"`);
        continue;
      }

      const order = db.prepare('SELECT * FROM orders WHERE order_code = ?').get(orderCode);
      if (!order) {
        console.log(`Order ${orderCode} not found in database.`);
        continue;
      }

      if (order.payment_status === 'paid' || order.payment_status === 'verified') {
        console.log(`Order ${orderCode} was already paid.`);
        processedOrders.push({ order_code: orderCode, status: 'already_paid' });
        continue;
      }

      // Update Order to PAID
      const newOrderStatus = order.status === 'pending_payment' ? 'new' : order.status;
      db.prepare(`
        UPDATE orders 
        SET payment_status = 'paid', 
            payment_method = 'transfer', 
            is_prepaid = 1, 
            status = ?,
            paid_at = CURRENT_TIMESTAMP, 
            transaction_ref = ?
        WHERE id = ?
      `).run(newOrderStatus, tx.reference || 'WEBHOOK_TRANSFER', order.id);

      // Record Order History
      db.prepare(`
        INSERT INTO order_history (order_id, from_status, to_status, note, updated_by)
        VALUES (?, ?, ?, ?, 'Hệ Thống Ngân Hàng')
      `).run(
        order.id,
        order.status,
        newOrderStatus,
        `Tự động xác nhận thanh toán chuyển khoản: ${tx.amount.toLocaleString('vi-VN')}đ (Mã GD: ${tx.reference || 'N/A'})${order.status === 'pending_payment' ? ' — Đơn hàng chính thức được tiếp nhận' : ''}`
      );

      // Create Admin Notification (now the order enters the system)
      db.prepare(`
        INSERT INTO notifications (title, message, type, order_id)
        VALUES (?, ?, ?, ?)
      `).run(
        order.status === 'pending_payment' ? `Đơn mới #${orderCode} (Đã thanh toán trước)` : `Đã nhận thanh toán đơn #${orderCode}`,
        order.status === 'pending_payment' 
          ? `Khách ${order.customer_name} đã thanh toán trước ${tx.amount.toLocaleString('vi-VN')}đ cho đơn #${orderCode}. Đơn hàng đã được xác nhận tự động!`
          : `Ngân hàng báo có +${tx.amount.toLocaleString('vi-VN')}đ cho đơn #${orderCode}. Khách đã thanh toán trước 100%!`,
        order.status === 'pending_payment' ? 'order' : 'payment',
        order.id
      );

      // Real-time broadcast to SSE clients (both Customer Tracking page and Admin see it instantly)
      if (ordersRouter.broadcastOrderEvent) {
        ordersRouter.broadcastOrderEvent({
          type: 'payment_received',
          order_id: order.id,
          order_code: order.order_code,
          tracking_token: order.tracking_token,
          amount: tx.amount,
          is_prepaid: 1,
          new_status: newOrderStatus
        });

        // Also broadcast new_order if the order just transitioned from pending_payment to new
        if (order.status === 'pending_payment') {
          ordersRouter.broadcastOrderEvent({
            type: 'new_order',
            order_id: order.id,
            order_code: order.order_code,
            total_amount: order.total_amount,
            customer_name: order.customer_name
          });
        }
      }

      processedOrders.push({ order_code: orderCode, status: 'paid', amount: tx.amount });
    }

    res.json({
      success: true,
      processed: processedOrders,
      message: `Đã xử lý ${processedOrders.length} giao dịch thành công`
    });
  } catch (err) {
    console.error('Payment Webhook Error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi xử lý webhook', details: err.message });
  }
});

// 2. SIMULATE PAYMENT (For testing auto-detect transfer in Admin)
router.post('/simulate', authenticateToken, requireOwner, (req, res) => {
  const { order_code, amount } = req.body;
  if (!order_code) {
    return res.status(400).json({ error: 'Vui lòng cung cấp mã đơn (ví dụ BM8924)' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE UPPER(order_code) = UPPER(?)').get(order_code.trim());
  if (!order) {
    return res.status(404).json({ error: `Không tìm thấy đơn hàng #${order_code}` });
  }

  const payAmount = amount || order.total_amount;
  const refCode = `SIM_${Date.now()}`;
  const newOrderStatus = order.status === 'pending_payment' ? 'new' : order.status;

  db.prepare(`
    UPDATE orders 
    SET payment_status = 'paid', 
        payment_method = 'transfer', 
        is_prepaid = 1, 
        status = ?,
        paid_at = CURRENT_TIMESTAMP, 
        transaction_ref = ?
    WHERE id = ?
  `).run(newOrderStatus, refCode, order.id);

  db.prepare(`
    INSERT INTO order_history (order_id, from_status, to_status, note, updated_by)
    VALUES (?, ?, ?, ?, 'Chủ Quán Test')
  `).run(
    order.id,
    order.status,
    newOrderStatus,
    `Thử nghiệm xác nhận thanh toán chuyển khoản: ${payAmount.toLocaleString('vi-VN')}đ`
  );

  // Broadcast
  if (ordersRouter.broadcastOrderEvent) {
    ordersRouter.broadcastOrderEvent({
      type: 'payment_received',
      order_id: order.id,
      order_code: order.order_code,
      tracking_token: order.tracking_token,
      amount: payAmount,
      is_prepaid: 1,
      new_status: newOrderStatus
    });

    if (order.status === 'pending_payment') {
      ordersRouter.broadcastOrderEvent({
        type: 'new_order',
        order_id: order.id,
        order_code: order.order_code,
        total_amount: order.total_amount,
        customer_name: order.customer_name
      });
    }
  }

  res.json({
    success: true,
    message: `Đã giả lập chuyển khoản thành công cho đơn #${order.order_code}!`,
    order_id: order.id
  });
});

// 3. Customer Pre-pay info request
router.get('/prepay-info/:trackingToken', (req, res) => {
  const token = req.params.trackingToken;
  const order = db.prepare('SELECT id, order_code, total_amount, payment_status, customer_phone FROM orders WHERE tracking_token = ?').get(token);
  if (!order) {
    return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
  }

  const settingsRows = db.prepare('SELECT key, value FROM settings').all();
  const sMap = {};
  for (const row of settingsRows) sMap[row.key] = row.value;

  const bankName = sMap.bank_name || 'Techcombank';
  const bankAccount = sMap.bank_account || '1903688899901';
  const bankOwner = sMap.bank_owner || 'BAMI SAI GON';
  const qrUrl = `https://img.vietqr.io/image/${bankName}-${bankAccount}-compact2.png?amount=${order.total_amount}&addInfo=BAMI%20${order.order_code}&accountName=${encodeURIComponent(bankOwner)}`;

  res.json({
    order_code: order.order_code,
    total_amount: order.total_amount,
    payment_status: order.payment_status,
    bank_name: bankName,
    bank_account: bankAccount,
    bank_owner: bankOwner,
    memo: `BAMI ${order.order_code}`,
    qr_url: qrUrl
  });
});

module.exports = router;
