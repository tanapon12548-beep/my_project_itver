/**
 * queries/payment.queries.js
 * รวมคำสั่ง SQL Queries สำหรับโมดูลการชำระเงิน (Payment)
 */

exports.CHECK_JOB_PAYMENT_STATUS = `
  SELECT status_id, payment_method_id FROM repair_job WHERE job_id = $1
`;

exports.UPDATE_PAYMENT_INFO = `
  UPDATE repair_job
  SET status_id = 7,
      payment_method_id = $1,
      payment_date = CURRENT_DATE,
      slip_image = COALESCE($2, slip_image),
      appointment_date = CASE 
        WHEN $3::text IS NOT NULL AND $3::text != '' AND $3::text != 'undefined' AND $3::text != 'null' 
        THEN $3::date 
        ELSE appointment_date 
      END,
      payment_verified = false,
      payment_reject_reason = NULL
  WHERE job_id = $4
`;

exports.INSERT_PAYMENT_ACTION_LOG = `
  INSERT INTO repair_job_detail (job_id, user_id, action_type_id, action_date)
  VALUES ($1, $2, 6, CURRENT_DATE)
`;

exports.INSERT_SLIP_RECORD = `
  INSERT INTO slips_records (user_id, image_url) VALUES ($1, $2)
`;

exports.VERIFY_PAYMENT = `
  UPDATE repair_job 
  SET payment_verified = true, payment_verified_by = $1, payment_verified_at = NOW()
  WHERE job_id = $2
  RETURNING *
`;

exports.VERIFY_PAYMENT_ACTION_LOG = `
  INSERT INTO repair_job_detail (job_id, user_id, action_type_id, action_date, remark)
  VALUES ($1, $2, 6, CURRENT_DATE, $3)
`;

exports.REJECT_PAYMENT = `
  UPDATE repair_job 
  SET payment_method_id = NULL, 
      slip_image = NULL, 
      payment_date = NULL,
      payment_verified = false,
      payment_verified_by = NULL,
      payment_verified_at = NULL,
      payment_reject_reason = $1
  WHERE job_id = $2
  RETURNING *
`;

exports.REJECT_PAYMENT_ACTION_LOG = `
  INSERT INTO repair_job_detail (job_id, user_id, action_type_id, action_date, remark)
  VALUES ($1, $2, 6, CURRENT_DATE, $3)
`;
