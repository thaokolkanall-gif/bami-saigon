require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDatabase, db } = require('./db');

// Initialize database schema & seeds
initDatabase();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads directory
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
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
});
