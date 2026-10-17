import React from 'react';
import { View, Text } from 'react-native';
import { QUOTE_STATUS, REPAIR_STATUS } from '@/constants/status';
import { Colors } from '@/constants/theme';
import type { QuotationItem } from '@/types/quotation';

export const isModificationQuote = (item: QuotationItem) =>
  item.quote_status_id === QUOTE_STATUS.CHANGE_REQUEST ||
  item.quote_status_id === QUOTE_STATUS.REVISING ||
  (Boolean(item.customer_remark) && item.repair_status_id === REPAIR_STATUS.MAKING_QUOTE);

/**
 * อนุญาตให้แก้ไขหรือลบได้เฉพาะสถานะที่รอดำเนินการ (รอการอนุมัติ หรือขอแก้ไขรายการ) เท่านั้น
 * ไม่อนุญาตหากได้รับการอนุมัติแล้ว (2) หรือลูกค้ายกเลิกแล้ว (3)
 */
export const canEditOrDeleteQuote = (item: QuotationItem | null | undefined): boolean => {
  if (!item) return false;
  // อนุมัติแล้ว (2) หรือลูกค้ายกเลิก (3) ห้ามแก้ไขหรือลบ
  if (item.quote_status_id === QUOTE_STATUS.APPROVED || item.quote_status_id === QUOTE_STATUS.CANCELLED) return false;
  return item.quote_status_id === QUOTE_STATUS.PENDING || isModificationQuote(item);
};

interface QuotationStatusBadgeProps {
  item: QuotationItem;
}

export default function QuotationStatusBadge({ item }: QuotationStatusBadgeProps) {
  const isModification = isModificationQuote(item);

  let statusColor = Colors.status.status4;
  let label = 'รอลูกค้าอนุมัติ';

  if (isModification) {
    statusColor = Colors.warning || '#D97706';
    label = 'ขอแก้ไข';
  } else if (item.quote_status_id === QUOTE_STATUS.PENDING) {
    statusColor = Colors.status.status4 || '#A855F7';
    label = 'รอลูกค้าอนุมัติ';
  } else if (item.quote_status_id === QUOTE_STATUS.APPROVED) {
    statusColor = Colors.status.status5 || '#3B82F6';
    label = 'อนุมัติแล้ว';
  } else if (item.quote_status_id === QUOTE_STATUS.CANCELLED) {
    statusColor = Colors.status.status9 || '#EF4444';
    label = 'ลูกค้ายกเลิก';
  } else if (item.quote_status_name) {
    label = item.quote_status_name;
  }

  return (
    <View
      className="px-2.5 py-1 rounded-full flex-row items-center gap-1.5"
      style={{ backgroundColor: `${statusColor}15` }}
    >
      <View
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: statusColor }}
      />
      <Text className="text-xs font-bold font-heading" style={{ color: statusColor }}>
        {label}
      </Text>
    </View>
  );
}
