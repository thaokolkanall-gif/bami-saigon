const express = require('express');
const { db } = require('../db');
const { authenticateToken, requireOwner } = require('../middleware/auth');

const router = express.Router();

// Fallback Vietnamese NLP rule engine
function ruleBasedVietnameseNLP(prompt, storeData) {
  const p = prompt.toLowerCase();
  const proposals = [];
  let explanation = '';

  // 1. Check price change e.g.: "đổi giá bánh mì đặc biệt thành 35.000" or "sửa giá bánh mì pate 30k"
  const priceMatch = p.match(/(?:đổi|sửa|chỉnh|cập nhật|hạ|tăng)\s+giá\s+(.+?)\s+(?:thành|xuống|lên|sang|là)?\s*([0-9.,kK]+)/i);
  if (priceMatch) {
    const rawDishName = priceMatch[1].trim();
    const rawPrice = priceMatch[2].toLowerCase().replace(/k/g, '000').replace(/[.,]/g, '');
    const newPrice = parseInt(rawPrice);

    if (newPrice && newPrice > 0) {
      // Find matching dish
      const dish = storeData.products.find(prod => 
        prod.name.toLowerCase().includes(rawDishName) ||
        rawDishName.split(' ').every(w => prod.name.toLowerCase().includes(w))
      );

      if (dish) {
        proposals.push({
          type: 'product_price',
          target_id: dish.id,
          target_name: dish.name,
          field: 'price',
          current_value: `${dish.price.toLocaleString('vi-VN')}đ`,
          proposed_value: `${newPrice.toLocaleString('vi-VN')}đ`,
          raw_proposed_value: newPrice,
          explanation: `Cập nhật giá bán cho món "${dish.name}" từ ${dish.price.toLocaleString('vi-VN')}đ thành ${newPrice.toLocaleString('vi-VN')}đ.`
        });
        explanation = `Tôi đã tìm thấy món **${dish.name}** và chuẩn bị đề xuất thay đổi giá sang **${newPrice.toLocaleString('vi-VN')}đ**. Vui lòng kiểm tra bảng so sánh bên dưới và nhấn "Áp dụng" để lưu thay đổi.`;
      }
    }
  }

  // 2. Check out of stock or back in stock
  // e.g.: "đánh dấu bánh mì gà hết hàng", "bánh mì thịt nguội đã có hàng lại", "bật lại bánh mì đặc biệt"
  if (proposals.length === 0) {
    const outOfStockMatch = p.match(/(?:đánh dấu|báo|chuyển|set|cài)?\s*(.+?)\s+(?:hết hàng|tạm hết|ngưng bán|hết rồi)/i);
    const inStockMatch = p.match(/(?:mở lại|bật lại|có hàng lại|đánh dấu còn hàng|bán lại)\s*(.+)/i);

    if (outOfStockMatch) {
      const rawDishName = outOfStockMatch[1].replace(/đánh dấu|báo|món/gi, '').trim();
      const dish = storeData.products.find(prod => prod.name.toLowerCase().includes(rawDishName));
      if (dish) {
        proposals.push({
          type: 'product_availability',
          target_id: dish.id,
          target_name: dish.name,
          field: 'is_available',
          current_value: dish.is_available ? 'Còn hàng (Đang mở bán)' : 'Hết hàng',
          proposed_value: 'Hết hàng (Khóa đặt món)',
          raw_proposed_value: 0,
          explanation: `Đánh dấu món "${dish.name}" tạm thời hết hàng.`
        });
        explanation = `Tôi đã ghi nhận yêu cầu tạm ngưng nhận món **${dish.name}**. Khách hàng sẽ thấy nhãn "Hết hàng" và không thể thêm vào giỏ.`;
      }
    } else if (inStockMatch) {
      const rawDishName = inStockMatch[1].replace(/món|bánh mì/gi, '').trim();
      const dish = storeData.products.find(prod => prod.name.toLowerCase().includes(rawDishName));
      if (dish) {
        proposals.push({
          type: 'product_availability',
          target_id: dish.id,
          target_name: dish.name,
          field: 'is_available',
          current_value: dish.is_available ? 'Còn hàng' : 'Hết hàng (Đang khóa)',
          proposed_value: 'Còn hàng (Mở bán bình thường)',
          raw_proposed_value: 1,
          explanation: `Mở bán lại món "${dish.name}".`
        });
        explanation = `Tôi đã chuẩn bị đề xuất mở bán lại món **${dish.name}**. Quý khách có thể đặt món này ngay sau khi áp dụng.`;
      }
    }
  }

  // 3. Opening hours change: e.g. "đổi giờ mở cửa thành 6 giờ đến 22 giờ"
  if (proposals.length === 0) {
    const hoursMatch = p.match(/(?:giờ mở cửa|thời gian mở cửa|đổi giờ).*?(\d{1,2})(?::(\d{2})|\s*h|\s*giờ).*?(?:đến|tới|-).*?(\d{1,2})(?::(\d{2})|\s*h|\s*giờ)/i);
    if (hoursMatch) {
      const openH = hoursMatch[1].padStart(2, '0');
      const openM = (hoursMatch[2] || '00').padStart(2, '0');
      const closeH = hoursMatch[3].padStart(2, '0');
      const closeM = (hoursMatch[4] || '00').padStart(2, '0');

      const newHoursObj = {
        monday: { open: `${openH}:${openM}`, close: `${closeH}:${closeM}`, isOpen: true },
        tuesday: { open: `${openH}:${openM}`, close: `${closeH}:${closeM}`, isOpen: true },
        wednesday: { open: `${openH}:${openM}`, close: `${closeH}:${closeM}`, isOpen: true },
        thursday: { open: `${openH}:${openM}`, close: `${closeH}:${closeM}`, isOpen: true },
        friday: { open: `${openH}:${openM}`, close: `${closeH}:${closeM}`, isOpen: true },
        saturday: { open: `${openH}:${openM}`, close: `${closeH}:${closeM}`, isOpen: true },
        sunday: { open: `${openH}:${openM}`, close: `${closeH}:${closeM}`, isOpen: true }
      };

      proposals.push({
        type: 'store_setting',
        target_id: 'opening_hours',
        target_name: 'Giờ mở cửa toàn bộ tuần',
        field: 'opening_hours',
        current_value: 'Khung giờ hiện tại',
        proposed_value: `${openH}:${openM} - ${closeH}:${closeM} (Cả tuần)`,
        raw_proposed_value: JSON.stringify(newHoursObj),
        explanation: `Cập nhật giờ mở cửa các ngày trong tuần thành ${openH}:${openM} - ${closeH}:${closeM}.`
      });
      explanation = `Tôi đã tạo đề xuất đổi khung giờ mở cửa thành **${openH}:${openM} - ${closeH}:${closeM}** cho tất cả các ngày trong tuần.`;
    }
  }

  // 4. Brand story / Slogan / Hotline
  if (proposals.length === 0) {
    if (p.includes('giới thiệu') || p.includes('câu chuyện')) {
      const shortStory = 'Bami Sài Gòn mang trọn tinh hoa bánh mì truyền thống: ổ bánh nướng giòn rụm, pate béo ngậy gia truyền cùng thịt nguội thượng hạng và sốt bơ trứng đậm đà.';
      proposals.push({
        type: 'store_setting',
        target_id: 'brand_story_content',
        target_name: 'Nội dung câu chuyện thương hiệu',
        field: 'brand_story_content',
        current_value: (storeData.settings.brand_story_content || '').substring(0, 80) + '...',
        proposed_value: shortStory,
        raw_proposed_value: shortStory,
        explanation: 'Viết lại đoạn giới thiệu quán súc tích, hấp dẫn và tập trung vào chất lượng bánh mì.'
      });
      explanation = `Tôi đã soạn lại đoạn giới thiệu quán ngắn gọn, hấp dẫn hơn. Xem chi tiết trong bảng đề xuất bên dưới.`;
    } else if (p.includes('hotline') || p.includes('số điện thoại')) {
      const phoneMatch = p.match(/(?:hotline|số điện thoại|sđt)\s*(?:thành|sang|là)?\s*([0-9\s.]{9,15})/i);
      if (phoneMatch) {
        const newPhone = phoneMatch[1].trim();
        proposals.push({
          type: 'store_setting',
          target_id: 'phone',
          target_name: 'Hotline cửa hàng',
          field: 'phone',
          current_value: storeData.settings.phone || 'Chưa cài',
          proposed_value: newPhone,
          raw_proposed_value: newPhone,
          explanation: `Đổi số hotline liên hệ của quán thành ${newPhone}.`
        });
        explanation = `Tôi đã chuẩn bị đề xuất đổi số hotline liên hệ sang **${newPhone}**.`;
      }
    }
  }

  // Fallback if not recognized
  if (proposals.length === 0) {
    explanation = `Tôi chưa nhận diện rõ món ăn hoặc thông tin bạn muốn chỉnh sửa trong câu: "${prompt}".\n\nBạn có thể thử các mẫu câu sau:\n- *"Đổi giá bánh mì đặc biệt thành 35.000 đồng"*\n- *"Đánh dấu bánh mì gà nấm hương hết hàng hôm nay"*\n- *"Mở bán lại bánh mì que"* \n- *"Đổi giờ mở cửa từ 06:00 đến 22:00"*\n- *"Viết lại đoạn giới thiệu quán ngắn gọn hơn"*`;
  }

  return { explanation, proposals };
}

