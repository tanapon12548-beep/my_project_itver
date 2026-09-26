const pool = require('../config/db');
const { ROLES } = require('../constants');

/**
 * GET /api/staff
 */
exports.getAll = async (req, res, next) => {
  try {
    // ดึงเฉพาะ Manager, Staff, และ Technician ไม่ดึง Customer
    const { rows } = await pool.query(
      `SELECT p.id, p.email, p.first_name, p.last_name, p.phone, p.role_id, r.name AS role_name, p.created_at
       FROM profiles p
       LEFT JOIN roles r ON p.role_id = r.id
       WHERE p.role_id IN (${ROLES.STAFF}, ${ROLES.TECHNICIAN},${ROLES.CUSTOMER})
       ORDER BY p.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/staff/:id
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string' || !id.trim()) {
      return res.status(400).json({ success: false, message: 'ID ผู้ใช้งานไม่ถูกต้อง' });
    }

    const { first_name, last_name, phone, role_id } = req.body;
    const cleanFirstName = first_name ? String(first_name).trim() : null;
    const cleanLastName = last_name ? String(last_name).trim() : null;
    const cleanPhone = phone ? String(phone).replace(/[^0-9]/g, '').slice(0, 10) : null;
    const parsedRoleId = role_id !== undefined ? parseInt(role_id, 10) : null;

    const { rows } = await pool.query(
      `UPDATE profiles 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           role_id = COALESCE($4, role_id)
       WHERE id = $5
       RETURNING id, email, first_name, last_name, phone, role_id`,
      [cleanFirstName, cleanLastName, cleanPhone, isNaN(parsedRoleId) ? null : parsedRoleId, id.trim()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งาน' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/staff/:id
 * ลบข้อมูลพนักงาน (Manager only)
 */
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string' || !id.trim()) {
      return res.status(400).json({ success: false, message: 'ID ผู้ใช้งานไม่ถูกต้อง' });
    }

    const cleanId = id.trim();

    // 1. ตรวจสอบว่าผู้ใช้งานนี้มีอยู่ในระบบหรือไม่
    const { rows } = await pool.query(
      'SELECT id, email, first_name, last_name, role_id FROM profiles WHERE id = $1',
      [cleanId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งานในระบบ' });
    }

    const targetUser = rows[0];

    // 2. ป้องกันไม่ให้ลบบัญชีตัวเอง
    if (req.user && req.user.id === cleanId) {
      return res.status(400).json({ success: false, message: 'ไม่สามารถลบบัญชีของตนเองได้' });
    }

    // 3. ป้องกันไม่ให้ลบผู้จัดการ (Manager)
    if (targetUser.role_id === ROLES.MANAGER) {
      return res.status(403).json({ success: false, message: 'ไม่สามารถลบบัญชีผู้จัดการ (Manager) ได้' });
    }

    // 4. ล้างความสัมพันธ์ foreign keys ที่เกี่ยวข้องอย่างปลอดภัย (Clean & Simple SQL)
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [cleanId]);
    await pool.query('UPDATE repair_job SET repairer_id = NULL WHERE repairer_id = $1', [cleanId]);
    await pool.query('UPDATE repair_job SET payment_verified_by = NULL WHERE payment_verified_by = $1', [cleanId]);
    await pool.query('UPDATE repair_job_detail SET user_id = NULL WHERE user_id = $1', [cleanId]);
    await pool.query('UPDATE slips_records SET user_id = NULL WHERE user_id = $1', [cleanId]);
    await pool.query('UPDATE device SET customer_id = NULL WHERE customer_id = $1', [cleanId]);

    // 5. ลบข้อมูลผู้ใช้งานออกจากตาราง profiles
    await pool.query('DELETE FROM profiles WHERE id = $1', [cleanId]);

    res.json({
      success: true,
      message: 'ลบข้อมูลผู้ใช้งานเรียบร้อยแล้ว',
      data: { id: cleanId, email: targetUser.email },
    });
  } catch (err) {
    next(err);
  }
};

exports.delete = exports.remove;
