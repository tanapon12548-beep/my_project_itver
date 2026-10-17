/**
 * queries/device.queries.js
 * รวมคำสั่ง SQL Queries สำหรับโมดูลอุปกรณ์ลูกค้า (Device)
 */

/** ส่วนหัวของรายการอุปกรณ์ + ชื่อประเภท/ยี่ห้อ/ลูกค้า (ต่อท้ายด้วยเงื่อนไขใน controller) */
exports.BUILD_GET_ALL_DEVICES = `
  SELECT d.*, 
         COALESCE(dt.device_type_name, '-') AS device_type_name,
         COALESCE(b.brand_name, '-') AS brand_name,
         COALESCE(p.first_name || ' ' || p.last_name, '') AS customer_name 
  FROM device d 
  LEFT JOIN device_types dt ON d.device_type_id = dt.device_type_id
  LEFT JOIN brands b ON d.brand_id = b.brand_id
  LEFT JOIN profiles p ON d.customer_id = p.id
`;

exports.FIND_BRAND_BY_NAME = 'SELECT brand_id FROM brands WHERE LOWER(brand_name) = LOWER($1) LIMIT 1';

exports.INSERT_BRAND = 'INSERT INTO brands (brand_name) VALUES ($1) RETURNING brand_id';

exports.INSERT_DEVICE = `
  INSERT INTO device (customer_id, device_type_id, brand_id, model, included_accessories,
    warranty_year, warranty_end_date, serial_number, important_software, device_password)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
  RETURNING *
`;

exports.UPDATE_DEVICE = `
  UPDATE device SET
    customer_id = COALESCE($1, customer_id), 
    device_type_id = COALESCE($2, device_type_id), 
    brand_id = COALESCE($3, brand_id), 
    model = COALESCE($4, model), 
    included_accessories = COALESCE($5, included_accessories),
    warranty_year = COALESCE($6, warranty_year), 
    warranty_end_date = COALESCE($7, warranty_end_date), 
    serial_number = COALESCE($8, serial_number), 
    important_software = COALESCE($9, important_software), 
    device_password = COALESCE($10, device_password)
  WHERE device_id = $11
  RETURNING *
`;