// 1. Process AI Chat Request
router.post('/chat', authenticateToken, requireOwner, async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập yêu cầu của bạn' });
  }

  // Gather current store snapshot
  const products = db.prepare('SELECT id, name, price, original_price, is_available, is_featured, description FROM products').all();
  const categories = db.prepare('SELECT id, name FROM categories').all();
  const settingsRows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const s of settingsRows) settings[s.key] = s.value;

  const storeData = { products, categories, settings };

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      // Call Google Gemini API
      const systemInstruction = `
Bạn là trợ lý AI thông minh chuyên hỗ trợ Chủ Quán Bami Sài Gòn quản lý website bánh mì.
Chỉ trả về JSON hợp lệ tuân theo schema:
{
  "explanation": "Lời giải thích ngắn gọn, thân thiện bằng tiếng Việt gửi tới chủ quán",
  "proposals": [
    {
      "type": "product_price" | "product_availability" | "store_setting" | "product_desc",
      "target_id": "id món hoặc tên key setting",
      "target_name": "Tên món hoặc tên mục cấu hình",
      "field": "tên trường cần sửa",
      "current_value": "giá trị hiện tại dạng text dễ đọc",
      "proposed_value": "giá trị mới dạng text dễ đọc",
      "raw_proposed_value": "giá trị thô để lưu vào db (số hoặc chuỗi)",
      "explanation": "lý do thay đổi"
    }
  ]
}
Dữ liệu cửa hàng hiện tại:
${JSON.stringify({ products: products.map(p => ({ id: p.id, name: p.name, price: p.price, is_available: p.is_available })), settings })}
Nếu không chắc chắn món nào hoặc yêu cầu chưa rõ, để mảng proposals rỗng và giải thích trong explanation, yêu cầu chủ quán làm rõ.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${systemInstruction}\n\nYêu cầu của chủ quán: "${prompt}"` }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          return res.json({
            success: true,
            source: 'gemini',
            explanation: parsed.explanation,
            proposals: parsed.proposals || []
          });
        }
      }
    } catch (e) {
      console.warn('Gemini API call failed, falling back to local NLP:', e.message);
    }
  }

  // Fallback to Vietnamese NLP rule engine
  const result = ruleBasedVietnameseNLP(prompt, storeData);
  res.json({
    success: true,
    source: 'local_nlp',
    explanation: result.explanation,
    proposals: result.proposals
  });
});

