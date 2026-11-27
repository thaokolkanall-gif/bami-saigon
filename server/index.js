require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDatabase, db, syncFromCloudOnStart, backupAllToCloud } = require('./db');

// Initialize database schema & seeds
initDatabase();

// Sync latest state from Turso Cloud on startup (Ensures data is NEVER lost when redeployed or edited)
syncFromCloudOnStart().then(() => {
  console.log('⚡ Turso Cloud Sync ready.');
});

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads directory with Turso Cloud permanent storage fallback
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Phục vụ tệp ảnh tải lên với cơ chế bảo vệ kép:
// 1. Nếu file đã có trong thư mục uploads/ -> phục vụ ngay từ ổ đĩa
// 2. Nếu file chưa có trên ổ đĩa (do Render vừa redeploy hoặc restart) -> đọc từ Turso Cloud / SQLite, ghi cache lại ổ đĩa và trả về ngay
app.get('/uploads/:filename', (req, res, next) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(uploadDir, filename);

  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }

  try {
    const row = db.prepare('SELECT mime_type, data_base64 FROM uploaded_images WHERE filename = ?').get(filename);
    if (row && row.data_base64) {
      const imgBuffer = Buffer.from(row.data_base64, 'base64');
      try {
        fs.writeFileSync(filePath, imgBuffer);
      } catch (e) {}
      res.setHeader('Content-Type', row.mime_type || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.send(imgBuffer);
    }
  } catch (err) {
    console.warn('Lỗi đọc ảnh từ cơ sở dữ liệu đám mây:', err.message);
  }

  next();
});

app.use('/uploads', express.static(uploadDir));

// Also serve public files (e.g. initial images)
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/store', require('./routes/store'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/promotions', require('./routes/promotions'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/lucky-wheel', require('./routes/lucky-wheel'));
app.use('/api/admin/ai', require('./routes/ai'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/v1', require('./routes/app-api'));

// Audit logs route
const { authenticateToken, requireOwner } = require('./middleware/auth');
app.get('/api/admin/audit-logs', authenticateToken, requireOwner, (req, res) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 50').all();
  res.json(logs);
});

// Serve frontend in production (Vite dist)
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🥖 Bami Sài Gòn Backend Server is running!`);
  console.log(`🚀 Port: ${PORT}`);
  console.log(`🌐 Local API: http://localhost:${PORT}/api/store/settings`);
  console.log(`=========================================`);

  // Tự động sao lưu toàn bộ dữ liệu ngầm lên Turso Cloud mỗi 3 phút (Lớp bảo vệ dữ liệu vĩnh viễn)
  setInterval(() => {
    backupAllToCloud().then(count => {
      if (count > 0) console.log(`💾 [Tự động sao lưu] Đã bảo toàn ${count} bản ghi dữ liệu lên Turso Cloud.`);
    }).catch(() => {});
  }, 3 * 60 * 1000);
});

// Xử lý bảo toàn 100% dữ liệu trước khi Render tắt / cập nhật máy chủ
const handleGracefulShutdown = async (signal) => {
  console.log(`⚡ [${signal}] Máy chủ chuẩn bị cập nhật / tắt. Đang sao lưu toàn bộ dữ liệu lên Turso Cloud...`);
  try {
    const count = await backupAllToCloud();
    console.log(`✅ [Bảo toàn dữ liệu thành công] Đã lưu ${count} bản ghi lên Turso Cloud an toàn.`);
  } catch (err) {
    console.error('Lỗi sao lưu trước khi tắt:', err);
  }
  process.exit(0);
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
