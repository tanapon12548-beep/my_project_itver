/**
 * queries/catalog.queries.js
 * รวมคำสั่ง SQL Queries สำหรับโมดูลแคตตาล็อก (ประเภทอุปกรณ์ / ยี่ห้อ / รุ่น)
 */

// ============================================================
// 1. DEVICE TYPES (ประเภทอุปกรณ์)
// ============================================================

/** รายการประเภทอุปกรณ์ + สถิติจำนวนยี่ห้อ/รุ่น/เครื่อง */
exports.BUILD_GET_ALL_DEVICE_TYPES = `
  SELECT 
    dt.device_type_id,
    dt.device_type_name,
    COUNT(DISTINCT bdt.brand_id)::int AS brand_count,
    COUNT(DISTINCT dm.model_id)::int AS model_count,
    COUNT(DISTINCT d.device_id)::int AS device_count
  FROM device_types dt
  LEFT JOIN brand_device_types bdt ON dt.device_type_id = bdt.device_type_id
  LEFT JOIN device_models dm ON dt.device_type_id = dm.device_type_id
  LEFT JOIN device d ON dt.device_type_id = d.device_type_id
  GROUP BY dt.device_type_id, dt.device_type_name
  ORDER BY dt.device_type_id ASC
`;

exports.FIND_DEVICE_TYPE_BY_NAME = 'SELECT device_type_id FROM device_types WHERE LOWER(device_type_name) = LOWER($1)';

exports.INSERT_DEVICE_TYPE = 'INSERT INTO device_types (device_type_name) VALUES ($1) RETURNING *';

exports.FIND_DEVICE_TYPE_BY_NAME_EXCEPT_ID = 'SELECT device_type_id FROM device_types WHERE LOWER(device_type_name) = LOWER($1) AND device_type_id != $2';

exports.UPDATE_DEVICE_TYPE = 'UPDATE device_types SET device_type_name = $1 WHERE device_type_id = $2 RETURNING *';

exports.COUNT_DEVICES_BY_DEVICE_TYPE = 'SELECT COUNT(*)::int AS count FROM device WHERE device_type_id = $1';

exports.COUNT_MODELS_BY_DEVICE_TYPE = 'SELECT COUNT(*)::int AS count FROM device_models WHERE device_type_id = $1';

exports.DELETE_BRAND_DEVICE_TYPES_BY_DEVICE_TYPE = 'DELETE FROM brand_device_types WHERE device_type_id = $1';

exports.DELETE_DEVICE_TYPE = 'DELETE FROM device_types WHERE device_type_id = $1';

// ============================================================
// 2. BRANDS (ยี่ห้อ / แบรนด์)
// ============================================================

/** รายการยี่ห้อ + ประเภทอุปกรณ์ที่ผูก (json) + จำนวนรุ่น */
exports.BUILD_GET_ALL_BRANDS = `
  SELECT 
    b.brand_id,
    b.brand_name,
    COALESCE(
      json_agg(
        DISTINCT jsonb_build_object(
          'device_type_id', dt.device_type_id,
          'device_type_name', dt.device_type_name
        )
      ) FILTER (WHERE dt.device_type_id IS NOT NULL),
      '[]'
    ) AS device_types,
    COUNT(DISTINCT dm.model_id)::int AS model_count
  FROM brands b
  LEFT JOIN brand_device_types bdt ON b.brand_id = bdt.brand_id
  LEFT JOIN device_types dt ON bdt.device_type_id = dt.device_type_id
  LEFT JOIN device_models dm ON b.brand_id = dm.brand_id
`;

/**
 * เงื่อนไขสำหรับ getAllBrands: ยี่ห้อต้องผูกกับประเภทอุปกรณ์นี้
 * (ผูกตรงใน brand_device_types หรือมีรุ่นของยี่ห้อนั้นใน device_models)
 * @param {number} placeholder ลำดับพารามิเตอร์ ($n) ที่จะใช้ในเงื่อนไขนี้
 */
