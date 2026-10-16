/**
 * แปลงค่าตัวกรอง "ประเภทอุปกรณ์" (device_type) เป็นข้อความสำหรับแสดงบนหัวการ์ด/กราฟ
 *
 * รองรับ 2 แบบ:
 *  1. คีย์เดิมที่เคย hardcode ไว้ (pc / laptop / printer) → แปลเป็นไทยตามเดิม
 *  2. ชื่อประเภทอุปกรณ์จริงที่ดึงมาจากฐานข้อมูล (ตาราง device_types) → แสดงชื่อนั้นตามที่ตั้งไว้
 */

const LEGACY_DEVICE_LABELS: Record<string, string> = {
  pc: 'คอมพิวเตอร์',
  laptop: 'โน๊ตบุ๊ค',
  printer: 'ปริ้นเตอร์',
};

/** ชื่อประเภทอุปกรณ์แบบไม่มีอะไรมาก ('' = ไม่ได้กรอง) */
export function getDeviceTypeLabel(deviceType?: string): string {
  const value = String(deviceType || '').trim();
  if (!value || value.toLowerCase() === 'all') return '';
  return LEGACY_DEVICE_LABELS[value.toLowerCase()] ?? value;
}

/** ต่อท้ายหัวการ์ดแบบวงเล็บ เช่น " (Notebook / Laptop)" */
export function getDeviceTypeSuffix(deviceType?: string): string {
  const label = getDeviceTypeLabel(deviceType);
  return label ? ` (${label})` : '';
}

/** ต่อท้ายหัวการ์ดแบบจุดคั่น เช่น " • Notebook / Laptop" */
export function getDeviceTypeBullet(deviceType?: string): string {
  const label = getDeviceTypeLabel(deviceType);
  return label ? ` • ${label}` : '';
}
