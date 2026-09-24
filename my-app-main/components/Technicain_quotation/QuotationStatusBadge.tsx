import React from 'react';
import { View, Text } from 'react-native';
import { Colors } from '@/constants/theme';
import type { QuotationItem } from '@/types/quotation';

export const isModificationQuote = (item: QuotationItem) =>
  item.quote_status_id === 5 ||
  item.quote_status_id === 4 ||
  (Boolean(item.customer_remark) && item.repair_status_id === 3);

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
  } else if (item.quote_status_id === 1) {
    statusColor = Colors.status.status4 || '#A855F7';
    label = 'รอลูกค้าอนุมัติ';
  } else if (item.quote_status_id === 2) {
    statusColor = Colors.status.status5 || '#3B82F6';
    label = 'อนุมัติแล้ว';
  } else if (item.quote_status_id === 3) {
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
