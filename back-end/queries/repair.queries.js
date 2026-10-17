/**
 * queries/repair.queries.js
 * รวมคำสั่ง SQL Queries สำหรับโมดูลงานซ่อม (Repair Job)
 */

const { QUOTE_STATUS } = require('../constants');

const SELECT_REPAIR_FIELDS = `
  SELECT 
    rj.*,
    d.model,
    d.serial_number,
    d.included_accessories,
    d.important_software,
    d.device_password,
    d.warranty_year,
    d.warranty_end_date,
    d.customer_id,
    dt.device_type_name AS device_type,
    b.brand_name AS brand,
    s.status_name,
    pm.payment_method_name,
    p.first_name,
    p.last_name,
    p.phone,
    p.email,
    p_rep.first_name AS rep_first_name,
    p_rep.last_name AS rep_last_name,
    q.quote_status_id,
    q.customer_remark,
    q.total_repair_price,
    q.total_cancel_price,
    (SELECT MAX(rjd.created_at) FROM repair_job_detail rjd WHERE rjd.job_id = rj.job_id) AS last_action_at
  FROM repair_job rj
  LEFT JOIN device d ON rj.device_id = d.device_id
  LEFT JOIN device_types dt ON d.device_type_id = dt.device_type_id
  LEFT JOIN brands b ON d.brand_id = b.brand_id
  LEFT JOIN status s ON rj.status_id = s.status_id
  LEFT JOIN payment_method pm ON rj.payment_method_id = pm.payment_method_id
  LEFT JOIN profiles p ON d.customer_id = p.id
  LEFT JOIN profiles p_rep ON rj.repairer_id = p_rep.id
  LEFT JOIN quotation q ON rj.quotation_id = q.quotation_id
`;

exports.BUILD_GET_ALL_REPAIRS = (whereClause = '') => `
  ${SELECT_REPAIR_FIELDS}
  ${whereClause}
  ORDER BY rj.created_at DESC
`;

exports.GET_REPAIR_BY_ID = `
  ${SELECT_REPAIR_FIELDS}
  WHERE rj.job_id = $1
`;

exports.FIND_QUOTATION_BY_JOB_ID = `
  SELECT quotation_id FROM quotation WHERE job_id = $1 ORDER BY created_at DESC LIMIT 1
`;

exports.GET_QUOTATION_BY_ID = `
  SELECT q.*, qs.quote_status_name
  FROM quotation q
  LEFT JOIN quotation_status qs ON q.quote_status_id = qs.quote_status_id
  WHERE q.quotation_id = $1
`;

exports.GET_QUOTATION_ITEMS = `
  SELECT qd.*, i.item_name, i.item_type_id, it.item_type_name
  FROM quotation_details qd
  LEFT JOIN item i ON qd.item_id = i.item_id
  LEFT JOIN item_type it ON i.item_type_id = it.item_type_id
  WHERE qd.quote_id = $1
`;

exports.GET_ACTION_LOGS = `
  SELECT 
    rjd.*, 
    at.action_type_name,
    p.first_name,
    p.last_name,
    p.role_id, 
    r.name AS role_name
  FROM repair_job_detail rjd
  LEFT JOIN action_type at ON rjd.action_type_id = at.action_type_id
  LEFT JOIN profiles p ON rjd.user_id = p.id
  LEFT JOIN roles r ON p.role_id = r.id
  WHERE rjd.job_id = $1
  ORDER BY rjd.created_at ASC
`;

exports.INSERT_REPAIR_JOB = `
  INSERT INTO repair_job (device_id, symptom_details, status_id)
  VALUES ($1, $2, $3)
  RETURNING *
`;

exports.UPDATE_REPAIR_JOB = `
  UPDATE repair_job SET
    device_id = COALESCE($1, device_id), 
    symptom_details = COALESCE($2, symptom_details), 
    status_id = COALESCE($3, status_id),
    total_amount = COALESCE($4, total_amount), 
    slip_image = COALESCE($5, slip_image), 
    payment_date = COALESCE($6, payment_date), 
    payment_method_id = COALESCE($7, payment_method_id), 
    quotation_id = COALESCE($8, quotation_id)
  WHERE job_id = $9
  RETURNING *
`;

exports.UPDATE_REPAIR_SIGNATURE = `
  UPDATE repair_job 
  SET customer_receive_signature = $1, return_date = COALESCE(return_date, NOW()) 
  WHERE job_id = $2 
  RETURNING *
`;

exports.INSERT_ACTION_LOG = `
  INSERT INTO repair_job_detail (job_id, user_id, action_type_id, action_date, remark)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING *
`;

exports.DELETE_REPAIR_DETAILS = `
  DELETE FROM repair_job_detail WHERE job_id = $1
`;

exports.DELETE_REPAIR_JOB = `
  DELETE FROM repair_job WHERE job_id = $1
`;

// --- ตรวจสอบความเป็นเจ้าของ/สถานะก่อนเปลี่ยนสถานะงาน ---
/** ลูกค้าเป็นเจ้าของเครื่องในงานนี้หรือไม่ (ใช้กับงานที่ลูกค้าขอยกเลิกเอง) */
exports.BUILD_CHECK_JOB_OWNER = `
  SELECT rj.job_id FROM repair_job rj
  JOIN device d ON rj.device_id = d.device_id
  WHERE rj.job_id = $1 AND d.customer_id = $2
`;

exports.FIND_JOB_STATUS_BY_ID = 'SELECT status_id, quotation_id FROM repair_job WHERE job_id = $1';

/**
 * ส่วนหัวของคำสั่งอัปเดตสถานะงาน
 * หมายเหตุ: controller จะต่อท้ายด้วยเงื่อนไขที่ต้องใช้จริง (เช่น total_amount / repairer_id / return_date)
 * แล้วปิดท้ายด้วย `WHERE job_id = $2 RETURNING *` — จึงเป็นค่าคงที่ "บางส่วน" โดยตั้งใจ
 */
exports.UPDATE_REPAIR_STATUS_BASE = 'UPDATE repair_job SET status_id = $1';

exports.FIND_LATEST_QUOTE_CANCEL_PRICE = 'SELECT total_cancel_price FROM quotation WHERE job_id = $1 ORDER BY created_at DESC LIMIT 1';

/** ซิงค์ใบเสนอราคาของงานนี้ให้เป็น "ยกเลิก" เมื่อลูกค้ายกเลิกซ่อม */
exports.CANCEL_QUOTATION_BY_JOB = `
  UPDATE quotation SET quote_status_id = ${QUOTE_STATUS.CANCELLED} WHERE job_id = $1 OR quotation_id = (SELECT quotation_id FROM repair_job WHERE job_id = $1)
`;

exports.FIND_JOB_FOR_DELETE = 'SELECT job_id, quotation_id, payment_method_id, slip_image FROM repair_job WHERE job_id = $1';

exports.FIND_QUOTATION_ID_BY_JOB = 'SELECT quotation_id FROM quotation WHERE job_id = $1';
