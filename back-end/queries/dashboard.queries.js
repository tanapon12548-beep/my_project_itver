/**
 * queries/dashboard.queries.js
 * รวมคำสั่ง SQL Queries สำหรับโมดูล Dashboard
 */
const { REPAIR_STATUS, QUOTE_STATUS, TIMEZONE: TZ } = require('../constants');

/**
 * วันปัจจุบันตามเวลาไทย (date)
 * หมายเหตุ: ต้องเป็น \"วันไทย\" เสมอ เพราะ TIMEZONE ของ session ในฐานข้อมูลไม่ใช่เวลาไทย
 */
const LOCAL_TODAY_SQL = `(now() AT TIME ZONE '${TZ}')::date`;

exports.LOCAL_TODAY_SQL = LOCAL_TODAY_SQL;

/** วันแรกของเดือน / วันนี้ / วันสุดท้ายของเดือน ตามเวลาไทย (ใช้สร้างแกนกราฟรายวัน) */
exports.GET_LOCAL_MONTH_RANGE = `
  SELECT to_char(DATE_TRUNC('month', ${LOCAL_TODAY_SQL}), 'YYYY-MM-DD') AS first_day,
         to_char(${LOCAL_TODAY_SQL}, 'YYYY-MM-DD') AS today,
         to_char((DATE_TRUNC('month', ${LOCAL_TODAY_SQL}) + INTERVAL '1 month' - INTERVAL '1 day')::date, 'YYYY-MM-DD') AS last_day
`;

/**
 * รายรับรวม + ต้นทุนอะไหล่ (สำหรับคำนวณกำไรขั้นต้น)
 * นับเฉพาะใบเสนอราคาที่ \"ลูกค้าอนุมัติแล้ว\" เพราะงานที่ถูกยกเลิกจะยังมีรายการอะไหล่ค้างในใบ
 * แต่ของจริงไม่ได้ถูกติดตั้ง (ยอดที่เก็บจากงานที่ยกเลิกคือค่าตรวจเช็คเท่านั้น)
 * แยก CTE เพื่อกันแถวทวีคูณจากการ join repair_job กับ quotation_details ตรง ๆ
 */
exports.BUILD_REVENUE_QUERY = (revenueConditions) => `
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

/** สถิติการใช้อะไหล่ในงานซ่อม (กี่ชิ้น) */
exports.BUILD_PARTS_USAGE_QUERY = (whereConditions) => `
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

/** ผลงานทีมรายบุคคล (หน่วย: เครื่อง) */
exports.BUILD_TEAM_PERFORMANCE_QUERY = (rjFilter) => `
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

exports.BUILD_METRICS_QUERY = (whereConditions = '') => `
  SELECT rj.*, dt.device_type_name AS device_type 
  FROM repair_job rj 
  LEFT JOIN device d ON rj.device_id = d.device_id 
  LEFT JOIN device_types dt ON d.device_type_id = dt.device_type_id 
  WHERE 1=1 ${whereConditions}
`;

exports.BUILD_TREND_QUERY = ({ labelFormat, selectExpr, whereConditions, groupBy }) => `
  SELECT ${labelFormat} AS label, ${selectExpr}
  FROM repair_job rj
  LEFT JOIN device d ON rj.device_id = d.device_id
  LEFT JOIN device_types dt ON d.device_type_id = dt.device_type_id
  WHERE 1=1 ${whereConditions}
  GROUP BY ${groupBy}, ${labelFormat} 
  ORDER BY ${groupBy}
`;

exports.BUILD_CATEGORY_QUERY = (whereConditions = '') => `
  SELECT COALESCE(dt.device_type_name, 'ไม่ระบุ') AS device_type, COUNT(*) AS count
  FROM repair_job rj
  LEFT JOIN device d ON rj.device_id = d.device_id
  LEFT JOIN device_types dt ON d.device_type_id = dt.device_type_id
  WHERE 1=1 ${whereConditions}
  GROUP BY dt.device_type_name 
  ORDER BY count DESC
