const pool = require('../config/db');
const { ROLES } = require('../constants');
const lookupQueries = require('../queries/lookup.queries');

/**
 * GET /api/lookup/statuses
 */
exports.getStatuses = async (req, res, next) => {
  try {
    const { rows } = await pool.query(lookupQueries.GET_STATUSES);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/lookup/action-types
 */
exports.getActionTypes = async (req, res, next) => {
  try {
    const { rows } = await pool.query(lookupQueries.GET_ACTION_TYPES);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/lookup/payment-methods
 */
exports.getPaymentMethods = async (req, res, next) => {
  try {
    const { rows } = await pool.query(lookupQueries.GET_PAYMENT_METHODS);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/lookup/item-types
 */
exports.getItemTypes = async (req, res, next) => {
  try {
    const { rows } = await pool.query(lookupQueries.GET_ITEM_TYPES);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/lookup/quotation-statuses
 */
exports.getQuotationStatuses = async (req, res, next) => {
  try {
    const { rows } = await pool.query(lookupQueries.GET_QUOTATION_STATUSES);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/lookup/device-types
 */
exports.getDeviceTypes = async (req, res, next) => {
  try {
    const { rows } = await pool.query(lookupQueries.GET_DEVICE_TYPES);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/lookup/brands
 */
exports.getBrands = async (req, res, next) => {
  try {
    const { device_type_id } = req.query;
    if (device_type_id && !isNaN(parseInt(device_type_id, 10))) {
      const dtId = parseInt(device_type_id, 10);
      const { rows } = await pool.query(lookupQueries.BUILD_GET_BRANDS_BY_DEVICE_TYPE, [dtId]);
      return res.json({ success: true, data: rows });
    }
    const { rows } = await pool.query(lookupQueries.GET_BRANDS);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/lookup/models
 * ค้นหาหรือดึงรุ่นตาม brand_id หรือ device_type_id
 */
exports.getModels = async (req, res, next) => {
  try {
    const { brand_id, device_type_id } = req.query;
    let query = lookupQueries.GET_ALL_DEVICE_MODELS;
    const conditions = [];
    const params = [];

    if (brand_id) {
      params.push(brand_id);
      conditions.push(`brand_id = $${params.length}`);
    }
    if (device_type_id) {
      params.push(device_type_id);
      conditions.push(`device_type_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY model_name ASC';

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};


/**
 * GET /api/lookup/profiles
 * ค้นหา profiles สำหรับ autocomplete (CustomerFormCard)
 */
exports.searchProfiles = async (req, res, next) => {
  try {
    const { q, type, name, phone, email } = req.query; // type = 'all' | 'name' | 'phone' | 'email'
    // Advanced combined filter: ?name=ใจ&phone=081&email=... (AND กัน)
    const advName = (name || '').trim();
    const advPhone = (phone || '').trim();
    const advEmail = (email || '').trim();
    if (advName || advPhone || advEmail) {
      const conditions = [`role_id = ${ROLES.CUSTOMER}`];
      const params = [];
      if (advName) {
        params.push(`%${advName}%`);
        conditions.push(`CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) ILIKE $${params.length}`);
      }
      if (advPhone) {
        params.push(`%${advPhone}%`);
        conditions.push(`phone ILIKE $${params.length}`);
      }
      if (advEmail) {
        params.push(`%${advEmail}%`);
        conditions.push(`email ILIKE $${params.length}`);
      }
      const query = lookupQueries.BUILD_SEARCH_PROFILES_ADVANCED(conditions);
      const { rows } = await pool.query(query, params);
      return res.json({ success: true, data: rows });
    }

    const trimmed = (q || '').trim();
    if (!trimmed || trimmed.length < 1) {
      return res.json({ success: true, data: [] });
    }

    let query;
    const params = [`%${trimmed}%`];
    if (type === 'phone') {
      query = lookupQueries.SEARCH_PROFILES_BY_PHONE;
    } else if (type === 'name') {
      query = lookupQueries.SEARCH_PROFILES_BY_NAME;
    } else if (type === 'email') {
      query = lookupQueries.SEARCH_PROFILES_BY_EMAIL;
    } else {
      // default 'all': single search box (name / phone / email)
      query = lookupQueries.SEARCH_PROFILES_ALL;
    }

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};
