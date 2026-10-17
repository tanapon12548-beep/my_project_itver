/**
 * queries/quotation.queries.js
 * รวมคำสั่ง SQL Queries สำหรับโมดูลใบเสนอราคา (Quotation)
 */
const { REPAIR_STATUS, ACTION_TYPES } = require('../constants');

exports.INSERT_QUOTATION = `
  INSERT INTO quotation (job_id, total_repair_price, total_cancel_price, quote_status_id)
  VALUES ($1, $2, $3, $4)
  RETURNING *
`;

exports.UPDATE_REPAIR_FOR_NEW_QUOTATION = `
  UPDATE repair_job 
  SET quotation_id = $1,
      actual_symptom = $2,
      total_amount = $3,
      status_id = ${REPAIR_STATUS.PENDING_APPROVAL}
  WHERE job_id = $4
`;

exports.FIND_ITEM_BY_NAME = `
  SELECT item_id, item_type_id FROM item WHERE item_name = $1
`;

exports.INSERT_NEW_ITEM = `
  INSERT INTO item (item_name, item_type_id, selling_price)
  VALUES ($1, $2, $3)
  RETURNING item_id
`;

/**
 * บันทึกรายการในใบเสนอราคา
 * unit_cost = snapshot ราคาทุนของอะไหล่ ณ วันที่เสนอราคา (ดึงจาก item.cost_price)
 * เก็บ snapshot ไว้เพื่อไม่ให้กำไรย้อนหลังเปลี่ยนตามราคาทุนที่ถูกแก้ในภายหลัง
 */
exports.INSERT_QUOTATION_DETAIL = `
  INSERT INTO quotation_details (quote_id, item_id, quantity, unit_price, total_price, unit_cost)
  VALUES ($1, $2, $3, $4, $5, COALESCE((SELECT cost_price FROM item WHERE item_id = $2), 0))
`;

exports.GET_QUOTATION_BY_ID = `
  SELECT q.*, qs.quote_status_name, rj.symptom_details, rj.actual_symptom
  FROM quotation q
  LEFT JOIN quotation_status qs ON q.quote_status_id = qs.quote_status_id
  LEFT JOIN repair_job rj ON q.job_id = rj.job_id
  WHERE q.quotation_id = $1
`;

exports.GET_QUOTATION_DETAILS = `
  SELECT qd.*, i.item_name, i.item_type_id, it.item_type_name
  FROM quotation_details qd
  LEFT JOIN item i ON qd.item_id = i.item_id
  LEFT JOIN item_type it ON i.item_type_id = it.item_type_id
  WHERE qd.quote_id = $1
`;

exports.BUILD_GET_ALL_QUOTATIONS = (whereClause = '') => `
  SELECT 
    q.*,
    rj.job_id,
    rj.status_id AS repair_status_id,
    s.status_name AS repair_status_name,
    rj.symptom_details,
    rj.actual_symptom,
    qs.quote_status_name,
    p.first_name, 
    p.last_name, 
    p.phone, 
    p.email,
    d.device_id, 
    d.model, 
    d.serial_number,
    b.brand_name AS brand,
    dt.device_type_name AS device_type
  FROM quotation q
  JOIN repair_job rj ON q.job_id = rj.job_id
  LEFT JOIN quotation_status qs ON q.quote_status_id = qs.quote_status_id
  LEFT JOIN status s ON rj.status_id = s.status_id
  LEFT JOIN device d ON rj.device_id = d.device_id
  LEFT JOIN device_types dt ON d.device_type_id = dt.device_type_id
  LEFT JOIN brands b ON d.brand_id = b.brand_id
  LEFT JOIN profiles p ON d.customer_id = p.id
  ${whereClause}
  ORDER BY q.quotation_id DESC
`;

exports.UPDATE_QUOTATION = `
  UPDATE quotation 
  SET total_repair_price = $1, 
      total_cancel_price = $2, 
      quote_status_id = $3
  WHERE quotation_id = $4
  RETURNING *
`;

exports.UPDATE_REPAIR_ON_QUOTATION_EDIT = `
  UPDATE repair_job 
  SET total_amount = $1,
      status_id = ${REPAIR_STATUS.PENDING_APPROVAL},
      actual_symptom = $2
  WHERE job_id = $3
`;

exports.DELETE_QUOTATION_DETAILS = `
  DELETE FROM quotation_details WHERE quote_id = $1
`;

exports.DELETE_QUOTATION = `
  DELETE FROM quotation WHERE quotation_id = $1
`;