`;

/**
 * นับวันเคลื่อนงานรายบุคคลจาก repair_job_detail (ใช้แทนการลงเวลาเข้างาน
 * โดยไม่ต้องเพิ่มตารางใหม่) — whereConditions สร้างด้วย dateCol='d.action_date'
 */
exports.BUILD_WORK_ACTIVITY_QUERY = (whereConditions = '') => `
  SELECT
    p.id,
    TRIM(p.first_name || ' ' || COALESCE(p.last_name, '')) AS name,
    r.name AS role_name,
    COUNT(DISTINCT d.action_date)::int AS active_days,
    COUNT(*)::int AS total_actions,
    COUNT(DISTINCT d.job_id)::int AS jobs_touched
  FROM repair_job_detail d
  JOIN profiles p ON p.id = d.user_id
  JOIN roles r ON p.role_id = r.id
  LEFT JOIN repair_job rj ON rj.job_id = d.job_id
  LEFT JOIN device dv ON rj.device_id = dv.device_id
  LEFT JOIN device_types dt ON dv.device_type_id = dt.device_type_id
  WHERE d.user_id IS NOT NULL
    AND p.role_id IN (1, 2, 3)
    ${whereConditions}
  GROUP BY p.id, p.first_name, p.last_name, r.name
  ORDER BY active_days DESC, total_actions DESC
`;

/**
 * จัดกลุ่มอาการเสีย (free text) เป็นหมวดคีย์เวิร์ดเพื่อนับอาการที่พบบ่อย
 * ลำดับ WHEN สำคัญ: เช็คปริ้นเตอร์ก่อนคีย์บอร์ดเพราะคำว่า "พิมพ์" ชนกัน
 */
exports.BUILD_SYMPTOMS_QUERY = (whereConditions = '') => `
  SELECT grp AS label, COUNT(*)::int AS jobs_count
  FROM (
    SELECT CASE
      WHEN rj.symptom_details LIKE '%เปิดไม่ติด%' OR rj.symptom_details LIKE '%ไม่ขึ้นภาพ%' OR rj.symptom_details LIKE '%บูต%' OR rj.symptom_details LIKE '%จอฟ้า%' OR rj.symptom_details LIKE '%Boot%' OR rj.symptom_details LIKE '%ดับวูบ%' OR rj.symptom_details LIKE '%เปิดไม่%' THEN 'เปิดไม่ติด/ดับ/บูตไม่ขึ้น'
      WHEN rj.symptom_details LIKE '%ปริ้น%' OR rj.symptom_details LIKE '%หมึก%' OR rj.symptom_details LIKE '%พิมพ์เอกสาร%' THEN 'ปริ้นเตอร์/หมึกพิมพ์'
      WHEN rj.symptom_details LIKE '%จอ%' OR rj.symptom_details LIKE '%ภาพ%' OR rj.symptom_details LIKE '%เส้น%' OR rj.symptom_details LIKE '%มืด%' THEN 'จอภาพ/แสดงผล'
      WHEN rj.symptom_details LIKE '%แบต%' OR rj.symptom_details LIKE '%บวม%' OR rj.symptom_details LIKE '%ชาร์จ%' THEN 'แบตเตอรี่/ชาร์จไฟ'
      WHEN rj.symptom_details LIKE '%คีย์บอร์ด%' OR rj.symptom_details LIKE '%คีย์%' OR rj.symptom_details LIKE '%ปุ่ม%' OR rj.symptom_details LIKE '%ทัชแพด%' OR rj.symptom_details LIKE '%แป้น%' THEN 'คีย์บอร์ด/ปุ่มกด'
      WHEN rj.symptom_details LIKE '%ค้าง%' OR rj.symptom_details LIKE '%ช้า%' OR rj.symptom_details LIKE '%ร้อน%' OR rj.symptom_details LIKE '%กระตุก%' OR rj.symptom_details LIKE '%พัดลม%' THEN 'เครื่องค้าง/ช้า/ร้อน'
      WHEN rj.symptom_details LIKE '%อัปเกรด%' OR rj.symptom_details LIKE '%อัพเกรด%' OR rj.symptom_details LIKE '%เพิ่มพื้นที่%' OR rj.symptom_details LIKE '%โอนย้าย%' THEN 'อัปเกรด/เพิ่มสเปก'
      WHEN rj.symptom_details LIKE '%น้ำหก%' OR rj.symptom_details LIKE '%ตกพื้น%' OR rj.symptom_details LIKE '%แตก%' OR rj.symptom_details LIKE '%หัก%' OR rj.symptom_details LIKE '%ไหม้%' THEN 'อุบัติเหตุ/เสียหายภายนอก'
      ELSE 'อื่นๆ'
    END AS grp
    FROM repair_job rj
    LEFT JOIN device dv ON rj.device_id = dv.device_id
    LEFT JOIN device_types dt ON dv.device_type_id = dt.device_type_id
    WHERE 1=1 ${whereConditions}
  ) s
  GROUP BY grp
  ORDER BY jobs_count DESC
`;
