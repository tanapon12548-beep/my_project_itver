/**
 * queries/staff.queries.js
 * รวมคำสั่ง SQL Queries สำหรับโมดูลจัดการผู้ใช้งานในระบบ (Staff)
 */
const { ROLES, REPAIR_STATUS, DEFAULTS } = require('../constants');

/** รายชื่อผู้ใช้ระบบ (Staff, Technician, Customer) ยกเว้น Manager */
exports.GET_ALL_PROFILES = `
  SELECT p.id, p.email, p.first_name, p.last_name, p.phone, p.role_id, r.name AS role_name, p.created_at
  FROM profiles p
  LEFT JOIN roles r ON p.role_id = r.id
  WHERE p.role_id IN (${ROLES.STAFF}, ${ROLES.TECHNICIAN}, ${ROLES.CUSTOMER})
  ORDER BY p.created_at DESC
`;

exports.FIND_PHONE_OWNED_BY_OTHER = 'SELECT id FROM profiles WHERE phone = $1 AND id != $2 LIMIT 1';

exports.UPDATE_PROFILE = `
  UPDATE profiles 
  SET first_name = COALESCE($1, first_name),
      last_name = COALESCE($2, last_name),
      phone = COALESCE($3, phone),
      role_id = COALESCE($4, role_id)
  WHERE id = $5
  RETURNING id, email, first_name, last_name, phone, role_id
`;

exports.FIND_PROFILE_BY_ID = 'SELECT id, email, first_name, last_name, role_id FROM profiles WHERE id = $1';

/** งานซ่อมทั้งหมดของลูกค้ารายนี้ (ใช้ตรวจหนี้คงค้าง/งานที่ยังไม่จบ ก่อนลบบัญชี) */
exports.GET_CUSTOMER_JOBS = `
  SELECT 
    rj.job_id,
    rj.status_id,
    s.status_name,
    rj.payment_verified,
    COALESCE(rj.total_amount, 0) AS total_amount,
    COALESCE(q.total_repair_price, 0) AS quote_repair_price,
    COALESCE(q.total_cancel_price, ${DEFAULTS.CANCEL_INSPECTION_FEE || 300}) AS quote_cancel_price,
    q.quote_status_id,
    qs.quote_status_name
  FROM repair_job rj
  JOIN device d ON rj.device_id = d.device_id
  LEFT JOIN status s ON rj.status_id = s.status_id
  LEFT JOIN quotation q ON rj.quotation_id = q.quotation_id
  LEFT JOIN quotation_status qs ON q.quote_status_id = qs.quote_status_id
  WHERE d.customer_id = $1
`;

/** งานที่ช่างคนนี้ยังรับผิดชอบอยู่ (ยังไม่เสร็จ/ไม่ถูกยกเลิก) */
exports.GET_TECHNICIAN_ACTIVE_JOBS = `
  SELECT rj.job_id, s.status_name 
  FROM repair_job rj
  LEFT JOIN status s ON rj.status_id = s.status_id
  WHERE rj.repairer_id = $1 
    AND rj.status_id NOT IN (${REPAIR_STATUS.COMPLETED}, ${REPAIR_STATUS.CANCELLED})
`;

// --- ล้างความสัมพันธ์ foreign keys ก่อนลบบัญชี (ใช้ใน transaction) ---
exports.DELETE_USER_RESET_TOKENS = 'DELETE FROM password_reset_tokens WHERE user_id = $1';

exports.CLEAR_REPAIRER = 'UPDATE repair_job SET repairer_id = NULL WHERE repairer_id = $1';

exports.CLEAR_PAYMENT_VERIFIER = 'UPDATE repair_job SET payment_verified_by = NULL WHERE payment_verified_by = $1';

exports.CLEAR_ACTION_LOG_USER = 'UPDATE repair_job_detail SET user_id = NULL WHERE user_id = $1';

exports.CLEAR_SLIP_USER = 'UPDATE slips_records SET user_id = NULL WHERE user_id = $1';

exports.CLEAR_DEVICE_CUSTOMER = 'UPDATE device SET customer_id = NULL WHERE customer_id = $1';

exports.DELETE_PROFILE = 'DELETE FROM profiles WHERE id = $1';
