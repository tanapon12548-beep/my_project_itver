const pool = require('../config/db');
const dashboardQueries = require('../queries/dashboard.queries');
const { REPAIR_STATUS, QUOTE_STATUS } = require('../constants');

/**
 * เขตเวลาของร้าน (ไทย)
 * หมายเหตุสำคัญ: TIMEZONE ของ session ในฐานข้อมูลชุดนี้ไม่ใช่เวลาไทย (เป็น UTC-1)
 * ถ้าใช้ TO_CHAR()/CURRENT_DATE ตรง ๆ วันของงานที่ทำช่วง 00:00-07:00 น. จะถูกนับเป็นวันก่อนหน้า
 * จึงต้องผ่าน AT TIME ZONE 'Asia/Bangkok' ทุกครั้งก่อนตัดวัน
 */
const TZ = 'Asia/Bangkok';

/** วันปัจจุบันตามเวลาไทย (date) */
const LOCAL_TODAY_SQL = `(now() AT TIME ZONE '${TZ}')::date`;

/**
 * คอลัมน์วันที่ที่ใช้รับรู้ "รายได้"
 * ลำดับ: ส่งมอบเครื่อง (return_date) → ซ่อมเสร็จ (repaired_at) → ชำระเงิน (payment_date) → รับเครื่อง (created_at)
 * จำเป็นต้องมี fallback เพราะ repaired_at ถูกบันทึกไม่ครบ (งานที่ปิดแล้วส่วนใหญ่เป็น null)
 */
const REVENUE_DATE_COL = 'COALESCE(rj.return_date, rj.repaired_at, rj.payment_date, rj.created_at)';

/**
 * แปลงคอลัมน์วันที่ให้เป็น date ตามเวลาไทย
 * @param {boolean} isPlainDate คอลัมน์เป็น type date อยู่แล้ว (เช่น repair_job_detail.action_date) ไม่ต้องแปลง TZ
 */
function toLocalDate(column, isPlainDate = false) {
  return isPlainDate ? `(${column})` : `((${column}) AT TIME ZONE '${TZ}')::date`;
}

/** จัดรูปแบบวันที่เป็น YYYY-MM-DD ด้วยเวลา local ของเครื่อง (ไม่ใช้ toISOString เพื่อกันวันเพี้ยน) */
function formatISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** อ่านค่า YYYY-MM-DD เป็น Date เวลา local ของเครื่อง */
function parseISODate(value) {
  const [y, m, d] = String(value).split('-').map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}

/** วันแรกของเดือน วันนี้ และวันสุดท้ายของเดือน ตามเวลาไทย (ใช้สร้างแกนกราฟรายวัน) */
async function getLocalMonthRange() {
  const { rows } = await pool.query(
    `SELECT to_char(DATE_TRUNC('month', ${LOCAL_TODAY_SQL}), 'YYYY-MM-DD') AS first_day,
            to_char(${LOCAL_TODAY_SQL}, 'YYYY-MM-DD') AS today,
            to_char((DATE_TRUNC('month', ${LOCAL_TODAY_SQL}) + INTERVAL '1 month' - INTERVAL '1 day')::date, 'YYYY-MM-DD') AS last_day`
  );
  return { firstDay: rows[0].first_day, today: rows[0].today, lastDay: rows[0].last_day };
}

/**
 * รวมฟังก์ชันสร้างเงื่อนไขตัวกรองวันที่ ช่วงเวลา (day/month/year) และประเภทอุปกรณ์
 * เพื่อให้กราฟและรายงานทุกตัวกรองตรงกันและซิงค์ไปด้วยกันทั้งหมด
 * @param {boolean} isPlainDate ส่ง true เมื่อ dateCol เป็นคอลัมน์ type date อยู่แล้ว
 */