// 2. Apply AI Proposal
router.post('/apply', authenticateToken, requireOwner, (req, res) => {
  const { prompt, proposals } = req.body;
  if (!proposals || !Array.isArray(proposals) || proposals.length === 0) {
    return res.status(400).json({ error: 'Không có thay đổi nào để áp dụng' });
  }

  const previousState = [];

  const transaction = db.transaction(() => {
    for (const prop of proposals) {
      if (prop.type === 'product_price') {
        const current = db.prepare('SELECT id, price FROM products WHERE id = ?').get(prop.target_id);
        if (current) {
          previousState.push({ type: 'product_price', target_id: current.id, old_val: current.price });
          db.prepare('UPDATE products SET price = ? WHERE id = ?').run(parseInt(prop.raw_proposed_value), current.id);
        }
      } else if (prop.type === 'product_availability') {
        const current = db.prepare('SELECT id, is_available FROM products WHERE id = ?').get(prop.target_id);
        if (current) {
          previousState.push({ type: 'product_availability', target_id: current.id, old_val: current.is_available });
          db.prepare('UPDATE products SET is_available = ? WHERE id = ?').run(prop.raw_proposed_value ? 1 : 0, current.id);
        }
      } else if (prop.type === 'store_setting') {
        const current = db.prepare('SELECT key, value FROM settings WHERE key = ?').get(prop.target_id);
        previousState.push({ type: 'store_setting', target_id: prop.target_id, old_val: current?.value || '' });
        db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP')
          .run(prop.target_id, String(prop.raw_proposed_value));
      }
    }

    // Save into ai_change_logs
    db.prepare(`
      INSERT INTO ai_change_logs (user_id, prompt, diff_data, previous_state, status)
      VALUES (?, ?, ?, ?, 'applied')
    `).run(
      req.user.id,
      prompt || 'Yêu cầu qua AI',
      JSON.stringify(proposals),
      JSON.stringify(previousState)
    );

    db.prepare('INSERT INTO audit_logs (username, action, details) VALUES (?, ?, ?)')
      .run(req.user.username, 'Áp dụng đề xuất từ Trợ lý AI', `Số thay đổi: ${proposals.length}. Prompt: "${prompt}"`);
  });

  transaction();

  res.json({ success: true, message: 'Đã áp dụng các thay đổi thành công!' });
});

