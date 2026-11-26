const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, requireOwner } = require('../middleware/auth');
const { db, syncWriteToCloud } = require('../db');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'bami-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif|svg/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) {
    return cb(null, true);
  }
  cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, webp, gif, svg)'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
});

router.post('/', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Không tìm thấy file ảnh tải lên' });
  }

  try {
    // Đọc file ảnh vừa upload và mã hóa base64 để bảo toàn vĩnh viễn trên Turso Cloud
    const fileBuffer = fs.readFileSync(req.file.path);
    const base64Data = fileBuffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';

    // 1. Lưu vào SQLite cục bộ
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO uploaded_images (filename, mime_type, data_base64)
      VALUES (?, ?, ?)
    `);
    stmt.run(req.file.filename, mimeType, base64Data);

    // 2. Đồng bộ ngay lập tức lên Turso Cloud (Không bao giờ bị mất khi redeploy code)
    syncWriteToCloud(
      'INSERT OR REPLACE INTO uploaded_images (filename, mime_type, data_base64) VALUES (?, ?, ?)',
      [req.file.filename, mimeType, base64Data]
    );
  } catch (saveErr) {
    console.warn('Lỗi lưu ảnh lên đám mây Turso:', saveErr.message);
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: imageUrl, filename: req.file.filename });
});

module.exports = router;
