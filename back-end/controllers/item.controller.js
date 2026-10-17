const pool = require('../config/db');
const itemQueries = require('../queries/item.queries');

/**
 * ตรวจสอบ "ราคาทุน" ของรายการ
 *  - อะไหล่ (item_type_id = 1): ต้องมีทุนมากกว่า 0 เสมอ (ห้ามว่าง/ห้าม 0) และต้องไม่เกินราคาขาย
 *    เพราะถ้าปล่อยให้ทุนเป็น 0 กำไรขั้นต้นในแดชบอร์ดจะเท่ากับรายรับ (สูงเกินจริง)
 *  - ค่าบริการ (item_type_id = 2): ไม่มีต้นทุนสินค้า → บังคับเป็น 0
 * @returns {{ cost?: number, error?: string }}
 */
function resolveCostPrice(itemTypeId, rawCost, sellingPrice) {
  if (itemTypeId !== 1) return { cost: 0 };

  const isBlank = rawCost === undefined || rawCost === null || String(rawCost).trim() === '';
  if (isBlank) {
    return { error: 'กรุณากรอกราคาทุนของอะไหล่ (ต้องมากกว่า 0 บาท)' };
  }

  const cost = parseFloat(rawCost);
  if (isNaN(cost) || cost <= 0) {
    return { error: 'ราคาทุนของอะไหล่ต้องมากกว่า 0 บาท' };
  }

  if (cost > sellingPrice) {
    return { error: 'ราคาทุนต้องไม่สูงกว่าราคาขาย' };
  }

  return { cost };
}

/**
 * GET /api/items
 * ?type=parts → item_type_id = 1
 * ?type=services → item_type_id = 2
 * ?search=xxx → ilike item_name
 */
exports.getAll = async (req, res, next) => {
  try {
    const { type, search, item_type_id } = req.query;
    let query = itemQueries.BUILD_GET_ALL_ITEMS;
    const params = [];
    let paramIdx = 1;

    const targetTypeId = item_type_id
      ? parseInt(item_type_id, 10)
      : (type === 'parts' || type === '1' ? 1 : (type === 'services' || type === '2' ? 2 : null));

    if (targetTypeId) {
      query += ` AND i.item_type_id = $${paramIdx++}`;
      params.push(targetTypeId);
    }

    if (search && search.trim()) {
      query += ` AND i.item_name ILIKE $${paramIdx++}`;
      params.push(`%${search.trim()}%`);
    }

    query += ' GROUP BY i.item_id, it.item_type_name ORDER BY i.item_id DESC';

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/items
 */
exports.create = async (req, res, next) => {
  try {
    const { item_name, item_type_id, selling_price, price, cost_price } = req.body;
    const cleanName = (item_name || '').trim();
    if (!cleanName) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อรายการ' });
    }

    const numTypeId = parseInt(item_type_id, 10);
    if (isNaN(numTypeId) || ![1, 2].includes(numTypeId)) {
      return res.status(400).json({ success: false, message: 'ประเภทรายการไม่ถูกต้อง (ต้องเป็น 1=อะไหล่ หรือ 2=ค่าบริการ)' });
    }

    const rawPrice = selling_price !== undefined ? selling_price : (price || 0);
    const safePrice = Math.max(0, parseFloat(rawPrice) || 0);

    const { cost: safeCost, error: costError } = resolveCostPrice(numTypeId, cost_price, safePrice);
    if (costError) {
      return res.status(400).json({ success: false, message: costError });
    }

    const { rows } = await pool.query(
      itemQueries.INSERT_ITEM,
      [cleanName, numTypeId, safePrice, safeCost]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/items/:id
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({ success: false, message: 'ID รายการไม่ถูกต้อง' });
    }

    const { item_name, item_type_id, selling_price, price, cost_price } = req.body;
    const cleanName = (item_name || '').trim();
    if (!cleanName) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อรายการ' });
    }

    const numTypeId = parseInt(item_type_id, 10);
    if (isNaN(numTypeId) || ![1, 2].includes(numTypeId)) {
      return res.status(400).json({ success: false, message: 'ประเภทรายการไม่ถูกต้อง (ต้องเป็น 1=อะไหล่ หรือ 2=ค่าบริการ)' });
    }

    const rawPrice = selling_price !== undefined ? selling_price : (price || 0);
    const safePrice = Math.max(0, parseFloat(rawPrice) || 0);

    const { cost: safeCost, error: costError } = resolveCostPrice(numTypeId, cost_price, safePrice);
    if (costError) {
      return res.status(400).json({ success: false, message: costError });
    }

    const { rows } = await pool.query(
      itemQueries.UPDATE_ITEM,
      [cleanName, numTypeId, safePrice, safeCost, numId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการ' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/items/:id
 */
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({ success: false, message: 'ID รายการไม่ถูกต้อง' });
    }

    const result = await pool.query(itemQueries.DELETE_ITEM, [numId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการ' });
    }

    res.json({ success: true, message: 'ลบรายการสำเร็จ' });
  } catch (err) {
    next(err);
  }
};

