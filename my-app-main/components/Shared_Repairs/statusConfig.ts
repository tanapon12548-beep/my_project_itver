import { Colors } from '@/constants/theme';

/** All 9 repair status definitions — canonical DB labels matching database status table */
export const STATUS_DEFINITIONS = [
  { id: '1', statusId: 1, title: 'รอตรวจเช็ค', color: Colors.status.status1, next: 'ช่างรับงาน' },
  { id: '2', statusId: 2, title: 'ดำเนินการตรวจเช็ค', color: Colors.status.status2, next: 'ช่างกำลังดูอาการ' },
  { id: '3', statusId: 3, title: 'ดำเนินการเสนอราคา', color: Colors.status.status3, next: 'ช่างทำราคา' },
  { id: '4', statusId: 4, title: 'รอการอนุมัติ', color: Colors.status.status4, next: 'รอลูกค้ากดอนุมัติ' },
  { id: '5', statusId: 5, title: 'อนุมัติแล้ว/รอซ่อม', color: Colors.status.status5, next: 'ช่างดำเนินการซ่อม' },
  { id: '7', statusId: 7, title: 'รอชำระ', color: Colors.status.status7, next: 'ชำระที่หน้าร้าน/ตรวจสลิป' },
  { id: '6', statusId: 6, title: 'รอลูกค้ามารับเครื่อง', color: Colors.status.status6, next: 'ลูกค้าเซ็นรับเครื่อง' },
  { id: '8', statusId: 8, title: 'เสร็จสิ้น', color: Colors.status.status8, next: 'ปิดงานสมบูรณ์' },
  { id: '9', statusId: 9, title: 'ยกเลิกซ่อม', color: Colors.status.status9, next: 'ปิดงานยกเลิก' },
] as const;

/**
 * Get status definitions filtered by allowed status IDs.
 * If no filter, returns all statuses.
 */
export function getStatusDefinitions(filterStatusIds?: number[]) {
  if (!filterStatusIds || filterStatusIds.length === 0) {
    return STATUS_DEFINITIONS;
  }
  return STATUS_DEFINITIONS.filter((s) => filterStatusIds.includes(s.statusId));
}

/**
 * Text color to pair with a status tint background.
 * Light tints (lime/yellow) need dark text for 4.5:1 contrast,
 * saturated colors can use white or the deep tone itself.
 */
export function getStatusOnTintColor(statusId: number): string {
  switch (statusId) {
    case 1: // lime tint -> dark olive text
      return '#365314';
    case 2: // amber tint
      return '#78350F';
    case 3: // orange tint
      return '#7C2D12';
    case 4: // purple tint
      return '#581C87';
    case 5: // blue tint
    case 6: // legacy fallback
      return '#1E3A8A';
    case 7: // yellow tint
      return '#713F12';
    case 8: // emerald tint
      return '#14532D';
    case 9: // red tint
      return '#7F1D1D';
    default:
      return '#0F172A';
  }
}
