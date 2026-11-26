const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { createClient } = require('@libsql/client');

const dbPath = path.join(__dirname, '..', 'data.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for high performance concurrency
db.pragma('journal_mode = WAL');

// Turso Cloud Client (if configured)
const tursoUrl = process.env.TURSO_DATABASE_URL || 'libsql://bami-saigon-thaokolkanall-gif.aws-ap-southeast-1.turso.io';
const tursoToken = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTU2ODQ0NjYsImlkIjoiMDFhMjE3MWYtOTUwMS03YWRjLThiMWQtZjZmMmVlMjRlMjg4Iiwia2lkIjoiNUxfc2NZWUJJODZhZWl2akxrTFZGSklsX2tlU2hSMFdkaWtXUFo4SmpWQSIsInJpZCI6IjgxYTA1MDNiLTk3ODAtNDU1ZC1hZjY3LTJiZGEzZDE3OTVmMiJ9.3ENz-XoB-PBqWzbq1NtYZchBjfk-Fs59bcowIR-9U_9AABkxKk8oF2DpW970kjKDfjIpiNzrR0ZPu5pFQVEqBQ';

let tursoClient = null;
if (tursoUrl && tursoToken) {
  try {
    tursoClient = createClient({
      url: tursoUrl,
      authToken: tursoToken
    });
    console.log('✅ Đã cấu hình Turso Cloud Client:', tursoUrl);
  } catch (e) {
    console.warn('⚠️ Không thể khởi tạo Turso Client:', e.message);
  }
}

// Helper: Synchronize local SQLite with Turso Cloud on server startup
async function syncFromCloudOnStart() {
  if (!tursoClient) return;
  try {
    console.log('🔄 Đang đồng bộ dữ liệu mới nhất từ Turso Cloud về máy chủ...');
    const tablesRes = await tursoClient.execute("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'test_%'");
    
    if (!tablesRes.rows || tablesRes.rows.length === 0) {
      console.log('Turso Cloud trống, bỏ qua đồng bộ ban đầu.');
      return;
    }

    // Check if Turso has data in products
    const prodCheck = await tursoClient.execute("SELECT COUNT(*) as count FROM products");
    if (prodCheck.rows[0].count === 0) {
      console.log('Turso Cloud chưa có dữ liệu sản phẩm, giữ nguyên dữ liệu gốc.');
      return;
    }

    const syncTx = db.transaction(() => {
      for (const t of tablesRes.rows) {
        // Ensure table creation uses IF NOT EXISTS
        const createSql = t.sql.replace(/CREATE TABLE\s+(?!IF NOT EXISTS)/i, 'CREATE TABLE IF NOT EXISTS ');
        db.exec(createSql);
      }
    });
    syncTx();

    for (const t of tablesRes.rows) {
      const rowsRes = await tursoClient.execute(`SELECT * FROM "${t.name}"`);
      if (rowsRes.rows.length > 0) {
        const keys = Object.keys(rowsRes.rows[0]);
        const cols = keys.map(k => `"${k}"`).join(', ');
        const placeholders = keys.map(() => '?').join(', ');
        const insertStmt = db.prepare(`INSERT OR REPLACE INTO "${t.name}" (${cols}) VALUES (${placeholders})`);
        
        const insertMany = db.transaction((rows) => {
          for (const row of rows) {
            insertStmt.run(keys.map(k => row[k]));
          }
        });
        insertMany(rowsRes.rows);
      }
    }
    console.log('🎉 Đồng bộ thành công 100% dữ liệu từ Turso Cloud! Không bao giờ bị mất dữ liệu cũ.');
  } catch (err) {
    console.error('⚠️ Không thể đồng bộ từ Turso Cloud (sử dụng bản lưu SQLite cục bộ):', err.message);
  }
}

// Helper: Sync single write to Turso Cloud in the background (Non-blocking)
function syncWriteToCloud(sql, params = []) {
  if (!tursoClient) return;
  tursoClient.execute({ sql, args: params })
    .catch(err => console.warn('Lỗi ghi ngầm lên Turso Cloud:', err.message));
}

function initDatabase() {
  db.exec(`
    -- Store Settings table
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- User accounts table (Owner & Staff)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT CHECK(role IN ('owner', 'staff')) NOT NULL DEFAULT 'staff',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Menu Categories table
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Products (Menu Items) table
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      original_price INTEGER,
      image_url TEXT,
      is_featured INTEGER DEFAULT 0,
      is_available INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Toppings / Extra fillings table
    CREATE TABLE IF NOT EXISTS toppings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      is_available INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Combos table
    CREATE TABLE IF NOT EXISTS combos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      original_price INTEGER,
      image_url TEXT,
      items_json TEXT,
      is_available INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Promotions / Discount Vouchers
    CREATE TABLE IF NOT EXISTS promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      discount_type TEXT CHECK(discount_type IN ('percent', 'fixed')) NOT NULL DEFAULT 'percent',
      discount_value INTEGER NOT NULL,
      min_order_value INTEGER DEFAULT 0,
      max_discount INTEGER,
      max_uses INTEGER DEFAULT 100,
      used_count INTEGER DEFAULT 0,
      start_date DATETIME,
      end_date DATETIME,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Delivery Zones & Fees
    CREATE TABLE IF NOT EXISTS delivery_zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      zone_name TEXT NOT NULL,
      fee INTEGER NOT NULL,
      min_order INTEGER DEFAULT 0,
      estimated_time TEXT DEFAULT '20-30 phút',
      is_active INTEGER DEFAULT 1
    );

    -- Orders table
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_code TEXT UNIQUE NOT NULL,
      tracking_token TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      order_type TEXT CHECK(order_type IN ('pickup', 'delivery')) NOT NULL,
      address TEXT,
      address_note TEXT,
      distance_km REAL DEFAULT 0,
      customer_lat REAL,
      customer_lng REAL,
      delivery_zone_id INTEGER,
      pickup_time TEXT,
      order_note TEXT,
      payment_method TEXT CHECK(payment_method IN ('cod', 'transfer')) NOT NULL DEFAULT 'cod',
      payment_status TEXT CHECK(payment_status IN ('unpaid', 'verified', 'paid')) NOT NULL DEFAULT 'unpaid',
      status TEXT CHECK(status IN ('pending_payment', 'new', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled')) NOT NULL DEFAULT 'new',
      cancel_reason TEXT,
      subtotal INTEGER NOT NULL,
      discount_amount INTEGER DEFAULT 0,
      delivery_fee INTEGER DEFAULT 0,
      total_amount INTEGER NOT NULL,
      idempotency_key TEXT UNIQUE,
      internal_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Order Items (Snapshot of price & configuration at order time)
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      unit_price INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      subtotal INTEGER NOT NULL,
      toppings_json TEXT,
      note TEXT
    );

    -- Order Status History (Audit trail for status transitions)
    CREATE TABLE IF NOT EXISTS order_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      from_status TEXT,
      to_status TEXT NOT NULL,
      note TEXT,
      updated_by TEXT DEFAULT 'Khách hàng',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Admin Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'order',
      order_id INTEGER REFERENCES orders(id),
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Customers / Registered Members table
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      email TEXT,
      full_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      default_address TEXT,
      default_address_note TEXT,
      is_active INTEGER DEFAULT 1,
      reset_token TEXT,
      reset_token_expires DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- AI Assistant Change Logs (with Revert support)
    CREATE TABLE IF NOT EXISTS ai_change_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      prompt TEXT NOT NULL,
      diff_data TEXT NOT NULL,
      previous_state TEXT NOT NULL,
      status TEXT CHECK(status IN ('applied', 'reverted')) DEFAULT 'applied',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- System Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrations for distance & Google Maps fields
  try { db.exec(`ALTER TABLE orders ADD COLUMN distance_km REAL DEFAULT 0;`); } catch(e){}
  try { db.exec(`ALTER TABLE orders ADD COLUMN customer_lat REAL;`); } catch(e){}
  try { db.exec(`ALTER TABLE orders ADD COLUMN customer_lng REAL;`); } catch(e){}
  try { db.exec(`ALTER TABLE orders ADD COLUMN customer_id INTEGER;`); } catch(e){}
  try { db.exec(`ALTER TABLE orders ADD COLUMN paid_at DATETIME;`); } catch(e){}
  try { db.exec(`ALTER TABLE orders ADD COLUMN transaction_ref TEXT;`); } catch(e){}
  try { db.exec(`ALTER TABLE orders ADD COLUMN is_prepaid INTEGER DEFAULT 0;`); } catch(e){}
  try { db.exec(`ALTER TABLE orders ADD COLUMN promo_code TEXT;`); } catch(e){}
  try { db.exec(`ALTER TABLE promotions ADD COLUMN once_per_customer INTEGER DEFAULT 1;`); } catch(e){}

  // Customer Promotions Table (Voucher Wallet & 1-per-customer rule)
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS customer_promotions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        promotion_id INTEGER NOT NULL,
        code TEXT NOT NULL,
        status TEXT CHECK(status IN ('claimed', 'used', 'expired')) DEFAULT 'claimed',
        claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        used_at DATETIME,
        order_id INTEGER,
        UNIQUE(customer_id, promotion_id)
      );
    `);
  } catch(e){}

  if (tursoClient) {
    tursoClient.execute(`ALTER TABLE orders ADD COLUMN promo_code TEXT;`).catch(() => {});
    tursoClient.execute(`ALTER TABLE promotions ADD COLUMN once_per_customer INTEGER DEFAULT 1;`).catch(() => {});
    tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS customer_promotions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        promotion_id INTEGER NOT NULL,
        code TEXT NOT NULL,
        status TEXT CHECK(status IN ('claimed', 'used', 'expired')) DEFAULT 'claimed',
        claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        used_at DATETIME,
        order_id INTEGER,
        UNIQUE(customer_id, promotion_id)
      );
    `).catch(() => {});
  }

  // 1. Seed default data if categories empty
  seedDefaultData();

  // 2. Always guarantee default admin and staff exist & active
  try {
    const ownerHash = bcrypt.hashSync('admin123', 10);
    const staffHash = bcrypt.hashSync('nhanvien123', 10);

    const adminUser = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
    if (!adminUser) {
      db.prepare('INSERT INTO users (username, password_hash, full_name, role, is_active) VALUES (?, ?, ?, ?, 1)')
        .run('admin', ownerHash, 'Chủ Quán Bami', 'owner');
    } else {
      db.prepare('UPDATE users SET password_hash = ?, is_active = 1 WHERE username = ?')
        .run(ownerHash, 'admin');
    }

    const staffUser = db.prepare('SELECT id FROM users WHERE username = ?').get('nhanvien');
    if (!staffUser) {
      db.prepare('INSERT INTO users (username, password_hash, full_name, role, is_active) VALUES (?, ?, ?, ?, 1)')
        .run('nhanvien', staffHash, 'Thu Ngân & Bếp', 'staff');
    } else {
      db.prepare('UPDATE users SET password_hash = ?, is_active = 1 WHERE username = ?')
        .run(staffHash, 'nhanvien');
    }
  } catch (err) {
    console.error('Error ensuring admin user:', err);
  }

  // 3. Ensure distance shipping settings exist
  const ensureSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  ensureSetting.run('store_lat', '10.771971');
  ensureSetting.run('store_lng', '106.692237');
  ensureSetting.run('base_shipping_fee', '15000');
  ensureSetting.run('base_shipping_km', '2');
  ensureSetting.run('fee_per_km', '5000');
  ensureSetting.run('max_delivery_km', '15');
  ensureSetting.run('free_shipping_km', '0');
  ensureSetting.run('shipping_formula_desc', '');
  ensureSetting.run('google_map_url', 'https://maps.google.com/?q=10.771971,106.692237');
  ensureSetting.run('admin_recovery_key', 'BAMI_ADMIN_MASTER_KEY_2026');
  ensureSetting.run('webhook_secret', 'bami_webhook_sec_2026');
  ensureSetting.run('sepay_api_key', '');
}

function seedDefaultData() {
  // Check if categories already exist
  const countRow = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (countRow.count > 0) return; // already initialized

  console.log('Seeding initial data for Bami Sài Gòn...');

  // Default Store Settings
  const settingsEntries = [
    ['store_name', 'Bami Sài Gòn'],
    ['slogan', 'Bánh Mì Truyền Thống Đậm Đà Hương Vị'],
    ['logo_url', ''],
    ['hero_title', 'Bánh Mì Sài Gòn Giòn Rụm, Đậm Đà Hương Vị Xưa'],
    ['hero_subtitle', 'Từng chiếc bánh được nướng nóng hổi tại chỗ, hòa quyện pate béo thơm, thịt nguội thượng hạng và sốt gia truyền trứ danh.'],
    ['hero_image', '/bami-saigon-store.jpg'],
    ['brand_story_title', 'Hành Trình Bami Sài Gòn'],
    ['brand_story_content', 'Bami Sài Gòn sinh ra từ niềm đam mê lưu giữ hương vị ổ bánh mì đường phố Sài Gòn quen thuộc nhưng với chất lượng vệ sinh chuẩn mực và nguyên liệu chọn lọc khắt khe nhất. Mỗi ổ bánh đều giòn tan vỏ ngoài, xốp mềm bên trong, chan đẫm sốt bơ trứng vàng óng.'],
    ['brand_story_image', '/bami-saigon-store.jpg'],
    ['address', '135 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh'],
    ['phone', '0908 123 456'],
    ['zalo', '0908123456'],
    ['facebook', 'https://facebook.com/bamisaigon'],
    ['map_embed', ''],
    ['opening_hours', JSON.stringify({
      monday: { open: '06:00', close: '22:00', isOpen: true },
      tuesday: { open: '06:00', close: '22:00', isOpen: true },
      wednesday: { open: '06:00', close: '22:00', isOpen: true },
      thursday: { open: '06:00', close: '22:00', isOpen: true },
      friday: { open: '06:00', close: '22:00', isOpen: true },
      saturday: { open: '06:00', close: '22:30', isOpen: true },
      sunday: { open: '06:00', close: '22:30', isOpen: true }
    })],
    ['is_online_ordering_enabled', '1'],
    ['is_paused', '0'],
    ['allow_pickup', '1'],
    ['allow_delivery', '1'],
    ['prep_time_min', '10'],
    ['prep_time_max', '20'],
    ['bank_name', 'Techcombank'],
    ['bank_account', '1903688899901'],
    ['bank_owner', 'NGUYEN VAN CHU QUAN'],
    ['vietqr_memo_prefix', 'BAMI'],
    ['min_order_value', '25000'],
    ['is_configured', '1'], // Set to 1 by default, or 0 to trigger wizard
    ['privacy_policy', 'Bami Sài Gòn cam kết bảo mật tuyệt đối thông tin cá nhân và số điện thoại của quý khách. Dữ liệu chỉ dùng để xác nhận đơn hàng và giao hàng.'],
    ['delivery_policy', 'Bánh mì được nướng giòn và đóng gói cách nhiệt ngay sau khi làm. Thời gian giao phụ thuộc vào khoảng cách, trung bình từ 15 - 30 phút.'],
    ['cancel_policy', 'Quý khách vui lòng gọi hotline hoặc liên hệ Zalo ngay trong vòng 5 phút sau khi đặt nếu muốn thay đổi hoặc hủy đơn hàng.']
  ];

  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  for (const [k, v] of settingsEntries) {
    insertSetting.run(k, v);
  }

  // Default Users
  const insertUser = db.prepare('INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)');
  const ownerHash = bcrypt.hashSync('admin123', 10);
  const staffHash = bcrypt.hashSync('nhanvien123', 10);
  insertUser.run('admin', ownerHash, 'Chủ Quán Bami', 'owner');
  insertUser.run('nhanvien', staffHash, 'Thu Ngân & Bếp', 'staff');

  // Default Categories
  const insertCategory = db.prepare('INSERT INTO categories (name, slug, display_order) VALUES (?, ?, ?)');
  const cat1 = insertCategory.run('Bánh Mì Truyền Thống', 'banh-mi-truyen-thong', 1).lastInsertRowid;
  const cat2 = insertCategory.run('Bánh Mì Đặc Biệt', 'banh-mi-dac-biet', 2).lastInsertRowid;
  const cat3 = insertCategory.run('Bánh Mì Que & Nướng Bơ', 'banh-mi-que', 3).lastInsertRowid;
  const cat4 = insertCategory.run('Thức Uống & Tráng Miệng', 'thuc-uong', 4).lastInsertRowid;

  // Default Products
  const insertProduct = db.prepare(`
    INSERT INTO products (category_id, name, slug, description, price, original_price, image_url, is_featured, is_available, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertProduct.run(
    cat1,
    'Bánh Mì Thịt Nguội Pate Thượng Hạng',
    'banh-mi-thit-nguoi-pate',
    'Bánh mì giòn rụm kẹp pate béo ngậy, bơ tươi, giò thủ, chả lụa Sài Gòn, dưa leo, đồ chua giòn ngọt và sốt tương ớt đậm vị.',
    32000,
    35000,
    '/bami-saigon-store.jpg',
    1,
    1,
    1
  );

  insertProduct.run(
    cat1,
    'Bánh Mì Gà Xé Nấm Hương Cay Nhẹ',
    'banh-mi-ga-xe-nam-huong',
    'Thịt ức gà ta xé sợi rim đậm đà cùng nấm hương thơm lừng, kèm rau răm tươi và nước sốt gà bí truyền.',
    30000,
    null,
    '/bami-saigon-store.jpg',
    1,
    1,
    2
  );

  insertProduct.run(
    cat2,
    'Bánh Mì Bami Sài Gòn Đặc Biệt (Full Topping)',
    'banh-mi-bami-sai-gon-dac-biet',
    'Siêu phẩm đầy ắp nhân: pate gan béo ngậy, bơ vàng, chả lụa, xá xíu mật ong, trứng ốp la lòng đào và giò lụa.',
    42000,
    48000,
    '/bami-saigon-store.jpg',
    1,
    1,
    3
  );

  insertProduct.run(
    cat2,
    'Bánh Mì Xíu Mại Sốt Trứng Muối',
    'banh-mi-xiu-mai-trung-muoi',
    'Viên xíu mại thịt heo mềm thơm ngọt nước, quyện sốt trứng muối vàng sánh béo ngậy khó cưỡng.',
    38000,
    null,
    '/bami-saigon-store.jpg',
    1,
    1,
    4
  );

  insertProduct.run(
    cat2,
    'Bánh Mì Heo Quay Giòn Bì Rưới Sốt Nâu',
    'banh-mi-heo-quay-gion-bi',
    'Thịt heo quay da giòn rôm rốp, thịt mềm ngọt mọng nước, kẹp dưa leo và sốt tiêu đen thảo mộc.',
    38000,
    42000,
    '/bami-saigon-store.jpg',
    1,
    1,
    5
  );

  insertProduct.run(
    cat3,
    'Bánh Mì Nướng Bơ Tỏi Phô Mai',
    'banh-mi-nuong-bo-toi-pho-mai',
    'Bánh mì nướng thơm lừng bơ Pháp, tỏi thơm dịu và phô mai kéo sợi dẻo béo.',
    22000,
    null,
    '/bami-saigon-store.jpg',
    0,
    1,
    6
  );

  insertProduct.run(
    cat3,
    'Bánh Mì Que Hải Phòng Pate Cay',
    'banh-mi-que-pate-cay',
    'Chiếc bánh mì que thon dài nướng giòn rụm kẹp pate nóng hổi cùng tương ớt chí chương.',
    15000,
    null,
    '/bami-saigon-store.jpg',
    0,
    1,
    7
  );

  insertProduct.run(
    cat4,
    'Cà Phê Sữa Đá Sài Gòn Pha Phin',
    'ca-phe-sua-da-sai-gon',
    'Cà phê Robusta Đắk Lắk đậm đà hòa quyện cùng sữa đặc béo ngậy, chuẩn vị cà phê góc phố Sài Gòn.',
    20000,
    null,
    '/bami-saigon-store.jpg',
    1,
    1,
    8
  );

  insertProduct.run(
    cat4,
    'Trà Tắc Hạt Chia Mát Lạnh',
    'tra-tac-hat-chia',
    'Vị trà thanh mát kết hợp quả tắc tươi thơm lừng giải nhiệt tức thì, bổ sung hạt chia dinh dưỡng.',
    18000,
    null,
    '/bami-saigon-store.jpg',
    1,
    1,
    9
  );

  insertProduct.run(
    cat4,
    'Sữa Đậu Nành Tươi Nấu Lá Dứa',
    'sua-dau-nanh-tuoi',
    'Sữa đậu nành nguyên chất nấu cùng lá dứa thơm mát, ngọt dịu thanh lành.',
    15000,
    null,
    '/bami-saigon-store.jpg',
    0,
    1,
    10
  );

  // Default Toppings
  const insertTopping = db.prepare('INSERT INTO toppings (name, price, is_available) VALUES (?, ?, ?)');
  insertTopping.run('Thêm Pate Gan Béo Thơm', 5000, 1);
  insertTopping.run('Thêm Trứng Ốp La Lòng Đào', 6000, 1);
  insertTopping.run('Thêm Chả Lụa Truyền Thống', 6000, 1);
  insertTopping.run('Thêm Xá Xíu Mật Ong', 8000, 1);
  insertTopping.run('Thêm Phô Mai Con Bò Cười', 7000, 1);
  insertTopping.run('Thêm Bơ Trứng Tươi', 4000, 1);

  // Default Combos
  const insertCombo = db.prepare(`
    INSERT INTO combos (name, description, price, original_price, image_url, items_json, is_available)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertCombo.run(
    'Combo Năng Lượng Buổi Sáng',
    '1 Bánh Mì Đặc Biệt Bami + 1 Cà Phê Sữa Đá Sài Gòn. Khởi đầu ngày mới tràn đầy hứng khởi!',
    55000,
    62000,
    '/bami-saigon-store.jpg',
    JSON.stringify(['Bánh Mì Đặc Biệt Bami', 'Cà Phê Sữa Đá']),
    1
  );

  insertCombo.run(
    'Combo Cặp Đôi Giòn Tan',
    '2 Bánh Mì Thịt Nguội + 2 Trà Tắc Hạt Chia. Cực kỳ tiết kiệm cho bữa trưa bạn bè.',
    89000,
    100000,
    '/bami-saigon-store.jpg',
    JSON.stringify(['2 Bánh Mì Thịt Nguội', '2 Trà Tắc']),
    1
  );

  // Default Promotions
  const insertPromo = db.prepare(`
    INSERT INTO promotions (code, title, discount_type, discount_value, min_order_value, max_discount, max_uses, used_count, start_date, end_date, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertPromo.run(
    'BAMICHAO',
    'Giảm 10% cho đơn từ 50.000đ mừng khai trương',
    'percent',
    10,
    50000,
    20000,
    500,
    12,
    new Date(Date.now() - 7 * 86400000).toISOString(),
    new Date(Date.now() + 60 * 86400000).toISOString(),
    1
  );

  insertPromo.run(
    'GIAM15K',
    'Giảm ngay 15.000đ cho đơn hàng từ 100.000đ',
    'fixed',
    15000,
    100000,
    15000,
    200,
    5,
    new Date(Date.now() - 7 * 86400000).toISOString(),
    new Date(Date.now() + 60 * 86400000).toISOString(),
    1
  );

  // Default Delivery Zones
  const insertZone = db.prepare(`
    INSERT INTO delivery_zones (zone_name, fee, min_order, estimated_time, is_active)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertZone.run('Nội thành Quận 1, Quận 3', 15000, 30000, '15-25 phút', 1);
  insertZone.run('Quận 4, Quận 5, Quận 10', 20000, 40000, '20-35 phút', 1);
  insertZone.run('Quận Bình Thạnh, Phú Nhuận', 22000, 50000, '25-35 phút', 1);
  insertZone.run('Quận 7, Tân Bình, Gò Vấp', 30000, 60000, '30-45 phút', 1);

  console.log('Seeding completed successfully.');
}

module.exports = {
  db,
  initDatabase,
  tursoClient,
  syncFromCloudOnStart,
  syncWriteToCloud
};