exports.BUILD_BRAND_IN_DEVICE_TYPE_CONDITION = (placeholder) => `b.brand_id IN (
  SELECT brand_id FROM brand_device_types WHERE device_type_id = $${placeholder}
  UNION
  SELECT brand_id FROM device_models WHERE device_type_id = $${placeholder}
)`;

exports.FIND_BRAND_BY_NAME = 'SELECT brand_id FROM brands WHERE LOWER(brand_name) = LOWER($1)';
exports.INSERT_BRAND = 'INSERT INTO brands (brand_name) VALUES ($1) RETURNING *';

/** ผูกยี่ห้อกับประเภทอุปกรณ์ (ใช้ทั้งตอนเพิ่มและตอนแก้ไขยี่ห้อ) */
exports.INSERT_BRAND_DEVICE_TYPE = 'INSERT INTO brand_device_types (brand_id, device_type_id) VALUES ($1, $2) ON CONFLICT DO NOTHING';

exports.FIND_BRAND_BY_NAME_EXCEPT_ID = 'SELECT brand_id FROM brands WHERE LOWER(brand_name) = LOWER($1) AND brand_id != $2';

exports.UPDATE_BRAND = 'UPDATE brands SET brand_name = $1 WHERE brand_id = $2 RETURNING *';

/** ล้างประเภทอุปกรณ์ที่ผูกกับยี่ห้อ (ก่อนบันทึกชุดใหม่/ลบยี่ห้อ) */
exports.DELETE_BRAND_DEVICE_TYPES_BY_BRAND = 'DELETE FROM brand_device_types WHERE brand_id = $1';

exports.COUNT_DEVICES_BY_BRAND = 'SELECT COUNT(*)::int AS count FROM device WHERE brand_id = $1';

exports.COUNT_MODELS_BY_BRAND = 'SELECT COUNT(*)::int AS count FROM device_models WHERE brand_id = $1';

exports.DELETE_BRAND = 'DELETE FROM brands WHERE brand_id = $1';

// ============================================================
// 3. MODELS (รุ่นอุปกรณ์)
// ============================================================

/** รายการรุ่น + ชื่อยี่ห้อ/ประเภทอุปกรณ์ */
exports.BUILD_GET_ALL_MODELS = `
  SELECT 
    dm.model_id,
    dm.model_name,
    dm.brand_id,
    COALESCE(b.brand_name, '-') AS brand_name,
    dm.device_type_id,
    COALESCE(dt.device_type_name, '-') AS device_type_name
  FROM device_models dm
  LEFT JOIN brands b ON dm.brand_id = b.brand_id
  LEFT JOIN device_types dt ON dm.device_type_id = dt.device_type_id
`;

exports.FIND_MODEL_BY_NAME_IN_BRAND_TYPE = `
  SELECT model_id FROM device_models 
  WHERE brand_id = $1 AND device_type_id = $2 AND LOWER(model_name) = LOWER($3)
`;

/** ผูกยี่ห้อกับประเภทอุปกรณ์อัตโนมัติก่อนบันทึกรุ่น (ใช้ทั้งตอนเพิ่มและตอนแก้ไขรุ่น) */
exports.INSERT_BRAND_DEVICE_TYPE_STRICT = `
  INSERT INTO brand_device_types (brand_id, device_type_id)
  VALUES ($1, $2)
  ON CONFLICT (brand_id, device_type_id) DO NOTHING
`;

exports.INSERT_MODEL = `
  INSERT INTO device_models (model_name, brand_id, device_type_id)
  VALUES ($1, $2, $3)
  RETURNING *
`;

exports.FIND_MODEL_BY_NAME_EXCEPT_ID = `
  SELECT model_id FROM device_models 
  WHERE brand_id = $1 AND device_type_id = $2 AND LOWER(model_name) = LOWER($3) AND model_id != $4
`;

exports.UPDATE_MODEL = `
  UPDATE device_models SET model_name = $1, brand_id = $2, device_type_id = $3
  WHERE model_id = $4
  RETURNING *
`;

exports.DELETE_MODEL = 'DELETE FROM device_models WHERE model_id = $1';