// 3. Revert AI Change
router.post('/revert/:logId', authenticateToken, requireOwner, (req, res) => {
  const { logId } = req.params;
  const log = db.prepare('SELECT * FROM ai_change_logs WHERE id = ? AND status = "applied"').get(logId);
  if (!log) {
    return res.status(404).json({ error: 'Không tìm thấy nhật ký thay đổi hoặc thay đổi đã được hoàn tác trước đó' });
  }

  const previousState = JSON.parse(log.previous_state || '[]');

  const transaction = db.transaction(() => {
    for (const item of previousState) {
      if (item.type === 'product_price') {
        db.prepare('UPDATE products SET price = ? WHERE id = ?').run(item.old_val, item.target_id);
      } else if (item.type === 'product_availability') {
        db.prepare('UPDATE products SET is_available = ? WHERE id = ?').run(item.old_val, item.target_id);
      } else if (item.type === 'store_setting') {
        db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(item.old_val, item.target_id);
      }
    }

    db.prepare('UPDATE ai_change_logs SET status = "reverted" WHERE id = ?').run(logId);

    db.prepare('INSERT INTO audit_logs (username, action, details) VALUES (?, ?, ?)')
      .run(req.user.username, 'Hoàn tác thay đổi từ Trợ lý AI', `Mã nhật ký: #${logId}`);
  });

  transaction();

  res.json({ success: true, message: 'Đã hoàn tác thay đổi thành công!' });
});

// 4. Get AI Logs
router.get('/logs', authenticateToken, requireOwner, (req, res) => {
  const logs = db.prepare('SELECT * FROM ai_change_logs ORDER BY id DESC LIMIT 20').all();
  res.json(logs);
});

module.exports = router;
