const pool = require('../config/db');
const catalogQueries = require('../queries/catalog.queries');

// ============================================================
// 1. DEVICE TYPES (ประเภทอุปกรณ์)
// ============================================================

/**
 * GET /api/catalog/device-types
 * ดึงรายการประเภทอุปกรณ์ทั้งหมด พร้อมสถิติจำนวนยี่ห้อและรุ่น
 */
exports.getAllDeviceTypes = async (req, res, next) => {
  try {
    const { rows } = await pool.query(catalogQueries.BUILD_GET_ALL_DEVICE_TYPES);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/catalog/device-types
 * เพิ่มประเภทอุปกรณ์ใหม่ (Manager only)
 */
exports.createDeviceType = async (req, res, next) => {
  try {
    const { device_type_name } = req.body;
    const name = (device_type_name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อประเภทอุปกรณ์' });
    }

    const dupCheck = await pool.query(
      catalogQueries.FIND_DEVICE_TYPE_BY_NAME,
      [name]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'ประเภทอุปกรณ์นี้มีอยู่ในระบบแล้ว' });
    }

    const { rows } = await pool.query(
      catalogQueries.INSERT_DEVICE_TYPE,
      [name]
    );
    res.status(201).json({ success: true, data: rows[0], message: 'เพิ่มประเภทอุปกรณ์สำเร็จ' });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/catalog/device-types/:id
 * แก้ไขประเภทอุปกรณ์ (Manager only)
 */
exports.updateDeviceType = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'ID ประเภทอุปกรณ์ไม่ถูกต้อง' });
    }

    const { device_type_name } = req.body;
    const name = (device_type_name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อประเภทอุปกรณ์' });
    }

    const dupCheck = await pool.query(
      catalogQueries.FIND_DEVICE_TYPE_BY_NAME_EXCEPT_ID,
      [name, id]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'ชื่อประเภทอุปกรณ์นี้ซ้ำกับรายการอื่น' });
    }

    const { rows } = await pool.query(
      catalogQueries.UPDATE_DEVICE_TYPE,
      [name, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบประเภทอุปกรณ์' });
    }

    res.json({ success: true, data: rows[0], message: 'แก้ไขประเภทอุปกรณ์สำเร็จ' });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/catalog/device-types/:id
 * ลบประเภทอุปกรณ์ (Manager only)
 */
exports.deleteDeviceType = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'ID ประเภทอุปกรณ์ไม่ถูกต้อง' });
    }

    // 1. ตรวจสอบว่ามีการนำไปใช้ในข้อมูลงานซ่อม (device) หรือไม่
    const deviceCheck = await client.query(
      catalogQueries.COUNT_DEVICES_BY_DEVICE_TYPE,
      [id]
    );
    if (deviceCheck.rows[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `ไม่สามารถลบประเภทอุปกรณ์นี้ได้เนื่องจากมีประวัติอุปกรณ์งานซ่อมใช้งานอยู่จำนวน ${deviceCheck.rows[0].count} เครื่อง`,
      });
    }

    // 2. ตรวจสอบรุ่นที่ผูกอยู่
    const modelCheck = await client.query(
      catalogQueries.COUNT_MODELS_BY_DEVICE_TYPE,
      [id]
    );
    if (modelCheck.rows[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `ไม่สามารถลบได้เนื่องจากมีรุ่นอุปกรณ์ผูกอยู่จำนวน ${modelCheck.rows[0].count} รุ่น กรุณาย้ายหรือลบรุ่นอุปกรณ์ก่อน`,
      });
    }

    await client.query('BEGIN');
    await client.query(catalogQueries.DELETE_BRAND_DEVICE_TYPES_BY_DEVICE_TYPE, [id]);
    const { rowCount } = await client.query(catalogQueries.DELETE_DEVICE_TYPE, [id]);
    await client.query('COMMIT');

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบประเภทอุปกรณ์ที่ต้องการลบ' });
    }

    res.json({ success: true, message: 'ลบประเภทอุปกรณ์เรียบร้อยแล้ว' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// ============================================================
// 2. BRANDS (ยี่ห้อ / แบรนด์)
// ============================================================

/**
 * GET /api/catalog/brands
 * ดึงรายการยี่ห้อทั้งหมด พร้อมประเภทอุปกรณ์ที่ผูก และจำนวนรุ่น
 */
exports.getAllBrands = async (req, res, next) => {
  try {
    const { device_type_id, search } = req.query;
    let query = catalogQueries.BUILD_GET_ALL_BRANDS;

    const conditions = [];
    const params = [];

    if (device_type_id && !isNaN(parseInt(device_type_id, 10))) {
      params.push(parseInt(device_type_id, 10));
      conditions.push(catalogQueries.BUILD_BRAND_IN_DEVICE_TYPE_CONDITION(params.length));
    }

    if (search && String(search).trim()) {
      params.push(`%${String(search).trim()}%`);
      conditions.push(`b.brand_name ILIKE $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY b.brand_id, b.brand_name ORDER BY b.brand_name ASC';

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/catalog/brands
 * เพิ่มยี่ห้อใหม่ และผูกกับประเภทอุปกรณ์ (Manager only)
 */
exports.createBrand = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { brand_name, device_type_ids } = req.body;
    const name = (brand_name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อยี่ห้อ' });
    }

    const dupCheck = await client.query(
      catalogQueries.FIND_BRAND_BY_NAME,
      [name]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'ยี่ห้อนี้มีอยู่ในระบบแล้ว' });
    }

    await client.query('BEGIN');
    const { rows } = await client.query(
      catalogQueries.INSERT_BRAND,
      [name]
    );
    const brand = rows[0];

    const typeIds = Array.isArray(device_type_ids)
      ? device_type_ids.map(Number).filter((id) => !isNaN(id) && id > 0)
      : [];

    for (const dtId of typeIds) {
      await client.query(
        catalogQueries.INSERT_BRAND_DEVICE_TYPE,
        [brand.brand_id, dtId]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: brand, message: 'เพิ่มยี่ห้อสำเร็จ' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * PUT /api/catalog/brands/:id
 * แก้ไขยี่ห้อ และอัปเดตประเภทอุปกรณ์ที่ผูก (Manager only)
 */
exports.updateBrand = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'ID ยี่ห้อไม่ถูกต้อง' });
    }

    const { brand_name, device_type_ids } = req.body;
    const name = (brand_name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อยี่ห้อ' });
    }

    const dupCheck = await client.query(
      catalogQueries.FIND_BRAND_BY_NAME_EXCEPT_ID,
      [name, id]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'ชื่อยี่ห้อนี้ซ้ำกับรายการอื่น' });
    }

    await client.query('BEGIN');
    const { rows } = await client.query(
      catalogQueries.UPDATE_BRAND,
      [name, id]
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'ไม่พบยี่ห้อ' });
    }

    if (Array.isArray(device_type_ids)) {
      await client.query(catalogQueries.DELETE_BRAND_DEVICE_TYPES_BY_BRAND, [id]);
      const typeIds = device_type_ids.map(Number).filter((tId) => !isNaN(tId) && tId > 0);
      for (const dtId of typeIds) {
        await client.query(
          catalogQueries.INSERT_BRAND_DEVICE_TYPE,
          [id, dtId]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, data: rows[0], message: 'แก้ไขยี่ห้อสำเร็จ' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * DELETE /api/catalog/brands/:id
 * ลบยี่ห้อ (Manager only)
 */
exports.deleteBrand = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'ID ยี่ห้อไม่ถูกต้อง' });
    }

    // 1. ตรวจสอบว่ามีอุปกรณ์ในระบบใช้งานหรือไม่
    const devCheck = await client.query(
      catalogQueries.COUNT_DEVICES_BY_BRAND,
      [id]
    );
    if (devCheck.rows[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `ไม่สามารถลบยี่ห้อนี้ได้เนื่องจากมีข้อมูลงานซ่อมในระบบใช้งานอยู่จำนวน ${devCheck.rows[0].count} เครื่อง`,
      });
    }

    // 2. ตรวจสอบรุ่นที่ผูกอยู่
    const modelCheck = await client.query(
      catalogQueries.COUNT_MODELS_BY_BRAND,
      [id]
    );
    if (modelCheck.rows[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `ไม่สามารถลบได้เนื่องจากมีรุ่นอุปกรณ์ของยี่ห้อนี้ผูกอยู่จำนวน ${modelCheck.rows[0].count} รุ่น กรุณาลบรุ่นอุปกรณ์ก่อน`,
      });
    }

    await client.query('BEGIN');
    await client.query(catalogQueries.DELETE_BRAND_DEVICE_TYPES_BY_BRAND, [id]);
    const { rowCount } = await client.query(catalogQueries.DELETE_BRAND, [id]);
    await client.query('COMMIT');

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบยี่ห้อที่ต้องการลบ' });
    }

    res.json({ success: true, message: 'ลบยี่ห้อเรียบร้อยแล้ว' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// ============================================================
// 3. MODELS (รุ่นอุปกรณ์)
// ============================================================

/**
 * GET /api/catalog/models
 * ดึงรายการรุ่น พร้อมข้อมูลยี่ห้อและประเภทอุปกรณ์
 */
exports.getAllModels = async (req, res, next) => {
  try {
    const { brand_id, device_type_id, search } = req.query;
    let query = catalogQueries.BUILD_GET_ALL_MODELS;

    const conditions = [];
    const params = [];

    if (brand_id && !isNaN(parseInt(brand_id, 10))) {
      params.push(parseInt(brand_id, 10));
      conditions.push(`dm.brand_id = $${params.length}`);
    }

    if (device_type_id && !isNaN(parseInt(device_type_id, 10))) {
      params.push(parseInt(device_type_id, 10));
      conditions.push(`dm.device_type_id = $${params.length}`);
    }

    if (search && String(search).trim()) {
      params.push(`%${String(search).trim()}%`);
      conditions.push(`(dm.model_name ILIKE $${params.length} OR b.brand_name ILIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY dt.device_type_id ASC, b.brand_name ASC, dm.model_name ASC';

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/catalog/models
 * เพิ่มรุ่นอุปกรณ์ใหม่ (Manager only)
 */
exports.createModel = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { model_name, brand_id, device_type_id } = req.body;
    const name = (model_name || '').trim();
    const bId = parseInt(brand_id, 10);
    const dtId = parseInt(device_type_id, 10);

    if (!name) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อรุ่นอุปกรณ์' });
    }
    if (isNaN(bId) || bId <= 0) {
      return res.status(400).json({ success: false, message: 'กรุณาเลือกยี่ห้อ' });
    }
    if (isNaN(dtId) || dtId <= 0) {
      return res.status(400).json({ success: false, message: 'กรุณาเลือกประเภทอุปกรณ์' });
    }

    // ตรวจสอบชื่อรุ่นซ้ำในยี่ห้อและประเภทเดียวกัน
    const dupCheck = await client.query(
      catalogQueries.FIND_MODEL_BY_NAME_IN_BRAND_TYPE,
      [bId, dtId, name]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'มีรุ่นนี้ในยี่ห้อและประเภทดังกล่าวอยู่แล้ว' });
    }

    await client.query('BEGIN');

    // ตรวจสอบและเชื่อมโยง brand_device_types อัตโนมัติถ้ายังไม่ผูก
    await client.query(
      catalogQueries.INSERT_BRAND_DEVICE_TYPE_STRICT,
      [bId, dtId]
    );

    const { rows } = await client.query(
      catalogQueries.INSERT_MODEL,
      [name, bId, dtId]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: rows[0], message: 'เพิ่มรุ่นอุปกรณ์สำเร็จ' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * PUT /api/catalog/models/:id
 * แก้ไขรุ่นอุปกรณ์ (Manager only)
 */
exports.updateModel = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'ID รุ่นอุปกรณ์ไม่ถูกต้อง' });
    }

    const { model_name, brand_id, device_type_id } = req.body;
    const name = (model_name || '').trim();
    const bId = parseInt(brand_id, 10);
    const dtId = parseInt(device_type_id, 10);

    if (!name) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อรุ่นอุปกรณ์' });
    }
    if (isNaN(bId) || bId <= 0) {
      return res.status(400).json({ success: false, message: 'กรุณาเลือกยี่ห้อ' });
    }
    if (isNaN(dtId) || dtId <= 0) {
      return res.status(400).json({ success: false, message: 'กรุณาเลือกประเภทอุปกรณ์' });
    }

    const dupCheck = await client.query(
      catalogQueries.FIND_MODEL_BY_NAME_EXCEPT_ID,
      [bId, dtId, name, id]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'มีรุ่นนี้ในยี่ห้อและประเภทดังกล่าวอยู่แล้ว' });
    }

    await client.query('BEGIN');

    // ตรวจสอบและเชื่อมโยง brand_device_types อัตโนมัติ
    await client.query(
      catalogQueries.INSERT_BRAND_DEVICE_TYPE_STRICT,
      [bId, dtId]
    );

    const { rows } = await client.query(
      catalogQueries.UPDATE_MODEL,
      [name, bId, dtId, id]
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'ไม่พบรุ่นอุปกรณ์' });
    }

    await client.query('COMMIT');
    res.json({ success: true, data: rows[0], message: 'แก้ไขรุ่นอุปกรณ์สำเร็จ' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * DELETE /api/catalog/models/:id
 * ลบรุ่นอุปกรณ์ (Manager only)
 */
exports.deleteModel = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'ID รุ่นอุปกรณ์ไม่ถูกต้อง' });
    }

    const { rowCount } = await pool.query(catalogQueries.DELETE_MODEL, [id]);
    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบรุ่นอุปกรณ์ที่ต้องการลบ' });
    }

    res.json({ success: true, message: 'ลบรุ่นอุปกรณ์เรียบร้อยแล้ว' });
  } catch (err) {
    next(err);
  }
};
