const express = require('express');
const { db, tursoClient, syncWriteToCloud } = require('../db');
const { authenticateToken, requireOwner } = require('../middleware/auth');

const router = express.Router();

// Backup & Sync to Turso Cloud manually or check status
router.post('/cloud-backup', authenticateToken, requireOwner, async (req, res) => {
  if (!tursoClient) {
    return res.status(400).json({ error: 'Chưa cấu hình Turso Cloud Client' });
  }

  try {
    const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'test_%'").all();
    let totalRowsSynced = 0;

    for (const t of tables) {
      try {
        await tursoClient.execute(t.sql);
      } catch (e) {}

      const rows = db.prepare(`SELECT * FROM "${t.name}"`).all();
      if (rows.length === 0) continue;

      for (const row of rows) {
        const keys = Object.keys(row);
        const cols = keys.map(k => `"${k}"`).join(', ');
        const placeholders = keys.map(() => '?').join(', ');
        const values = keys.map(k => row[k]);
        const sql = `INSERT OR REPLACE INTO "${t.name}" (${cols}) VALUES (${placeholders})`;
        await tursoClient.execute({ sql, args: values });
        totalRowsSynced++;
      }
    }

    res.json({
      success: true,
      message: `Đã sao lưu thành công ${totalRowsSynced} bản ghi lên Turso Cloud! Dữ liệu được bảo toàn vĩnh viễn.`
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi sao lưu lên Cloud: ' + err.message });
  }
});

// Restore from Turso Cloud manually
router.post('/cloud-restore', authenticateToken, requireOwner, async (req, res) => {
  if (!tursoClient) {
    return res.status(400).json({ error: 'Chưa cấu hình Turso Cloud Client' });
  }

  try {
    const tablesRes = await tursoClient.execute("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'test_%'");
    let totalRowsRestored = 0;

    for (const t of tablesRes.rows) {
      db.exec(t.sql);
      const rowsRes = await tursoClient.execute(`SELECT * FROM "${t.name}"`);
      if (rowsRes.rows.length > 0) {
        const keys = Object.keys(rowsRes.rows[0]);
        const cols = keys.map(k => `"${k}"`).join(', ');
        const placeholders = keys.map(() => '?').join(', ');
        const insertStmt = db.prepare(`INSERT OR REPLACE INTO "${t.name}" (${cols}) VALUES (${placeholders})`);
        
        const insertMany = db.transaction((rows) => {
          for (const row of rows) {
            insertStmt.run(keys.map(k => row[k]));
            totalRowsRestored++;
          }
        });
        insertMany(rowsRes.rows);
      }
    }

    res.json({
      success: true,
      message: `Đã phục hồi thành công ${totalRowsRestored} bản ghi từ Turso Cloud!`
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi phục hồi từ Cloud: ' + err.message });
  }
});

// Get public store info & operational settings
router.get('/settings', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  
  // Format opening hours if JSON
  try {
    if (settings.opening_hours) {
      settings.opening_hours = JSON.parse(settings.opening_hours);
    }
  } catch (e) {
    // keep string
  }

  res.json(settings);
});

// Update store settings (Owner only)
router.put('/settings', authenticateToken, requireOwner, (req, res) => {
  const updates = req.body;
  const updateStmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP');

  const transaction = db.transaction((data) => {
    for (const [key, value] of Object.entries(data)) {
      const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
      updateStmt.run(key, valStr);
    }
  });

  transaction(updates);

  // Sync to Turso Cloud
  for (const [key, value] of Object.entries(updates)) {
    const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
    syncWriteToCloud('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP', [key, valStr]);
  }

  // Log to audit log
  db.prepare('INSERT INTO audit_logs (username, action, details) VALUES (?, ?, ?)')
    .run(req.user.username, 'Cập nhật cấu hình quán', JSON.stringify(Object.keys(updates)));

  res.json({ success: true, message: 'Đã lưu cấu hình cửa hàng thành công' });
});

// First-time Setup Wizard endpoint
router.post('/setup', authenticateToken, requireOwner, (req, res) => {
  const {
    store_name,
    slogan,
    phone,
    address,
    zalo,
    opening_hours,
    bank_name,
    bank_account,
    bank_owner,
    allow_pickup,
    allow_delivery,
    prep_time_min,
    prep_time_max
  } = req.body;

  const updateStmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP');
  const syncSql = 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP';

  const setupData = [];
  const transaction = db.transaction(() => {
    if (store_name) { updateStmt.run('store_name', store_name); setupData.push(['store_name', store_name]); }
    if (slogan) { updateStmt.run('slogan', slogan); setupData.push(['slogan', slogan]); }
    if (phone) { updateStmt.run('phone', phone); setupData.push(['phone', phone]); }
    if (address) { updateStmt.run('address', address); setupData.push(['address', address]); }
    if (zalo) { updateStmt.run('zalo', zalo); setupData.push(['zalo', zalo]); }
    if (opening_hours) {
      const ohStr = typeof opening_hours === 'object' ? JSON.stringify(opening_hours) : opening_hours;
      updateStmt.run('opening_hours', ohStr); setupData.push(['opening_hours', ohStr]);
    }
    if (bank_name) { updateStmt.run('bank_name', bank_name); setupData.push(['bank_name', bank_name]); }
    if (bank_account) { updateStmt.run('bank_account', bank_account); setupData.push(['bank_account', bank_account]); }
    if (bank_owner) { updateStmt.run('bank_owner', bank_owner); setupData.push(['bank_owner', bank_owner]); }
    if (allow_pickup !== undefined) { const v = allow_pickup ? '1' : '0'; updateStmt.run('allow_pickup', v); setupData.push(['allow_pickup', v]); }
    if (allow_delivery !== undefined) { const v = allow_delivery ? '1' : '0'; updateStmt.run('allow_delivery', v); setupData.push(['allow_delivery', v]); }
    if (prep_time_min) { updateStmt.run('prep_time_min', String(prep_time_min)); setupData.push(['prep_time_min', String(prep_time_min)]); }
    if (prep_time_max) { updateStmt.run('prep_time_max', String(prep_time_max)); setupData.push(['prep_time_max', String(prep_time_max)]); }
    updateStmt.run('is_configured', '1'); setupData.push(['is_configured', '1']);
    updateStmt.run('is_online_ordering_enabled', '1'); setupData.push(['is_online_ordering_enabled', '1']);
  });

  transaction();

  // Sync all setup data to Turso Cloud
  for (const [key, value] of setupData) {
    syncWriteToCloud(syncSql, [key, value]);
  }

  db.prepare('INSERT INTO audit_logs (username, action, details) VALUES (?, ?, ?)')
    .run(req.user.username, 'Hoàn thành trình thiết lập ban đầu (Setup Wizard)', 'Khởi tạo thông tin kinh doanh chính thức');

  res.json({ success: true, message: 'Thiết lập ban đầu hoàn tất! Website đã sẵn sàng nhận đơn.' });
});

// Delivery Zones
router.get('/zones', (req, res) => {
  const zones = db.prepare('SELECT * FROM delivery_zones WHERE is_active = 1 ORDER BY id ASC').all();
  res.json(zones);
});

router.post('/zones', authenticateToken, requireOwner, (req, res) => {
  const { zone_name, fee, min_order, estimated_time } = req.body;
  if (!zone_name || fee === undefined) {
    return res.status(400).json({ error: 'Tên khu vực và phí giao là bắt buộc' });
  }
  const result = db.prepare('INSERT INTO delivery_zones (zone_name, fee, min_order, estimated_time) VALUES (?, ?, ?, ?)').run(
    zone_name,
    parseInt(fee) || 0,
    parseInt(min_order) || 0,
    estimated_time || '20-30 phút'
  );
  syncWriteToCloud('INSERT INTO delivery_zones (id, zone_name, fee, min_order, estimated_time) VALUES (?, ?, ?, ?, ?)', [
    result.lastInsertRowid, zone_name, parseInt(fee) || 0, parseInt(min_order) || 0, estimated_time || '20-30 phút'
  ]);
  res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/zones/:id', authenticateToken, requireOwner, (req, res) => {
  const { id } = req.params;
  const { zone_name, fee, min_order, estimated_time, is_active } = req.body;
  db.prepare(`
    UPDATE delivery_zones 
    SET zone_name = ?, fee = ?, min_order = ?, estimated_time = ?, is_active = ?
    WHERE id = ?
  `).run(
    zone_name,
    parseInt(fee) || 0,
    parseInt(min_order) || 0,
    estimated_time || '20-30 phút',
    is_active ? 1 : 0,
    id
  );
  syncWriteToCloud(
    'UPDATE delivery_zones SET zone_name = ?, fee = ?, min_order = ?, estimated_time = ?, is_active = ? WHERE id = ?',
    [zone_name, parseInt(fee) || 0, parseInt(min_order) || 0, estimated_time || '20-30 phút', is_active ? 1 : 0, id]
  );
  res.json({ success: true });
});

router.delete('/zones/:id', authenticateToken, requireOwner, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM delivery_zones WHERE id = ?').run(id);
  syncWriteToCloud('DELETE FROM delivery_zones WHERE id = ?', [id]);
  res.json({ success: true });
});

module.exports = router;
