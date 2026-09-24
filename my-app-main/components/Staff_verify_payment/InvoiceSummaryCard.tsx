import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InvoiceSummaryCardProps {
  displayJobNo: string;
  customerName?: string;
  appointmentDate?: string | null;
  formattedAmount: string;
  formatDate: (dateStr: string | null) => string;
}

export default function InvoiceSummaryCard({
  displayJobNo,
  customerName,
  appointmentDate,
  formattedAmount,
  formatDate,
}: InvoiceSummaryCardProps) {
  return (
    <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-slate-100">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-slate-800 font-bold font-heading text-base">สรุปใบแจ้งหนี้</Text>
        <View className="px-2.5 py-0.5 bg-red-50 rounded-full border border-red-200">
          <Text className="text-[#D32F2F] font-bold text-xs font-heading">{displayJobNo}</Text>
        </View>
      </View>

      {customerName ? (
        <View className="flex-row justify-between items-center py-2 border-b border-slate-100">
          <Text className="text-slate-500 text-xs font-body">ชื่อลูกค้า</Text>
          <Text className="text-slate-800 font-bold text-xs font-body">{customerName}</Text>
        </View>
      ) : null}

      <View className="py-2 border-b border-slate-100">
        <View className="flex-row justify-between items-center">
          <Text className="text-slate-500 text-xs font-body">กำหนดวันรับเครื่อง</Text>
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={14} color="#64748b" style={{ marginRight: 4 }} />
            <Text className="text-slate-800 font-bold text-xs font-body">
              {formatDate(appointmentDate ?? null)}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row justify-between items-center pt-3">
        <Text className="text-slate-800 font-bold font-heading text-base">ยอดรวมสุทธิ</Text>
        <Text className="text-red-600 font-bold font-heading text-xl">{formattedAmount} บาท</Text>
      </View>
    </View>
  );
}
