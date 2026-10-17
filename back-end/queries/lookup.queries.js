/**
 * queries/lookup.queries.js
 * รวมคำสั่ง SQL Queries สำหรับโมดูลข้อมูลอ้างอิง (Lookup)
 */
const { ROLES } = require('../constants');

// --- ตารางอ้างอิงพื้นฐาน ---
exports.GET_STATUSES = 'SELECT * FROM status ORDER BY status_id';
exports.GET_ACTION_TYPES = 'SELECT * FROM action_type ORDER BY action_type_id';
exports.GET_PAYMENT_METHODS = 'SELECT * FROM payment_method ORDER BY payment_method_id';
exports.GET_ITEM_TYPES = 'SELECT * FROM item_type ORDER BY item_type_id';
exports.GET_QUOTATION_STATUSES = 'SELECT * FROM quotation_status ORDER BY quote_status_id';
exports.GET_DEVICE_TYPES = 'SELECT * FROM device_types ORDER BY device_type_id';
exports.GET_BRANDS = 'SELECT * FROM brands ORDER BY brand_name ASC';

/** ยี่ห้อที่ใช้ได้กับประเภทอุปกรณ์ที่ระบุ (จาก brand_device_types หรือรุ่นที่มีอยู่) */
exports.BUILD_GET_BRANDS_BY_DEVICE_TYPE = `
  SELECT DISTINCT b.brand_id, b.brand_name
  FROM brands b
  LEFT JOIN brand_device_types bdt ON b.brand_id = bdt.brand_id
  LEFT JOIN device_models dm ON b.brand_id = dm.brand_id AND dm.device_type_id = $1
  WHERE bdt.device_type_id = $1 OR dm.device_type_id = $1
  ORDER BY b.brand_name ASC
`;

/** รุ่นอุปกรณ์ (ต่อท้ายด้วย WHERE/ORDER BY ที่ประกอบจาก query string ใน controller) */
exports.GET_ALL_DEVICE_MODELS = 'SELECT * FROM device_models';

// --- ค้นหาโปรไฟล์ลูกค้า (autocomplete) ---
exports.BUILD_SEARCH_PROFILES_ADVANCED = (conditions) => `
  SELECT id, first_name, last_name, phone, email FROM profiles WHERE ${conditions.join(' AND ')} LIMIT 10
`;

exports.SEARCH_PROFILES_BY_PHONE = `
  SELECT id, first_name, last_name, phone, email FROM profiles WHERE phone ILIKE $1 AND role_id = ${ROLES.CUSTOMER} LIMIT 10
`;

exports.SEARCH_PROFILES_BY_NAME = `
  SELECT id, first_name, last_name, phone, email FROM profiles
  WHERE CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) ILIKE $1 AND role_id = ${ROLES.CUSTOMER} LIMIT 10
`;

exports.SEARCH_PROFILES_BY_EMAIL = `
  SELECT id, first_name, last_name, phone, email FROM profiles WHERE email ILIKE $1 AND role_id = ${ROLES.CUSTOMER} LIMIT 10
`;

/** ค่าเริ่มต้น: ช่องค้นหาเดียว จับชื่อ/เบอร์/อีเมล */
exports.SEARCH_PROFILES_ALL = `
  SELECT id, first_name, last_name, phone, email FROM profiles
  WHERE role_id = ${ROLES.CUSTOMER} AND (
    CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) ILIKE $1
    OR phone ILIKE $1
    OR email ILIKE $1
  ) LIMIT 10
`;