function buildDateAndDeviceConditions(
  query,
  dateCol = 'rj.created_at',
  devCol = 'dt.device_type_name',
  isPlainDate = false
) {
  const { period, date_start, date_end, device_type } = query;
  let conditions = '';
  const params = [];
  let paramIdx = 1;

  const localDate = toLocalDate(dateCol, isPlainDate);
  const hasDateStart = Boolean(date_start && String(date_start).trim());
  const hasDateEnd = Boolean(date_end && String(date_end).trim());

  // เลือกช่วงวันที่เอง → เทียบเป็น date ตรง ๆ (รวมวันสุดท้ายเต็มวัน ไม่ต้อง + interval '1 day')
  if (hasDateStart) {
    conditions += ` AND ${localDate} >= $${paramIdx++}::date`;
    params.push(String(date_start).trim());
  }
  if (hasDateEnd) {
    conditions += ` AND ${localDate} <= $${paramIdx++}::date`;
    params.push(String(date_end).trim());
  }

  // หากไม่ได้ระบุช่วงวันที่ชัดเจน ให้กรองตาม period (วัน=เดือนปัจจุบัน, เดือน=ปีนี้, ปี=5 ปีย้อนหลัง)
  if (!hasDateStart && !hasDateEnd) {
    if (period === 'day') {
      conditions += ` AND ${localDate} >= DATE_TRUNC('month', ${LOCAL_TODAY_SQL})::date`;
    } else if (period === 'month') {
      conditions += ` AND ${localDate} >= DATE_TRUNC('year', ${LOCAL_TODAY_SQL})::date`;
    } else if (period === 'year') {
      conditions += ` AND ${localDate} >= (DATE_TRUNC('year', ${LOCAL_TODAY_SQL}) - INTERVAL '4 years')::date`;
    }
  }

  // กรองตามประเภทอุปกรณ์
  // รับได้ทั้งคีย์เดิม (pc / laptop / printer) และ "ชื่อประเภทอุปกรณ์จริง" จากตาราง device_types
  if (device_type && device_type !== 'all') {
    if (device_type === 'pc') {
      conditions += ` AND (LOWER(${devCol}) LIKE '%desktop%' OR LOWER(${devCol}) LIKE '%pc%')`;
    } else if (device_type === 'laptop') {
      conditions += ` AND (LOWER(${devCol}) LIKE '%notebook%' OR LOWER(${devCol}) LIKE '%laptop%')`;
    } else if (device_type === 'printer') {
      conditions += ` AND (LOWER(${devCol}) LIKE '%printer%' OR LOWER(${devCol}) LIKE '%print%')`;
    } else {
      // ชื่อประเภทจริงจากฐานข้อมูล → เทียบชื่อตรงตัว (ตัดช่องว่างหัวท้ายให้แล้ว)
      conditions += ` AND LOWER(${devCol}) = LOWER($${paramIdx++})`;
      params.push(String(device_type).trim());
    }
  }

  return { conditions, params, localDate };
}

/**
 * สิทธิ์ดู "ข้อมูลการเงิน" (รายได้ / ต้นทุนอะไหล่ / กำไร / มูลค่าอะไหล่)
 * เปิดให้เฉพาะ role "Manager" เท่านั้น
 *
 * ตัดสินจาก role ที่แนบมากับ JWT (req.user จาก auth middleware) เท่านั้น
 * ไม่ใช้ query param `role` เพราะ client ปลอมค่าได้ (role param เหลือไว้เพื่อความเข้ากันได้ของ API เดิม)
 */
function canViewRevenue(req) {
  return String(req.user?.role_name || '').toLowerCase() === 'manager';
}

/**
 * GET /api/dashboard/metrics
 */
