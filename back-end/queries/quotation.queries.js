/**
 * queries/quotation.queries.js
 * รวมคำสั่ง SQL Queries สำหรับโมดูลใบเสนอราคา (Quotation)
 */

exports.INSERT_QUOTATION = `
  INSERT INTO quotation (job_id, total_repair_price, total_cancel_price, quote_status_id)
  VALUES ($1, $2, $3, $4)
  RETURNING *
`;

exports.UPDATE_REPAIR_FOR_NEW_QUOTATION = `
  UPDATE repair_job 
  SET quotation_id = $1,
      actual_symptom = COALESCE($2, actual_symptom),
      total_amount = $3,
      status_id = 4
  WHERE job_id = $4
`;

exports.FIND_ITEM_BY_NAME = `
  SELECT item_id FROM item WHERE LOWER(TRIM(item_name)) = LOWER(TRIM($1))
`;

exports.INSERT_NEW_ITEM = `
  INSERT INTO item (item_name, item_type_id, selling_price) VALUES ($1, $2, $3) RETURNING item_id
`;

exports.INSERT_QUOTATION_DETAIL = `
  INSERT INTO quotation_details (quote_id, item_id, quantity, unit_price, total_price)
  VALUES ($1, $2, $3, $4, $5)
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
    'QUO-' || LPAD(q.quotation_id::text, 6, '0') AS quote_no,
    'REP-' || LPAD(rj.job_id::text, 6, '0') AS job_no,
    rj.status_id AS repair_status_id,
    s.status_name AS repair_status_name,
    rj.symptom_details,
    rj.actual_symptom,
    COALESCE(qs.quote_status_name, 'รอการอนุมัติ') AS quote_status_name,
    COALESCE(p.first_name || ' ' || p.last_name, 'ไม่ระบุ') AS customer_name,
    p.first_name, p.last_name, p.phone, p.email,
    d.device_id, d.model, d.serial_number,
    COALESCE(b.brand_name, '-') AS brand,
    COALESCE(dt.device_type_name, '-') AS device_type,
    COALESCE(q.total_repair_price, 0) AS total_parts,
    0 AS total_services,
    0 AS item_count
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
      status_id = 4,
      actual_symptom = COALESCE($2, actual_symptom)
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
      status_id = 2
  WHERE job_id = $1 OR quotation_id = $2
`;
