const express = require('express');
const { db, syncWriteToCloud } = require('../db');
const { authenticateToken, requireOwner } = require('../middleware/auth');

const router = express.Router();

// Helper to slugify
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'item-' + Date.now();
}

// Public: Get all active categories, products, toppings, combos
router.get('/', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order ASC, id ASC').all();
  const products = db.prepare('SELECT * FROM products ORDER BY display_order ASC, id ASC').all();
  const toppings = db.prepare('SELECT * FROM toppings WHERE is_available = 1 ORDER BY id ASC').all();
  const combos = db.prepare('SELECT * FROM combos WHERE is_available = 1 ORDER BY id ASC').all();

  res.json({
    categories,
    products,
    toppings,
    combos
  });
});

// Admin: Categories
router.get('/categories', authenticateToken, (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY display_order ASC, id ASC').all();
  res.json(categories);
});

router.post('/categories', authenticateToken, requireOwner, (req, res) => {
  const { name, display_order } = req.body;
  if (!name) return res.status(400).json({ error: 'Tên danh mục là bắt buộc' });
  const slug = slugify(name);
  const finalSlug = slug + '-' + Date.now().toString().slice(-4);
  const orderNum = parseInt(display_order) || 0;
  const result = db.prepare('INSERT INTO categories (name, slug, display_order) VALUES (?, ?, ?)').run(
    name,
    finalSlug,
    orderNum
  );
  syncWriteToCloud('INSERT OR REPLACE INTO categories (id, name, slug, display_order) VALUES (?, ?, ?, ?)', [result.lastInsertRowid, name, finalSlug, orderNum]);
  res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/categories/:id', authenticateToken, requireOwner, (req, res) => {
  const { id } = req.params;
  const { name, display_order, is_active } = req.body;
  const orderNum = parseInt(display_order) || 0;
  const activeNum = is_active ? 1 : 0;
  db.prepare('UPDATE categories SET name = ?, display_order = ?, is_active = ? WHERE id = ?').run(
    name,
    orderNum,
    activeNum,
    id
  );
  syncWriteToCloud('UPDATE categories SET name = ?, display_order = ?, is_active = ? WHERE id = ?', [name, orderNum, activeNum, id]);
  res.json({ success: true });
});

router.delete('/categories/:id', authenticateToken, requireOwner, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  syncWriteToCloud('DELETE FROM categories WHERE id = ?', [id]);
  res.json({ success: true });
});

// Admin: Products
router.post('/products', authenticateToken, requireOwner, (req, res) => {
  const { category_id, name, description, price, original_price, image_url, is_featured, is_available, display_order } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Tên món và giá bán là bắt buộc' });
  }

  const slug = slugify(name) + '-' + Date.now().toString().slice(-4);
  const catId = category_id || null;
  const desc = description || '';
  const pPrice = parseInt(price) || 0;
  const pOrigPrice = original_price ? parseInt(original_price) : null;
  const img = image_url || '/bami-saigon-store.jpg';
  const feat = is_featured ? 1 : 0;
  const avail = is_available !== undefined ? (is_available ? 1 : 0) : 1;
  const ord = parseInt(display_order) || 0;

  const result = db.prepare(`
    INSERT INTO products (category_id, name, slug, description, price, original_price, image_url, is_featured, is_available, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    catId, name, slug, desc, pPrice, pOrigPrice, img, feat, avail, ord
  );

  syncWriteToCloud(`
    INSERT OR REPLACE INTO products (id, category_id, name, slug, description, price, original_price, image_url, is_featured, is_available, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [result.lastInsertRowid, catId, name, slug, desc, pPrice, pOrigPrice, img, feat, avail, ord]);

  db.prepare('INSERT INTO audit_logs (username, action, details) VALUES (?, ?, ?)')
    .run(req.user.username, 'Thêm món mới', `Tên món: ${name}, Giá: ${price}đ`);

  res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/products/:id', authenticateToken, requireOwner, (req, res) => {
  const { id } = req.params;
  const { category_id, name, description, price, original_price, image_url, is_featured, is_available, display_order } = req.body;
  const catId = category_id || null;
  const desc = description || '';
  const pPrice = parseInt(price) || 0;
  const pOrigPrice = original_price ? parseInt(original_price) : null;
  const feat = is_featured ? 1 : 0;
  const avail = is_available ? 1 : 0;
  const ord = parseInt(display_order) || 0;

  db.prepare(`
    UPDATE products 
    SET category_id = ?, name = ?, description = ?, price = ?, original_price = ?, 
        image_url = ?, is_featured = ?, is_available = ?, display_order = ?
    WHERE id = ?
  `).run(
    catId, name, desc, pPrice, pOrigPrice, image_url, feat, avail, ord, id
  );

  syncWriteToCloud(`
    UPDATE products 
    SET category_id = ?, name = ?, description = ?, price = ?, original_price = ?, 
        image_url = ?, is_featured = ?, is_available = ?, display_order = ?
    WHERE id = ?
  `, [catId, name, desc, pPrice, pOrigPrice, image_url, feat, avail, ord, id]);

  db.prepare('INSERT INTO audit_logs (username, action, details) VALUES (?, ?, ?)')
    .run(req.user.username, 'Sửa thông tin món', `Mã món: ${id}, Tên: ${name}`);

  res.json({ success: true });
});