exports.getMetrics = async (req, res, next) => {
  try {
    // จำนวนงาน → นับตามวันรับเครื่อง (created_at)
    const { conditions, params } = buildDateAndDeviceConditions(req.query, 'rj.created_at', 'dt.device_type_name');

    const query = dashboardQueries.BUILD_METRICS_QUERY(conditions);
    const { rows: jobs } = await pool.query(query, params);

    const totalJobs = jobs.length;
    let completedJobs = 0;
    let pendingJobs = 0;

    const pendingStatusIds = [
      REPAIR_STATUS.PENDING_CHECK,
      REPAIR_STATUS.CHECKING,
      REPAIR_STATUS.MAKING_QUOTE,
      REPAIR_STATUS.PENDING_APPROVAL,
      REPAIR_STATUS.APPROVED_WAIT_REPAIR,
      REPAIR_STATUS.WAITING_PAYMENT,
      REPAIR_STATUS.READY_FOR_PICKUP,
    ];

    // Calculate metrics
    jobs.forEach(job => {
      if (job.status_id === REPAIR_STATUS.COMPLETED) {
        completedJobs++;
      }
      if (pendingStatusIds.includes(job.status_id)) {
        pendingJobs++;
      }
    });

    // ── ข้อมูลการเงิน (รายได้ / ต้นทุน / กำไร) ── เปิดเฉพาะผู้จัดการ
    const showRevenue = canViewRevenue(req);

    // รายได้ + ต้นทุนอะไหล่ → คิดจาก "วันรับรู้รายได้" (ส่งมอบ/ซ่อมเสร็จ/ชำระ/รับเครื่อง)
    // เพื่อให้ยอด KPI ตรงกับกราฟแนวโน้มรายได้ที่ใช้คอลัมน์วันที่เดียวกัน
    let totalRevenue = 0;
    let partsCost = 0;
    let grossProfit = 0;

    if (showRevenue) {
      const { conditions: revenueConditions, params: revenueParams } = buildDateAndDeviceConditions(
        req.query,
        REVENUE_DATE_COL,
        'dt.device_type_name'
      );

      // กำไรขั้นต้น = รายรับรวม - ต้นทุนอะไหล่
      // นับเฉพาะใบเสนอราคาที่ "ลูกค้าอนุมัติแล้ว" เพราะงานที่ถูกยกเลิกจะยังมีรายการอะไหล่ค้างในใบ
      // แต่ของจริงไม่ได้ถูกติดตั้ง (ยอดที่เก็บจากงานที่ยกเลิกคือค่าตรวจเช็คเท่านั้น)
      // หมายเหตุ: ต้องแยก CTE เพื่อกันแถวทวีคูณจากการ join repair_job กับ quotation_details ตรง ๆ
      const revenueQuery = `
        WITH revenue_jobs AS (
          SELECT rj.job_id, rj.total_amount
          FROM repair_job rj
          LEFT JOIN device d ON rj.device_id = d.device_id
          LEFT JOIN device_types dt ON d.device_type_id = dt.device_type_id
          WHERE rj.status_id = ${REPAIR_STATUS.COMPLETED} ${revenueConditions}
        ),
        job_parts_cost AS (
          SELECT q.job_id,
                 SUM(
                   COALESCE(qd.quantity, 1)
                   -- ใช้ต้นทุนที่ snapshot ไว้ตอนเสนอราคา ถ้ามี; ถ้าใบเก่ายังไม่มี ให้ใช้ราคาทุนปัจจุบันจากคลังอะไหล่
                   * COALESCE(NULLIF(qd.unit_cost, 0), i.cost_price, 0)
                 ) AS cost
          FROM quotation q
          JOIN quotation_details qd ON qd.quote_id = q.quotation_id
          LEFT JOIN item i ON i.item_id = qd.item_id
          WHERE q.quote_status_id = ${QUOTE_STATUS.APPROVED}
          GROUP BY q.job_id
        )
        SELECT
          COALESCE(SUM(rj.total_amount), 0)::float AS revenue,
          COALESCE(SUM(COALESCE(pc.cost, 0)), 0)::float AS parts_cost
        FROM revenue_jobs rj
        LEFT JOIN job_parts_cost pc ON pc.job_id = rj.job_id
      `;
      const { rows: revenueRows } = await pool.query(revenueQuery, revenueParams);
      totalRevenue = Number(revenueRows[0]?.revenue) || 0;
      partsCost = Number(revenueRows[0]?.parts_cost) || 0;
      grossProfit = totalRevenue - partsCost;
    }

    res.json({
      success: true,
      data: {
        canViewRevenue: showRevenue,
        // ส่งฟิลด์การเงินเฉพาะผู้จัดการ — พนักงานจะไม่ได้รับค่านี้ไปที่เครื่องเลย
        ...(showRevenue ? { totalRevenue, partsCost, grossProfit } : {}),
        totalJobs,
        completedJobs,
        pendingJobs,
      },
    });
  } catch (err) {
    next(err);
  }
};

