/**
 * queries/item.queries.js
 * รวมคำสั่ง SQL Queries สำหรับโมดูลรายการอะไหล่/ค่าบริการ (Item)
 */

/** ส่วนหัวของรายการ + จำนวนครั้งที่ถูกใช้ในใบเสนอราคา (ต่อท้ายด้วยเงื่อนไข/จัดกลุ่มใน controller) */
exports.BUILD_GET_ALL_ITEMS = `
  SELECT 
    i.*, 
    it.item_type_name, 
    COUNT(qd.details_id)::int AS used_count 
  FROM item i 
  LEFT JOIN item_type it ON i.item_type_id = it.item_type_id 
  LEFT JOIN quotation_details qd ON i.item_id = qd.item_id 
  WHERE 1=1
`;

exports.INSERT_ITEM = `
  INSERT INTO item (item_name, item_type_id, selling_price, cost_price)
  VALUES ($1, $2, $3, $4)
  RETURNING *
`;

exports.UPDATE_ITEM = `
  UPDATE item SET item_name=$1, item_type_id=$2, selling_price=$3, cost_price=$4
  WHERE item_id=$5
  RETURNING *
`;

exports.DELETE_ITEM = 'DELETE FROM item WHERE item_id = $1 RETURNING item_id';