// Quick toggle availability (Staff or Owner can quickly mark out of stock)
router.patch('/products/:id/availability', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { is_available } = req.body;
  const avail = is_available ? 1 : 0;
  db.prepare('UPDATE products SET is_available = ? WHERE id = ?').run(avail, id);
  syncWriteToCloud('UPDATE products SET is_available = ? WHERE id = ?', [avail, id]);
  
  const product = db.prepare('SELECT name FROM products WHERE id = ?').get(id);
  db.prepare('INSERT INTO audit_logs (username, action, details) VALUES (?, ?, ?)')
    .run(req.user.username, 'Cập nhật trạng thái còn/hết hàng', `Món "${product?.name}": ${is_available ? 'Còn hàng' : 'Hết hàng'}`);

  res.json({ success: true });
});

router.delete('/products/:id', authenticateToken, requireOwner, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  syncWriteToCloud('DELETE FROM products WHERE id = ?', [id]);
  res.json({ success: true });
});

// Toppings CRUD
router.post('/toppings', authenticateToken, requireOwner, (req, res) => {
  const { name, price } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Tên topping và giá là bắt buộc' });
  }
  const p = parseInt(price) || 0;
  const result = db.prepare('INSERT INTO toppings (name, price) VALUES (?, ?)').run(name, p);
  syncWriteToCloud('INSERT OR REPLACE INTO toppings (id, name, price) VALUES (?, ?, ?)', [result.lastInsertRowid, name, p]);
  res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/toppings/:id', authenticateToken, requireOwner, (req, res) => {
  const { id } = req.params;
  const { name, price, is_available } = req.body;
  const p = parseInt(price) || 0;
  const avail = is_available ? 1 : 0;
  db.prepare('UPDATE toppings SET name = ?, price = ?, is_available = ? WHERE id = ?').run(
    name, p, avail, id
  );
  syncWriteToCloud('UPDATE toppings SET name = ?, price = ?, is_available = ? WHERE id = ?', [name, p, avail, id]);
  res.json({ success: true });
});

router.delete('/toppings/:id', authenticateToken, requireOwner, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM toppings WHERE id = ?').run(id);
  syncWriteToCloud('DELETE FROM toppings WHERE id = ?', [id]);
  res.json({ success: true });
});

// Combos CRUD
router.post('/combos', authenticateToken, requireOwner, (req, res) => {
  const { name, description, price, original_price, image_url, items_json } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Tên combo và giá là bắt buộc' });
  }
  const desc = description || '';
  const p = parseInt(price) || 0;
  const origP = original_price ? parseInt(original_price) : null;
  const img = image_url || '/bami-saigon-store.jpg';
  const itemsStr = typeof items_json === 'object' ? JSON.stringify(items_json) : (items_json || '[]');

  const result = db.prepare(`
    INSERT INTO combos (name, description, price, original_price, image_url, items_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, desc, p, origP, img, itemsStr);

  syncWriteToCloud(`
    INSERT OR REPLACE INTO combos (id, name, description, price, original_price, image_url, items_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [result.lastInsertRowid, name, desc, p, origP, img, itemsStr]);

  res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/combos/:id', authenticateToken, requireOwner, (req, res) => {
  const { id } = req.params;
  const { name, description, price, original_price, image_url, items_json, is_available } = req.body;
  const desc = description || '';
  const p = parseInt(price) || 0;
  const origP = original_price ? parseInt(original_price) : null;
  const itemsStr = typeof items_json === 'object' ? JSON.stringify(items_json) : (items_json || '[]');
  const avail = is_available ? 1 : 0;

  db.prepare(`
    UPDATE combos 
    SET name = ?, description = ?, price = ?, original_price = ?, image_url = ?, items_json = ?, is_available = ?
    WHERE id = ?
  `).run(name, desc, p, origP, image_url, itemsStr, avail, id);

  syncWriteToCloud(`
    UPDATE combos 
    SET name = ?, description = ?, price = ?, original_price = ?, image_url = ?, items_json = ?, is_available = ?
    WHERE id = ?
  `, [name, desc, p, origP, image_url, itemsStr, avail, id]);

  res.json({ success: true });
});

router.delete('/combos/:id', authenticateToken, requireOwner, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM combos WHERE id = ?').run(id);
  syncWriteToCloud('DELETE FROM combos WHERE id = ?', [id]);
  res.json({ success: true });
});

module.exports = router;