/** จำนวนวันสูงสุดที่ยอมให้วาดในโหมดรายวัน (กันกราฟ 365 จุดบนมือถือ) */
const MAX_DAY_POINTS = 92;

/** ชื่อเดือนแบบย่อ (ใช้เป็น label ของแกนรายเดือน) */
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * GET /api/dashboard/trend
 * แสดงแนวโน้มวัน เดือน ปี แบบเต็มช่วง รองรับการกรอง
 *
 * หมายเหตุโลจิกสำคัญ 2 ข้อ:
 *  1) โหมดรายวันต้อง group ด้วยวันที่เต็ม (YYYY-MM-DD) ไม่ใช่ TO_CHAR(...,'DD')
 *     เพราะ 'DD' จะยุบวันที่ของคนละเดือน (17 ก.ย. กับ 17 ต.ค.) ให้เป็นช่องเดียวกัน ทำให้ข้อมูลไปโผล่ผิดวัน
 *  2) แนวโน้มรายได้ต้องคิดจาก "วันรับรู้รายได้" (วันส่งมอบ/ซ่อมเสร็จ/ชำระ) ไม่ใช่วันรับเครื่อง
 */
exports.getTrend = async (req, res, next) => {
  try {
    const { period, metric_type = 'count', date_start, date_end } = req.query;

    const safePeriod = ['day', 'month', 'year'].includes(period) ? period : 'day';
    const safeMetric = metric_type === 'revenue' ? 'revenue' : 'count';

    // แนวโน้มรายได้ = ข้อมูลการเงิน → เปิดเฉพาะผู้จัดการ
    if (safeMetric === 'revenue' && !canViewRevenue(req)) {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลรายได้',
      });
    }

    const selectExpr = safeMetric === 'revenue'
      ? `COALESCE(SUM(CASE WHEN rj.status_id = ${REPAIR_STATUS.COMPLETED} THEN rj.total_amount ELSE 0 END), 0) AS value`
      : "COUNT(*) AS value";

    // รายได้ → วันรับรู้รายได้, จำนวนงาน → วันรับเครื่อง
    const metricDateCol = safeMetric === 'revenue' ? REVENUE_DATE_COL : 'rj.created_at';

    const { conditions: whereConditions, params, localDate } = buildDateAndDeviceConditions(
      req.query,
      metricDateCol,
      'dt.device_type_name'
    );

    let result = [];

    if (safePeriod === 'day') {
      const hasDateStart = Boolean(date_start && String(date_start).trim());
      const hasDateEnd = Boolean(date_end && String(date_end).trim());

      // จัดกลุ่มด้วยวันที่เต็มเสมอ (YYYY-MM-DD) แล้วค่อย map กับวันในแกน
      const isoLabel = `TO_CHAR(${localDate}, 'YYYY-MM-DD')`;
      const query = dashboardQueries.BUILD_TREND_QUERY({
        labelFormat: isoLabel,
        selectExpr,
        whereConditions,
        groupBy: isoLabel,
      });
      const { rows } = await pool.query(query, params);
      const valueMap = new Map();
      rows.forEach((r) => valueMap.set(r.label, Math.round(parseFloat(r.value) || 0)));

      // ไม่ได้ระบุช่วงวันที่ → เดือนปัจจุบัน 1 → วันสุดท้ายของเดือน (ตามเวลาไทย)
      // เติมช่องวันในอนาคตเป็น 0 เพื่อให้เห็นแกนเต็มเดือน 1-31 (ไม่ได้หมายความว่ามียอดขาย)
      const monthRange = hasDateStart && hasDateEnd ? null : await getLocalMonthRange();
      const range = {
        firstDay: hasDateStart ? String(date_start).trim() : monthRange.firstDay,
        lastDay: hasDateEnd ? String(date_end).trim() : monthRange.lastDay,
      };

      const lastDay = parseISODate(range.lastDay);
      let cursor = parseISODate(range.firstDay);

      // กันช่วงวันที่ยาวเกินจนกราฟมีจุดเยิ่นเย้อบนมือถือ → เก็บเฉพาะท้ายช่วง
      const spanDays = Math.round((lastDay.getTime() - cursor.getTime()) / 86400000) + 1;
      if (spanDays > MAX_DAY_POINTS) {
        cursor = new Date(lastDay);
        cursor.setDate(cursor.getDate() - (MAX_DAY_POINTS - 1));
      }
      const totalDays = Math.round((lastDay.getTime() - cursor.getTime()) / 86400000) + 1;

      while (cursor <= lastDay) {
        const isoKey = formatISODate(cursor);
        const dayNum = cursor.getDate();
        result.push({
          label: totalDays <= 31 ? String(dayNum) : `${dayNum}/${cursor.getMonth() + 1}`,
          value: valueMap.get(isoKey) || 0,
          full_date: isoKey,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
    } else if (safePeriod === 'month') {
      // จัดกลุ่มด้วย ปี-เดือน เพื่อไม่ให้เดือนของคนละปีถูกยุบรวมกัน
      const monthLabel = `TO_CHAR(${localDate}, 'YYYY-MM')`;
      const query = dashboardQueries.BUILD_TREND_QUERY({
        labelFormat: monthLabel,
        selectExpr,
        whereConditions,
        groupBy: monthLabel,
      });
      const { rows } = await pool.query(query, params);
      const valueMap = new Map();
      rows.forEach((r) => valueMap.set(r.label, Math.round(parseFloat(r.value) || 0)));

      const hasDateRange = Boolean(
        date_start && String(date_start).trim() && date_end && String(date_end).trim()
      );
      const today = parseISODate((await getLocalMonthRange()).today);

      let startMonth;
      let endMonth;
      if (hasDateRange) {
        startMonth = parseISODate(date_start);
        endMonth = parseISODate(date_end);
      } else {
        startMonth = new Date(today.getFullYear(), 0, 1); // ม.ค. ของปีนี้
        endMonth = today; // ถึงเดือนปัจจุบัน (ไม่เติมเดือนในอนาคต)
      }
      if (startMonth > endMonth) [startMonth, endMonth] = [endMonth, startMonth];

      const crossesYears = startMonth.getFullYear() !== endMonth.getFullYear();
      const cursor = new Date(startMonth.getFullYear(), startMonth.getMonth(), 1);
      const last = new Date(endMonth.getFullYear(), endMonth.getMonth(), 1);
      while (cursor <= last) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
        result.push({
          label: crossesYears
            ? `${MONTH_NAMES[cursor.getMonth()]} ${String(cursor.getFullYear()).slice(2)}`
            : MONTH_NAMES[cursor.getMonth()],
          value: valueMap.get(key) || 0,
        });
        cursor.setMonth(cursor.getMonth() + 1);
      }
    } else if (safePeriod === 'year') {
      const yearLabel = `TO_CHAR(${localDate}, 'YYYY')`;
      const query = dashboardQueries.BUILD_TREND_QUERY({
        labelFormat: yearLabel,
        selectExpr,
        whereConditions,
        groupBy: yearLabel,
      });
      const { rows } = await pool.query(query, params);
      const valueMap = new Map();
      rows.forEach((r) => valueMap.set(r.label, Math.round(parseFloat(r.value) || 0)));

      const hasDateRange = Boolean(
        date_start && String(date_start).trim() && date_end && String(date_end).trim()
      );
      const today = parseISODate((await getLocalMonthRange()).today);

      let startYear;
      let endYear;
      if (hasDateRange) {
        startYear = parseISODate(date_start).getFullYear();
        endYear = parseISODate(date_end).getFullYear();
      } else {
        startYear = today.getFullYear() - 4; // 5 ปีล่าสุด
        endYear = today.getFullYear();
      }
      if (startYear > endYear) [startYear, endYear] = [endYear, startYear];

      for (let y = startYear; y <= endYear; y++) {
        result.push({
          label: String(y),
          value: valueMap.get(String(y)) || 0,
        });
      }
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/parts-usage
 * ดูสถิติการใช้อะไหล่ในงานซ่อม (กี่ชิ้น)
 */
exports.getPartsUsage = async (req, res, next) => {
  try {
    const { conditions: whereConditions, params } = buildDateAndDeviceConditions(req.query, 'rj.created_at', 'dt.device_type_name');

    const query = `
      SELECT 
        i.item_id,
        i.item_name,
        SUM(COALESCE(qd.quantity, 1)::numeric)::int AS total_quantity,
        COUNT(DISTINCT q.job_id)::int AS jobs_count,
        SUM(COALESCE(qd.total_price, 0)::numeric)::float AS total_cost
      FROM quotation_details qd
      JOIN quotation q ON qd.quote_id = q.quotation_id
      JOIN repair_job rj ON q.job_id = rj.job_id
      LEFT JOIN device d ON rj.device_id = d.device_id
      LEFT JOIN device_types dt ON d.device_type_id = dt.device_type_id
      JOIN item i ON qd.item_id = i.item_id
      WHERE i.item_type_id = 1
        AND q.quote_status_id = ${QUOTE_STATUS.APPROVED} ${whereConditions}
      GROUP BY i.item_id, i.item_name
      ORDER BY total_quantity DESC, total_cost DESC
      LIMIT 10;
    `;

    const { rows } = await pool.query(query, params);

    // มูลค่าอะไหล่ (ราคาขาย) = ข้อมูลการเงิน → ส่งเป็น 0 ให้พนักงาน (เจ้าหน้าที่เห็นแค่จำนวนชิ้น)
    const showMoney = canViewRevenue(req);

    res.json({
      success: true,
      data: rows.map((r) => ({
        item_id: r.item_id,
        item_name: r.item_name,
        total_quantity: Number(r.total_quantity) || 0,
        jobs_count: Number(r.jobs_count) || 0,
        total_cost: showMoney ? Number(r.total_cost) || 0 : 0,
        unit: 'ชิ้น',
      })),
    });
  } catch (err) {
    next(err);
  }
};


/**
 * GET /api/dashboard/category
 */
exports.getCategory = async (req, res, next) => {
  try {
    const { conditions: whereConditions, params } = buildDateAndDeviceConditions(req.query, 'rj.created_at', 'dt.device_type_name');

    const query = dashboardQueries.BUILD_CATEGORY_QUERY(whereConditions);
    const { rows } = await pool.query(query, params);

    // Summarize into pc / laptop / printer / other
    let pcCount = 0;
    let laptopCount = 0;
    let printerCount = 0;
    let otherCount = 0;

    rows.forEach(row => {
      const typeString = row.device_type.toLowerCase();
      const count = parseInt(row.count, 10);

      if (typeString.includes('desktop') || typeString.includes('pc')) {
        pcCount += count;
      } else if (typeString.includes('notebook') || typeString.includes('laptop')) {
        laptopCount += count;
      } else if (typeString.includes('printer') || typeString.includes('print')) {
        printerCount += count;
      } else {
        otherCount += count;
      }
    });

    const total = pcCount + laptopCount + printerCount + otherCount;

    res.json({
      success: true,
      data: {
        total,
        pc: pcCount,
        laptop: laptopCount,
        printer: printerCount,
        other: otherCount,
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/work-activity
 * ดูวันเคลื่อนงานรายบุคคลจาก repair_job_detail (ใช้แทนการลงเวลาเข้างาน
 * โดยไม่ต้องเพิ่มตารางใหม่) — หน่วย: วัน
 */
exports.getWorkActivity = async (req, res, next) => {
  try {
    const { conditions, params } = buildDateAndDeviceConditions(req.query, 'd.action_date', 'dt.device_type_name', true);

    const query = dashboardQueries.BUILD_WORK_ACTIVITY_QUERY(conditions);
    const { rows } = await pool.query(query, params);

    res.json({
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        name: r.name || 'เจ้าหน้าที่',
        role_name: r.role_name,
        active_days: Number(r.active_days) || 0,
        total_actions: Number(r.total_actions) || 0,
        jobs_touched: Number(r.jobs_touched) || 0,
        unit: 'วัน',
      })),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/symptoms
 * ดูอาการเสียที่พบบ่อย (จัดกลุ่มข้อความอิสระเป็นหมวดคีย์เวิร์ด) — หน่วย: เครื่อง
 */
exports.getSymptoms = async (req, res, next) => {
  try {
    const { conditions, params } = buildDateAndDeviceConditions(req.query, 'rj.created_at', 'dt.device_type_name');

    const query = dashboardQueries.BUILD_SYMPTOMS_QUERY(conditions);
    const { rows } = await pool.query(query, params);

    res.json({
      success: true,
      data: rows.map((r) => ({
        label: r.label,
        jobs_count: Number(r.jobs_count) || 0,
        unit: 'เครื่อง',
      })),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/team-performance
 * ดู Performance ทีมรายบุคคล (Bar Chart)
 * หน่วย: เครื่อง
 */
exports.getTeamPerformance = async (req, res, next) => {
  try {
    const { conditions: rjFilter, params } = buildDateAndDeviceConditions(req.query, 'rj_sub.created_at', 'dt_sub.device_type_name');

    const query = `
      SELECT 
        p.id,
        TRIM(p.first_name || ' ' || COALESCE(p.last_name, '')) AS name,
        r.name AS role_name,
        COUNT(DISTINCT rj.job_id)::int AS total_jobs,
        COUNT(DISTINCT CASE WHEN rj.status_id = ${REPAIR_STATUS.COMPLETED} THEN rj.job_id END)::int AS completed_jobs
      FROM profiles p
      JOIN roles r ON p.role_id = r.id
      LEFT JOIN (
        SELECT DISTINCT rj_sub.job_id, rj_sub.status_id, rj_sub.device_id, rj_sub.created_at, sub_user.user_id
        FROM repair_job rj_sub
        LEFT JOIN device d_sub ON rj_sub.device_id = d_sub.device_id
        LEFT JOIN device_types dt_sub ON d_sub.device_type_id = dt_sub.device_type_id
        JOIN (
          SELECT job_id, user_id FROM repair_job_detail
          UNION
          SELECT job_id, repairer_id AS user_id FROM repair_job WHERE repairer_id IS NOT NULL
        ) sub_user ON rj_sub.job_id = sub_user.job_id
        WHERE 1=1 ${rjFilter}
      ) rj ON rj.user_id = p.id
      WHERE p.role_id IN (2, 3)
      GROUP BY p.id, p.first_name, p.last_name, r.name
      ORDER BY completed_jobs DESC, total_jobs DESC, p.id ASC;
    `;

    const { rows } = await pool.query(query, params);

    res.json({
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        name: r.name || 'เจ้าหน้าที่',
        role_name: r.role_name,
        total_jobs: Number(r.total_jobs) || 0,
        completed_jobs: Number(r.completed_jobs) || 0,
        unit: 'เครื่อง',
      })),
    });
  } catch (err) {
    next(err);
  }
};

