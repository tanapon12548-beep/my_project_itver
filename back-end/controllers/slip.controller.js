const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ROLES } = require('../constants');
const slipQueries = require('../queries/slip.queries');

const slipsDir = path.join(__dirname, '..', 'public', 'slips');
if (!fs.existsSync(slipsDir)) {
  fs.mkdirSync(slipsDir, { recursive: true });
}

// Configure multer storage to save into /public with meaningful name
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, slipsDir);
  },
  filename: (req, file, cb) => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const jobId = req.body?.job_id || req.params?.job_id || 'general';
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    const meaningfulName = `slip_job_${jobId}_${dateStr}${ext}`;
    cb(null, meaningfulName);
  },
});

exports.upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('อนุญาตเฉพาะรูปภาพ (jpg, png, webp)'));
  },
});

/**
 * POST /api/slips
 */
exports.create = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'กรุณาอัปโหลดรูปสลิป' });
    }

    const rawFilename = req.file.filename;
    const filename = `slips/${rawFilename}`; // เก็บ path relative ลง DB
    const userId = req.user?.id;
    const jobId = req.body?.job_id;

    const { rows } = await pool.query(
      slipQueries.INSERT_SLIP,
      [userId, filename]
    );

    // หากมี job_id อัปเดตตาราง repair_job ด้วย
    if (jobId) {
      const numJobId = parseInt(jobId, 10);
      if (!isNaN(numJobId)) {
        await pool.query(
          slipQueries.UPDATE_JOB_SLIP,
          [filename, numJobId]
        );
      }
    }

    res.status(201).json({ success: true, data: rows[0], filename });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/slips
 */
exports.getAll = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { rows } = await pool.query(
      slipQueries.GET_SLIPS_BY_USER,
      [userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/slips/:id
 */
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({ success: false, message: 'ID สลิปไม่ถูกต้อง' });
    }

    const userId = req.user?.id;
    const roleId = req.user?.role_id;

    const { rows } = await pool.query(slipQueries.GET_SLIP_BY_ID, [numId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบสลิป' });
    }

    const slip = rows[0];
    if (roleId === ROLES.CUSTOMER && Number(slip.user_id) !== Number(userId)) {
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์ลบสลิปของลูกค้ารายอื่น' });
    }

    // ลบไฟล์ภาพจริงออกจากดิสก์เพื่อไม่ให้ค้างเป็นขยะ
    if (slip.image_url) {
      try {
        const filePath = path.join(__dirname, '..', 'public', slip.image_url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileErr) {
        console.warn('Could not delete slip file from disk:', fileErr.message);
      }
    }

    // เดิมใช้ตัวแปร `slipId` ที่ไม่มีอยู่จริง ทำให้ endpoint นี้ throw ReferenceError (500) ทุกครั้ง
    await pool.query(slipQueries.DELETE_SLIP, [numId]);
    res.json({ success: true, message: 'ลบสลิปสำเร็จ' });
  } catch (err) {
    next(err);
  }
};
