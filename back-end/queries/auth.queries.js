/**
 * queries/auth.queries.js
 * รวมคำสั่ง SQL Queries สำหรับโมดูลยืนยันตัวตน (Auth)
 */
const { ROLES } = require('../constants');

exports.FIND_BY_EMAIL = 'SELECT id FROM profiles WHERE LOWER(email) = LOWER($1)';

exports.FIND_BY_PHONE = 'SELECT id FROM profiles WHERE phone = $1 LIMIT 1';

/** สมัครสมาชิกใหม่ (role เริ่มต้น = Customer) */
exports.INSERT_PROFILE = `
  INSERT INTO profiles (email, password, first_name, last_name, phone, role_id)
  VALUES ($1, $2, $3, $4, $5, ${ROLES.CUSTOMER})
  RETURNING id, email, first_name, last_name, phone, role_id
`;

/** เข้าสู่ระบบด้วยอีเมลหรือเบอร์โทร (ตัด first_name ออกเพื่อความปลอดภัย) */
exports.FIND_PROFILE_FOR_LOGIN = `
  SELECT p.*, r.name AS role_name 
  FROM profiles p 
  LEFT JOIN roles r ON p.role_id = r.id 
  WHERE LOWER(p.email) = LOWER($1) OR p.phone = $1
`;

exports.FIND_PROFILE_BY_ID = `
  SELECT p.id, p.email, p.first_name, p.last_name, p.phone, p.role_id, r.name AS role_name, p.created_at
  FROM profiles p
  LEFT JOIN roles r ON p.role_id = r.id
  WHERE p.id = $1
`;

// --- ลืมรหัสผ่าน / ตั้งรหัสผ่านใหม่ ---
exports.FIND_BY_EMAIL_AND_PHONE = 'SELECT id FROM profiles WHERE LOWER(email) = LOWER($1) AND phone = $2';

exports.DELETE_UNUSED_RESET_TOKENS = 'DELETE FROM password_reset_tokens WHERE user_id = $1 AND used = false';

exports.INSERT_RESET_TOKEN = 'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)';

exports.FIND_VALID_RESET_TOKEN = 'SELECT * FROM password_reset_tokens WHERE token = $1 AND used = false AND expires_at > NOW()';

exports.UPDATE_PASSWORD = 'UPDATE profiles SET password = $1 WHERE id = $2';

exports.MARK_RESET_TOKEN_USED = 'UPDATE password_reset_tokens SET used = true WHERE id = $1';

// --- ข้อมูลส่วนตัว ---
exports.FIND_PHONE_OWNED_BY_OTHER = 'SELECT id FROM profiles WHERE phone = $1 AND id != $2 LIMIT 1';

exports.UPDATE_PROFILE = `
  UPDATE profiles
  SET first_name = COALESCE($1, first_name),
      last_name = COALESCE($2, last_name),
      phone = COALESCE($3, phone)
  WHERE id = $4
  RETURNING id, email, first_name, last_name, phone, role_id
`;

exports.FIND_ROLE_NAME = `SELECT r.name AS role_name FROM roles r WHERE r.id = $1`;