exports.RESET_REPAIR_ON_DELETE_QUOTATION = `
  UPDATE repair_job 
  SET quotation_id = NULL, 
      total_amount = 0,
      status_id = ${REPAIR_STATUS.CHECKING}
  WHERE job_id = $1 OR quotation_id = $2
`;

// --- ใบเสนอราคาเดี่ยว ---
exports.FIND_QUOTE_STATUS_BY_ID = 'SELECT quote_status_id FROM quotation WHERE quotation_id = $1';

exports.FIND_QUOTATION_BY_ID = 'SELECT * FROM quotation WHERE quotation_id = $1';

/** ใบเสนอราคา + เจ้าของเครื่อง (ใช้ตรวจสิทธิ์ลูกค้าก่อนเปลี่ยนสถานะ) */
exports.FIND_QUOTATION_WITH_OWNER = `
  SELECT q.*, rj.job_id, d.customer_id, p.phone, p.email
  FROM quotation q
  LEFT JOIN repair_job rj ON q.job_id = rj.job_id
  LEFT JOIN device d ON rj.device_id = d.device_id
  LEFT JOIN profiles p ON d.customer_id = p.id
  WHERE q.quotation_id = $1
`;

/** ลูกค้าเปลี่ยนสถานะใบเสนอราคา (อนุมัติ/ยกเลิก/ขอแก้ไข) */
exports.UPDATE_QUOTE_STATUS = 'UPDATE quotation SET quote_status_id = $1, customer_remark = COALESCE($2, customer_remark) WHERE quotation_id = $3 RETURNING *';

exports.FIND_JOB_BY_QUOTATION_ID = 'SELECT job_id FROM repair_job WHERE quotation_id = $1';

// --- ซิงค์สถานะงานซ่อมตามการตัดสินใจของลูกค้า ---
exports.CANCEL_REPAIR_BY_QUOTATION = `
  UPDATE repair_job SET status_id = ${REPAIR_STATUS.CANCELLED}, total_amount = $2 WHERE job_id = $1 OR quotation_id = $3
`;

exports.APPROVE_REPAIR_BY_QUOTATION = `
  UPDATE repair_job SET status_id = ${REPAIR_STATUS.APPROVED_WAIT_REPAIR}, total_amount = CASE WHEN $2 > 0 THEN $2 ELSE total_amount END WHERE job_id = $1 OR quotation_id = $3
`;

exports.REQUEST_REVISION_REPAIR = `
  UPDATE repair_job SET status_id = ${REPAIR_STATUS.MAKING_QUOTE} WHERE job_id = $1 OR quotation_id = $2
`;

exports.RESET_REPAIR_TO_PENDING_APPROVAL = `
  UPDATE repair_job SET status_id = ${REPAIR_STATUS.PENDING_APPROVAL} WHERE job_id = $1 OR quotation_id = $2
`;

// --- บันทึกประวัติการกระทำ (repair_job_detail) ---
exports.LOG_UPDATE_QUOTATION = `
  INSERT INTO repair_job_detail (job_id, user_id, action_type_id, action_date, remark)
  VALUES ($1, $2, ${ACTION_TYPES.CREATE_QUOTE}, CURRENT_DATE, 'ช่างปรับปรุงใบเสนอราคาใหม่ รอลูกค้าอนุมัติ')
`;

exports.LOG_DELETE_QUOTATION = `
  INSERT INTO repair_job_detail (job_id, user_id, action_type_id, action_date, remark)
  VALUES ($1, $2, ${ACTION_TYPES.START_INSPECT}, CURRENT_DATE, 'ช่างลบใบเสนอราคา ถอยสถานะกลับเป็นดำเนินการตรวจเช็ค')
`;

exports.LOG_CUSTOMER_CANCEL = `
  INSERT INTO repair_job_detail (job_id, user_id, action_type_id, action_date, remark) VALUES ($1, $2, ${ACTION_TYPES.CUSTOMER_CANCEL}, CURRENT_DATE, $3)
`;

exports.LOG_CUSTOMER_APPROVE = `
  INSERT INTO repair_job_detail (job_id, user_id, action_type_id, action_date, remark) VALUES ($1, $2, ${ACTION_TYPES.START_REPAIR}, CURRENT_DATE, $3)
`;

exports.LOG_CUSTOMER_REQUEST_REVISION = `
  INSERT INTO repair_job_detail (job_id, user_id, action_type_id, action_date, remark) VALUES ($1, $2, ${ACTION_TYPES.CREATE_QUOTE}, CURRENT_DATE, $3)
`;
