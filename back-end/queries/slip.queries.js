/**
 * queries/slip.queries.js
 * รวมคำสั่ง SQL Queries สำหรับโมดูลสลิปโอนเงิน (Slip)
 */
const { PAYMENT_METHODS } = require('../constants');

exports.INSERT_SLIP = `
  INSERT INTO slips_records (user_id, image_url) VALUES ($1, $2) RETURNING *
`;

/** ผูกสลิปเข้ากับงานซ่อม + ตั้งวิธีชำระเป็น "โอนเงิน" และลงวันที่ชำระ */
exports.UPDATE_JOB_SLIP = `
  UPDATE repair_job 
  SET slip_image = $1, payment_method_id = ${PAYMENT_METHODS.TRANSFER}, payment_date = CURRENT_DATE 
  WHERE job_id = $2
`;

exports.GET_SLIPS_BY_USER = 'SELECT * FROM slips_records WHERE user_id = $1 ORDER BY uploaded_at DESC';

exports.GET_SLIP_BY_ID = 'SELECT * FROM slips_records WHERE id = $1';

exports.DELETE_SLIP = 'DELETE FROM slips_records WHERE id = $1';
