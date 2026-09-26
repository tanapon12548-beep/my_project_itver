const pool = require('../config/db');
const dashboardQueries = require('../queries/dashboard.queries');
const { REPAIR_STATUS } = require('../constants');

/**
 * GET /api/dashboard/metrics
 */
exports.getMetrics = async (req, res, next) => {
  try {
    const { date_start, date_end, device_type } = req.query;

    let whereConditions = '';
    const params = [];
    let paramIdx = 1;

    if (date_start) {
      whereConditions += ` AND rj.created_at >= $${paramIdx++}`;
      params.push(date_start);
    }
    if (date_end) {
      whereConditions += ` AND rj.created_at <= $${paramIdx++}::date + interval '1 day'`;
      params.push(date_end);
    }

    const query = dashboardQueries.BUILD_METRICS_QUERY(whereConditions);
    const { rows: jobs } = await pool.query(query, params);

    // Filter by device_type in app
    let filteredJobs = jobs;

    if (device_type && device_type !== 'all') {
      filteredJobs = jobs.filter(job => {
        const typeString = (job.device_type || '').toLowerCase();

        if (device_type === 'pc') {
          return typeString.includes('desktop') || typeString.includes('pc');
        }

        if (device_type === 'laptop') {
          return typeString.includes('notebook') || typeString.includes('laptop');
        }

        if (device_type === 'printer') {
          return typeString.includes('printer') || typeString.includes('print');
        }

        return true;
      });
    }

    const totalJobs = filteredJobs.length;
    let totalRevenue = 0;
    let completedJobs = 0;
    let pendingJobs = 0;

    // Calculate metrics
    filteredJobs.forEach(job => {
      const isPaid = job.status_id === REPAIR_STATUS.COMPLETED;
      if (job.total_amount && isPaid) {
        totalRevenue += parseFloat(job.total_amount);
      }

      if (job.status_id === REPAIR_STATUS.COMPLETED) {
        completedJobs++;
      }

      const pendingStatusIds = [
        REPAIR_STATUS.PENDING_CHECK,
        REPAIR_STATUS.CHECKING,
        REPAIR_STATUS.MAKING_QUOTE,
        REPAIR_STATUS.PENDING_APPROVAL,
        REPAIR_STATUS.APPROVED_WAIT_REPAIR,
        REPAIR_STATUS.WAITING_PAYMENT,
        REPAIR_STATUS.READY_FOR_PICKUP,
      ];
      if (pendingStatusIds.includes(job.status_id)) {
        pendingJobs++;
      }
    });

    res.json({
      success: true,
      data: { totalRevenue, totalJobs, completedJobs, pendingJobs },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/trend
 */
exports.getTrend = async (req, res, next) => {
  try {
    const { period, metric_type = 'count', date_start, date_end, device_type } = req.query;

    const safePeriod = ['day', 'month', 'year'].includes(period) ? period : 'day';
    const safeMetric = metric_type === 'revenue' ? 'revenue' : 'count';
    const safeDeviceType = ['pc', 'laptop', 'printer'].includes(device_type) ? device_type : null;

    let groupBy, labelFormat;
    if (safePeriod === 'year') {
      groupBy = "TO_CHAR(rj.created_at, 'YYYY')";
      labelFormat = "TO_CHAR(rj.created_at, 'YYYY')";
    } else if (safePeriod === 'month') {
      groupBy = "TO_CHAR(rj.created_at, 'YYYY-MM')";
      labelFormat = "TO_CHAR(rj.created_at, 'Mon')";
    } else {
      groupBy = "DATE(rj.created_at)";
      labelFormat = "TO_CHAR(rj.created_at, 'DD')";
    }

    const selectExpr = safeMetric === 'revenue'
      ? `COALESCE(SUM(CASE WHEN rj.status_id = ${REPAIR_STATUS.COMPLETED} THEN rj.total_amount ELSE 0 END), 0) AS value`
      : "COUNT(*) AS value";

    let whereConditions = '';
    const params = [];
    let paramIdx = 1;

    if (date_start && String(date_start).trim()) {
      whereConditions += ` AND rj.created_at >= $${paramIdx++}`;
      params.push(String(date_start).trim());
    }
    if (date_end && String(date_end).trim()) {
      whereConditions += ` AND rj.created_at <= $${paramIdx++}::date + interval '1 day'`;
      params.push(String(date_end).trim());
    }

    if (safeDeviceType) {
      if (safeDeviceType === 'pc') {
        whereConditions += ` AND (LOWER(dt.device_type_name) LIKE '%desktop%' OR LOWER(dt.device_type_name) LIKE '%pc%')`;
      } else if (safeDeviceType === 'laptop') {
        whereConditions += ` AND (LOWER(dt.device_type_name) LIKE '%notebook%' OR LOWER(dt.device_type_name) LIKE '%laptop%')`;
      } else if (safeDeviceType === 'printer') {
        whereConditions += ` AND (LOWER(dt.device_type_name) LIKE '%printer%' OR LOWER(dt.device_type_name) LIKE '%print%')`;
      }
    }

    const query = dashboardQueries.BUILD_TREND_QUERY({
      labelFormat,
      selectExpr,
      whereConditions,
      groupBy,
    });

    const { rows } = await pool.query(query, params);
    res.json({
      success: true,
      data: rows.map(r => ({ label: r.label, value: Math.round(parseFloat(r.value) || 0) }))
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
    const { date_start, date_end, device_type } = req.query;

    let whereConditions = '';
    const params = [];
    let paramIdx = 1;

    if (date_start) {
      whereConditions += ` AND rj.created_at >= $${paramIdx++}`;
      params.push(date_start);
    }
    if (date_end) {
      whereConditions += ` AND rj.created_at <= $${paramIdx++}::date + interval '1 day'`;
      params.push(date_end);
    }

    if (device_type && device_type !== 'all') {
      if (device_type === 'pc') {
        whereConditions += ` AND (LOWER(dt.device_type_name) LIKE '%desktop%' OR LOWER(dt.device_type_name) LIKE '%pc%')`;
      } else if (device_type === 'laptop') {
        whereConditions += ` AND (LOWER(dt.device_type_name) LIKE '%notebook%' OR LOWER(dt.device_type_name) LIKE '%laptop%')`;
      } else if (device_type === 'printer') {
        whereConditions += ` AND (LOWER(dt.device_type_name) LIKE '%printer%' OR LOWER(dt.device_type_name) LIKE '%print%')`;
      }
    }

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
