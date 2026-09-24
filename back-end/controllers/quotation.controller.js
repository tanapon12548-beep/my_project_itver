const pool = require('../config/db');
const quotationQueries = require('../queries/quotation.queries');

/**
 * POST /api/quotations
 */
exports.create = async (req, res, next) => {
  try {
    const {
      job_id,
      total_repair_price,
      total_cancel_price,
      quote_status_id,
      items,
      parts,
      services,
      actual_symptom,
      symptom,
      total,
    } = req.body;

    const numJobId = parseInt(job_id, 10);
    if (isNaN(numJobId) || numJobId <= 0) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุรหัสงานซ่อมที่ถูกต้อง' });
    }

    const rawRepair = total_repair_price !== undefined ? total_repair_price : (req.body.type === 'cancel_check' ? 0 : (total || 0));
    const rawCancel = total_cancel_price !== undefined ? total_cancel_price : (req.body.type === 'cancel_check' ? (total || req.body.check_service_price || 300) : 300);
    const repairPrice = Math.max(0, parseFloat(rawRepair) || 0);
    const cancelPrice = Math.max(0, parseFloat(rawCancel) || 0);
    const diagnosedSymptom = (actual_symptom || symptom) ? String(actual_symptom || symptom).trim() : null;
    const safeQuoteStatus = quote_status_id ? parseInt(quote_status_id, 10) : 1;

    // 1. สร้าง quotation
    const qResult = await pool.query(
      quotationQueries.INSERT_QUOTATION,
      [numJobId, repairPrice, cancelPrice, isNaN(safeQuoteStatus) ? 1 : safeQuoteStatus]
    );

    const quotation = qResult.rows[0];

    // 2. อัปเดต repair_job (quotation_id, actual_symptom, total_amount, status_id = 4 [รอการอนุมัติ])
    await pool.query(
      quotationQueries.UPDATE_REPAIR_FOR_NEW_QUOTATION,
      [quotation.quotation_id, diagnosedSymptom, repairPrice || cancelPrice, numJobId]
    );

    // 3. รวม items จาก items หรือ parts + services
    let combinedItems = [];
    if (items && Array.isArray(items)) {
      combinedItems = items;
    } else {
      if (parts && Array.isArray(parts)) {
        for (const p of parts) {
          const qty = Math.max(0, parseInt(p.qty || 1, 10));
          const price = Math.max(0, parseFloat(p.price || 0));
          let itemId = p.item_id || null;
          if (!itemId && p.name) {
            const existItem = await pool.query(quotationQueries.FIND_ITEM_BY_NAME, [p.name.trim()]);
            if (existItem.rows.length > 0) {
              itemId = existItem.rows[0].item_id;
            } else {
              const newItem = await pool.query(quotationQueries.INSERT_NEW_ITEM, [p.name.trim(), price]);
              itemId = newItem.rows[0].item_id;
            }
          }
          combinedItems.push({
            item_id: itemId,
            quantity: qty,
            unit_price: price,
            total_price: price * qty,
          });
        }
      }
      if (services && Array.isArray(services)) {
        for (const s of services) {
          const qty = Math.max(0, parseInt(s.qty || 1, 10));
          const price = Math.max(0, parseFloat(s.price || 0));
          let itemId = s.item_id || null;
          if (!itemId && s.name) {
            const existItem = await pool.query(quotationQueries.FIND_ITEM_BY_NAME, [s.name.trim()]);
            if (existItem.rows.length > 0) {
              itemId = existItem.rows[0].item_id;
            } else {
              const newItem = await pool.query(
                'INSERT INTO item (item_name, item_type_id, selling_price) VALUES ($1, 2, $2) RETURNING item_id',
                [s.name.trim(), price]
              );
              itemId = newItem.rows[0].item_id;
            }
          }
          combinedItems.push({
            item_id: itemId,
            quantity: qty,
            unit_price: price,
            total_price: price * qty,
          });
        }
      }
    }

    // 4. Insert quotation_details
    for (const item of combinedItems) {
      await pool.query(
        quotationQueries.INSERT_QUOTATION_DETAIL,
        [quotation.quotation_id, item.item_id, item.quantity, item.unit_price, item.total_price]
      );
    }

    res.status(201).json({ success: true, data: quotation });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/quotations/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({ success: false, message: 'ID ใบเสนอราคาไม่ถูกต้อง' });
    }

    const { rows } = await pool.query(quotationQueries.GET_QUOTATION_BY_ID, [numId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบใบเสนอราคา' });
    }

    // ดึง details
    const detailsRes = await pool.query(quotationQueries.GET_QUOTATION_DETAILS, [numId]);

    const items = detailsRes.rows;
    const parts = items.filter(it => it.item_type_id === 1);
    const services = items.filter(it => it.item_type_id === 2);
    const total_parts = parts.reduce((sum, it) => sum + (parseFloat(it.total_price) || 0), 0);
    const total_services = services.reduce((sum, it) => sum + (parseFloat(it.total_price) || 0), 0);

    res.json({
      success: true,
      data: {
        ...rows[0],
        items,
        parts,
        services,
        total_parts,
        total_services,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/quotations
 * ดึงรายการใบเสนอราคาทั้งหมด (สำหรับช่าง/พนักงาน และลูกค้า)
 */
exports.getAll = async (req, res, next) => {
  try {
    const isCustomer = req.user && (req.user.role_id === 4 || req.user.role_name?.toLowerCase() === 'customer');
    const { status_id, search } = req.query;

    let whereClause = ' WHERE 1=1';
    const params = [];
    let paramIdx = 1;

    if (isCustomer) {
      whereClause += ` AND (d.customer_id = $${paramIdx++} OR (d.customer_id IS NULL AND (p.phone = $${paramIdx++} OR p.email = $${paramIdx++})))`;
      params.push(req.user.id, req.user.phone || '', req.user.email || '');
    }

    if (status_id && status_id !== 'all') {
      whereClause += ` AND q.quote_status_id = $${paramIdx++}`;
      params.push(parseInt(status_id, 10));
    }

    if (search && search.trim()) {
      const term = search.trim();
      whereClause += ` AND (
        'QUO-' || LPAD(q.quotation_id::text, 6, '0') ILIKE $${paramIdx}
        OR 'REP-' || LPAD(rj.job_id::text, 6, '0') ILIKE $${paramIdx}
        OR p.first_name ILIKE $${paramIdx}
        OR p.last_name ILIKE $${paramIdx}
        OR p.phone ILIKE $${paramIdx}
        OR d.model ILIKE $${paramIdx}
        OR b.brand_name ILIKE $${paramIdx}
      )`;
      params.push(`%${term}%`);
      paramIdx++;
    }

    const query = quotationQueries.BUILD_GET_ALL_QUOTATIONS(whereClause);
    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/quotations/:id
 * ช่างแก้ไข/ปรับปรุงใบเสนอราคาเดิม
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({ success: false, message: 'ID ใบเสนอราคาไม่ถูกต้อง' });
    }

    const {
      total_repair_price,
      total_cancel_price,
      quote_status_id,
      items,
      parts,
      services,
      actual_symptom,
      total,
    } = req.body;

    const rawRepair = total_repair_price !== undefined ? total_repair_price : (total || 0);
    const rawCancel = total_cancel_price !== undefined ? total_cancel_price : 300;
    const repairPrice = Math.max(0, parseFloat(rawRepair) || 0);
    const cancelPrice = Math.max(0, parseFloat(rawCancel) || 0);
    const nextQuoteStatus = quote_status_id ? parseInt(quote_status_id, 10) : 1;

    // 1. อัปเดตใบเสนอราคา
    const { rows } = await pool.query(
      quotationQueries.UPDATE_QUOTATION,
      [repairPrice, cancelPrice, isNaN(nextQuoteStatus) ? 1 : nextQuoteStatus, numId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบใบเสนอราคา' });
    }

    const quotation = rows[0];
    const jobId = quotation.job_id;

    // 2. อัปเดตตาราง repair_job: ดันสถานะเป็น 4 (รออนุมัติ) และอัปเดตยอดรวม + อาการเสียจริง
    if (jobId) {
      await pool.query(
        quotationQueries.UPDATE_REPAIR_ON_QUOTATION_EDIT,
        [repairPrice, actual_symptom || null, jobId]
      );

      try {
        await pool.query(
          `INSERT INTO repair_job_detail (job_id, user_id, action_type_id, action_date, remark)
           VALUES ($1, $2, 3, CURRENT_DATE, 'ช่างปรับปรุงใบเสนอราคาใหม่ รอลูกค้าอนุมัติ')`,
          [jobId, req.user?.id || null]
        );
      } catch (logErr) {
        console.warn('Could not log update quotation action:', logErr.message);
      }
    }

    // 3. รวม items ทั้งหมด
    let combinedItems = [];
    if (items && Array.isArray(items) && items.length > 0) {
      combinedItems = items;
    } else {
      if (parts && Array.isArray(parts)) {
        for (const p of parts) {
          const qty = Math.max(0, parseInt(p.qty || 1, 10));
          const price = Math.max(0, parseFloat(p.price || 0));
          let itemId = p.item_id || null;
          if (!itemId && p.name) {
            const existItem = await pool.query(quotationQueries.FIND_ITEM_BY_NAME, [p.name.trim()]);
            if (existItem.rows.length > 0) {
              itemId = existItem.rows[0].item_id;
            } else {
              const newItem = await pool.query(quotationQueries.INSERT_NEW_ITEM, [p.name.trim(), price]);
              itemId = newItem.rows[0].item_id;
            }
          }
          combinedItems.push({
            item_id: itemId,
            quantity: qty,
            unit_price: price,
            total_price: price * qty,
          });
        }
      }
      if (services && Array.isArray(services)) {
        for (const s of services) {
          const qty = Math.max(0, parseInt(s.qty || 1, 10));
          const price = Math.max(0, parseFloat(s.price || 0));
          let itemId = s.item_id || null;
          if (!itemId && s.name) {
            const existItem = await pool.query(quotationQueries.FIND_ITEM_BY_NAME, [s.name.trim()]);
            if (existItem.rows.length > 0) {
              itemId = existItem.rows[0].item_id;
            } else {
              const newItem = await pool.query(
                'INSERT INTO item (item_name, item_type_id, selling_price) VALUES ($1, 2, $2) RETURNING item_id',
                [s.name.trim(), price]
              );
              itemId = newItem.rows[0].item_id;
            }
          }
          combinedItems.push({
            item_id: itemId,
            quantity: qty,
            unit_price: price,
            total_price: price * qty,
          });
        }
      }
    }

    // 4. ลบของเก่าแล้วใส่ของใหม่
    if (combinedItems.length > 0) {
      await pool.query(quotationQueries.DELETE_QUOTATION_DETAILS, [numId]);
      for (const item of combinedItems) {
        await pool.query(
          quotationQueries.INSERT_QUOTATION_DETAIL,
          [numId, item.item_id, item.quantity, item.unit_price, item.total_price]
        );
      }
    }

    res.json({ success: true, message: 'ปรับปรุงใบเสนอราคาเรียบร้อยแล้ว', data: quotation });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/quotations/:id
 * ลบใบเสนอราคา
 */
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return res.status(400).json({ success: false, message: 'ID ใบเสนอราคาไม่ถูกต้อง' });
    }

    const { rows: qRows } = await pool.query('SELECT * FROM quotation WHERE quotation_id = $1', [numId]);
    if (qRows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบใบเสนอราคา' });
    }
    const q = qRows[0];

    // ลบรายละเอียดใบเสนอราคา
    await pool.query(quotationQueries.DELETE_QUOTATION_DETAILS, [numId]);

    // ปลดการเชื่อมโยงจาก repair_job และถอยสถานะเป็น 2 (ดำเนินการตรวจเช็ค)
    if (q.job_id) {
      await pool.query(quotationQueries.RESET_REPAIR_ON_DELETE_QUOTATION, [q.job_id, numId]);

      try {
        await pool.query(
          `INSERT INTO repair_job_detail (job_id, user_id, action_type_id, action_date, remark)
           VALUES ($1, $2, 2, CURRENT_DATE, 'ช่างลบใบเสนอราคา ถอยสถานะกลับเป็นดำเนินการตรวจเช็ค')`,
          [q.job_id, req.user?.id || null]
        );
      } catch (logErr) {
        console.warn('Could not log delete quotation action:', logErr.message);
      }
    }

    // ลบใบเสนอราคา
    await pool.query(quotationQueries.DELETE_QUOTATION, [numId]);

    res.json({ success: true, message: 'ลบใบเสนอราคาเรียบร้อยแล้ว' });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/quotations/:id/status
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({ success: false, message: 'ID ใบเสนอราคาไม่ถูกต้อง' });
    }

    const { quote_status_id, customer_remark } = req.body;
    const statusNum = parseInt(quote_status_id, 10);
    if (isNaN(statusNum)) {
      return res.status(400).json({ success: false, message: 'สถานะใบเสนอราคาไม่ถูกต้อง' });
    }
    const cleanRemark = customer_remark ? String(customer_remark).trim() : null;

    const { rows } = await pool.query(
      'UPDATE quotation SET quote_status_id = $1, customer_remark = COALESCE($2, customer_remark) WHERE quotation_id = $3 RETURNING *',
      [statusNum, cleanRemark, numId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบใบเสนอราคา' });
    }

    const quotation = rows[0];
    let jobId = quotation.job_id;

    if (!jobId) {
      const rjRes = await pool.query('SELECT job_id FROM repair_job WHERE quotation_id = $1', [numId]);
      if (rjRes.rows.length > 0) {
        jobId = rjRes.rows[0].job_id;
      }
    }

    // Logic จัดการ Status งานซ่อมหลัก
    if (statusNum === 3) {
      const cancelPrice = Number(quotation.total_cancel_price) || 300;
      await pool.query(
        'UPDATE repair_job SET status_id = 9, total_amount = $2 WHERE job_id = $1 OR quotation_id = $3',
        [jobId, cancelPrice, id]
      );
      if (jobId) {
        try {
          await pool.query(
            'INSERT INTO repair_job_detail (job_id, user_id, action_type_id, action_date, remark) VALUES ($1, $2, 8, CURRENT_DATE, $3)',
            [jobId, req.user?.id || null, `ลูกค้ายกเลิกซ่อม: ${customer_remark || 'ไม่ระบุ'}`]
          );
        } catch (e) {
          console.warn('Could not log cancel action:', e.message);
        }
      }
    } else if (statusNum === 2) {
      const repairPrice = Number(quotation.total_repair_price) || 0;
      await pool.query(
        'UPDATE repair_job SET status_id = 5, total_amount = CASE WHEN $2 > 0 THEN $2 ELSE total_amount END WHERE job_id = $1 OR quotation_id = $3',
        [jobId, repairPrice, id]
      );
      if (jobId) {
        try {
          await pool.query(
            'INSERT INTO repair_job_detail (job_id, user_id, action_type_id, action_date, remark) VALUES ($1, $2, 4, CURRENT_DATE, $3)',
            [jobId, req.user?.id || null, 'ลูกค้าอนุมัติการซ่อม']
          );
        } catch (e) {
          console.warn('Could not log approve action:', e.message);
        }
      }
    } else if (statusNum === 4 || statusNum === 5) {
      await pool.query('UPDATE repair_job SET status_id = 3 WHERE job_id = $1 OR quotation_id = $2', [jobId, id]);
      if (jobId) {
        try {
          await pool.query(
            'INSERT INTO repair_job_detail (job_id, user_id, action_type_id, action_date, remark) VALUES ($1, $2, 3, CURRENT_DATE, $3)',
            [jobId, req.user?.id || null, `ลูกค้าขอแก้ไข/ตีกลับใบเสนอราคา: ${customer_remark || 'ขอแก้ไขรายการ'}`]
          );
        } catch (e) {
          console.warn('Could not log request modification action:', e.message);
        }
      }
    } else if (statusNum === 1) {
      await pool.query('UPDATE repair_job SET status_id = 4 WHERE job_id = $1 OR quotation_id = $2', [jobId, id]);
    }

    res.json({ success: true, message: 'อัปเดตสถานะใบเสนอราคาเรียบร้อยแล้ว', data: quotation });
  } catch (err) {
    next(err);
  }
};
