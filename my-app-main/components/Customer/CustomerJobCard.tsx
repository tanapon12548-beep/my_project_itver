// 1. React & React Native
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import type { RepairJob } from '@/types/repair';

// Unified 7-stage progress indicator:
// 1: รับเครื่อง, 2: ตรวจเช็ค, 3: รออนุมัติ, 4: กำลังซ่อม, 5: รอชำระ, 6: รอมารับ, 7: เสร็จสิ้น
export const CUSTOMER_STEPS = [
  'รับเครื่อง',
  'ตรวจเช็ค',
  'รออนุมัติ',
  'กำลังซ่อม',
  'รอชำระ',
  'รอมารับ',
  'เสร็จสิ้น',
];

export const getProgressStage = (statusId: number, statusText?: string): number => {
  const id = Number(statusId);
  const s = statusText || '';
  if (id === 8 || s.includes('เสร็จ') || s.includes('ส่งมอบ')) return 7; // เสร็จสิ้น
  if (id === 6 || s.includes('มารับ') || s.includes('พร้อมรับ')) return 6; // รอมารับ (รอลูกค้ามารับเครื่อง)
  if (id === 7 || s.includes('รอชำระ')) return 5; // รอชำระ
  if (id === 5 || s.includes('อนุมัติแล้ว') || s.includes('ซ่อม')) return 4; // กำลังซ่อม
  if (id === 4 || s.includes('รออนุมัติ') || s.includes('รอการอนุมัติ')) return 3; // รออนุมัติ
  if (id === 2 || id === 3 || s.includes('เช็ค') || s.includes('เสนอ')) return 2; // ตรวจเช็ค / เสนอราคา
  return 1; // รับเครื่อง
};

export const getStatusConfig = (status: string, statusId?: number) => {
  const s = status || '';
  const id = Number(statusId);

  if (id === 8 || s.includes('เสร็จ') || s.includes('ชำระแล้ว')) {
    return { color: '#22C55E', bg: '#DCFCE7', text: '#15803D', icon: 'checkmark-circle' };
  }
  if (id === 9 || s.includes('ยกเลิก')) {
    return { color: '#EF4444', bg: '#FEE2E2', text: '#B91C1C', icon: 'close-circle' };
  }
  if (id === 6 || s.includes('มารับเครื่อง') || s.includes('พร้อมรับ')) {
    return { color: '#0EA5E9', bg: '#E0F2FE', text: '#0369A1', icon: 'cube' };
  }
  if (id === 7 || s.includes('รอชำระ')) {
    return { color: '#EAB308', bg: '#FEF9C3', text: '#A16207', icon: 'cash' };
  }
  if (id === 5 || s.includes('อนุมัติ') || s.includes('ซ่อม')) {
    return { color: '#6366F1', bg: '#EEF2FF', text: '#4338CA', icon: 'hammer' };
  }
  if (id === 4 || s.includes('รออนุมัติ') || s.includes('รอการอนุมัติ')) {
    return { color: '#A855F7', bg: '#F3E8FF', text: '#7E22CE', icon: 'alert-circle' };
  }
  if (id === 3 || s.includes('เสนอราคา')) {
    return { color: '#F59E0B', bg: '#FEF3C7', text: '#B45309', icon: 'receipt' };
  }
  if (id === 2 || s.includes('ดำเนินการตรวจเช็ค')) {
    return { color: '#D97706', bg: '#FFEDD5', text: '#C2410C', icon: 'search' };
  }
  return { color: '#84CC16', bg: '#ECFCCB', text: '#4D7C0F', icon: 'clipboard' };
};

export const getDeviceIcon = (type?: string, brand?: string) => {
  const t = `${type || ''} ${brand || ''}`.toLowerCase();
  if (t.includes('print') || t.includes('ปริ้น') || t.includes('canon') || t.includes('epson') || t.includes('brother') || t.includes('hp')) {
    return 'print-outline';
  }
  if (t.includes('phone') || t.includes('มือถือ') || t.includes('โทรศัพท์') || t.includes('iphone') || t.includes('samsung') || t.includes('oppo') || t.includes('vivo')) {
    return 'phone-portrait-outline';
  }
  if (t.includes('macbook') || t.includes('laptop') || t.includes('โน้ตบุ๊ก') || t.includes('notebook') || t.includes('asus') || t.includes('acer') || t.includes('tuf') || t.includes('rog') || t.includes('lenovo') || t.includes('dell')) {
    return 'laptop-outline';
  }
  if (t.includes('ipad') || t.includes('แท็บเล็ต') || t.includes('tablet')) {
    return 'tablet-portrait-outline';
  }
  if (t.includes('pc') || t.includes('คอมพิวเตอร์') || t.includes('computer') || t.includes('desktop')) {
    return 'desktop-outline';
  }
  return 'hardware-chip-outline';
};

interface CustomerJobCardProps {
  item: RepairJob;
  onPressDetails: (jobId: string | number) => void;
}

export default function CustomerJobCard({ item, onPressDetails }: CustomerJobCardProps) {
  const targetId = item.id || item.job_id || '';
  const deviceTitle = `${item.brand || ''} ${item.model || ''}`.trim() || item.device_type || 'อุปกรณ์ไอที';
  const jobNo = item.job_number || item.job_no || (targetId ? `REP-${String(targetId).padStart(6, '0')}` : '-');
  const symptomText = item.symptoms || item.symptom_details || item.symptom || 'ไม่ระบุอาการเสีย';
  const statusText = item.status || item.status_name || 'รอตรวจเช็ค';
  const statusId = Number(item.status_id || 1);
  const statusCfg = getStatusConfig(statusText, statusId);
  const isCompleted = statusId === 8 || statusText.includes('เสร็จ') || statusText.includes('ส่งมอบ');
  const progressStage = getProgressStage(statusId, statusText);
  const isReadyForPickup = statusId === 6 || statusText.includes('มารับเครื่อง') || statusText.includes('พร้อมรับ');
  const isNeedsApproval = statusId === 4 || statusText.includes('รอการอนุมัติ') || statusText.includes('รออนุมัติ');
  const isPendingPayment = statusId === 7 || statusText.includes('รอชำระ');

  return (
    <View className="bg-white rounded-3xl mb-4 border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Card Top Strip */}
      <View className="p-4 pb-3">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2.5">
            <View
              className="w-9 h-9 rounded-xl items-center justify-center border"
              style={{
                backgroundColor: statusCfg.bg,
                borderColor: `${statusCfg.color}35`,
              }}
            >
              <Ionicons
                name={getDeviceIcon(item.device_type, item.brand) as any}
                size={19}
                color={statusCfg.color}
              />
            </View>
            <View>
              <Text className="text-[11px] font-bold text-slate-400 font-body uppercase tracking-wider">
                รหัสงานซ่อม
              </Text>
              <Text className="text-sm font-bold text-slate-900 font-heading">
                {jobNo}
              </Text>
            </View>
          </View>

          {/* Status Badge */}
          <View
            className="px-3 py-1.5 rounded-full flex-row items-center gap-1.5 border"
            style={{
              backgroundColor: statusCfg.bg,
              borderColor: `${statusCfg.color}40`,
            }}
          >
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: statusCfg.color }}
            />
            <Text
              className="text-xs font-bold font-heading"
              style={{ color: statusCfg.text }}
            >
              {statusText}
            </Text>
          </View>
        </View>

        {/* Device Title */}
        <View className="flex-row items-baseline justify-between mb-1.5">
          <Text
            className="text-base font-bold text-slate-900 font-heading flex-1 pr-2"
            numberOfLines={1}
          >
            {deviceTitle}
          </Text>
          {item.device_type ? (
            <View className="bg-slate-100 px-2 py-0.5 rounded-md">
              <Text className="text-[10px] font-medium text-slate-500 font-body">
                {item.device_type}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Symptom Box */}
        <View className="bg-slate-50/90 rounded-xl p-2.5 mb-3 border border-slate-100 flex-row items-start gap-2">
          <Ionicons name="chatbox-ellipses-outline" size={14} color="#64748B" style={{ marginTop: 1 }} />
          <Text className="text-xs text-slate-600 font-body flex-1 leading-4" numberOfLines={2}>
            <Text className="font-bold text-slate-700">อาการเสีย: </Text>
            {symptomText}
          </Text>
        </View>

        {/* 7-Step Visual Progress Stepper */}
        <View className="bg-slate-50/70 rounded-2xl p-3 mb-3 border border-slate-100/90">
          {/* Spotlight Header */}
          <View className="flex-row items-center justify-between mb-2.5">
            <View className="flex-row items-center gap-1.5">
              <View
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: isCompleted ? '#10B981' : statusCfg.color }}
              />
              <Text className="text-[12px] font-bold font-heading text-slate-800">
                {isCompleted
                  ? 'ส่งมอบเครื่องเสร็จสิ้น'
                  : `ขั้นตอนที่ ${progressStage}/7: ${CUSTOMER_STEPS[progressStage - 1]}`}
              </Text>
            </View>
          </View>

          <View className="relative w-full py-1">
            {/* Background Track Line */}
            <View
              style={{
                position: 'absolute',
                top: 11,
                left: `${(0.5 / 7) * 100}%`,
                width: `${(6 / 7) * 100}%`,
                height: 2.5,
                backgroundColor: '#E2E8F0',
                borderRadius: 2,
              }}
            />
            {/* Active Track Line */}
            <View
              style={{
                position: 'absolute',
                top: 11,
                left: `${(0.5 / 7) * 100}%`,
                width: `${
                  isCompleted
                    ? (6 / 7) * 100
                    : ((Math.max(1, progressStage) - 1) / 7) * 100
                }%`,
                height: 2.5,
                backgroundColor: isCompleted ? '#10B981' : statusCfg.color,
                borderRadius: 2,
              }}
            />
            <View className="flex-row items-start justify-between">
              {CUSTOMER_STEPS.map((stepName, idx) => {
                const stepNum = idx + 1;
                const isDone = isCompleted || progressStage > stepNum;
                const isCurrent = !isCompleted && progressStage === stepNum;

                return (
                  <View key={stepName} className="items-center flex-1 z-10">
                    <View className="h-6 items-center justify-center">
                      {isDone ? (
                        <View className="w-5 h-5 rounded-full bg-emerald-500 items-center justify-center border-2 border-white shadow-xs">
                          <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                        </View>
                      ) : isCurrent ? (
                        <View
                          className="w-[22px] h-[22px] rounded-full items-center justify-center border-2 border-white shadow-xs"
                          style={{
                            backgroundColor: statusCfg.color,
                          }}
                        >
                          <View className="w-1.5 h-1.5 rounded-full bg-white" />
                        </View>
                      ) : (
                        <View className="w-3.5 h-3.5 rounded-full bg-slate-200 border-2 border-white" />
                      )}
                    </View>
                    <Text
                      className={`text-[8.5px] mt-1 font-body text-center ${
                        isCurrent
                          ? 'font-bold'
                          : isDone
                          ? 'font-medium text-slate-700'
                          : 'text-slate-400'
                      }`}
                      style={isCurrent ? { color: statusCfg.color } : undefined}
                      numberOfLines={1}
                    >
                      {stepName}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Price / Status Row */}
        {item.total_amount && Number(item.total_amount) > 0 ? (
          <View className="flex-row items-center justify-between pt-2.5 border-t border-slate-100">
            <View className="flex-row items-center gap-1.5">
              <Ionicons
                name={isCompleted ? 'receipt-outline' : 'cash-outline'}
                size={15}
                color={isCompleted ? '#10B981' : '#64748B'}
              />
              <Text className="text-xs text-slate-500 font-body">
                {isCompleted ? 'ยอดชำระแล้ว' : 'ยอดรวมค่าซ่อม'}
              </Text>
            </View>
            <Text
              className={`text-base font-bold font-heading ${
                isCompleted ? 'text-emerald-600' : 'text-slate-900'
              }`}
            >
              ฿{Number(item.total_amount).toLocaleString()}
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center justify-between pt-2.5 border-t border-slate-100">
            <View className="flex-row items-center gap-1.5 flex-1 pr-2">
              <Ionicons name="time-outline" size={15} color="#94A3B8" />
              <Text className="text-xs text-slate-400 font-body" numberOfLines={1}>
                {statusId === 1 || statusId === 2
                  ? 'อยู่ระหว่างตรวจเช็คสภาพเครื่อง'
                  : statusId === 3
                  ? 'กำลังจัดทำใบเสนอราคา'
                  : 'รอการสรุปค่าบริการ'}
              </Text>
            </View>
            <View className="px-2 py-0.5 rounded-md bg-slate-100">
              <Text className="text-[10px] font-medium text-slate-500 font-body">
                {statusId <= 3 ? 'รอประเมินราคา' : '-'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Card Action Footer */}
      <View className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex-row items-center justify-end gap-2">
        {isNeedsApproval ? (
          <TouchableOpacity
            activeOpacity={0.85}
            className="flex-1 bg-purple-600 active:bg-purple-700 py-2.5 px-4 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
            onPress={() => onPressDetails(targetId)}
          >
            <Ionicons name="receipt-outline" size={16} color="#FFFFFF" />
            <Text className="text-white text-xs font-bold font-heading">
              ตรวจสอบและอนุมัติใบเสนอราคา
            </Text>
            <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
          </TouchableOpacity>
        ) : isPendingPayment ? (
          <TouchableOpacity
            activeOpacity={0.85}
            className="flex-1 bg-amber-500 active:bg-amber-600 py-2.5 px-4 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
            onPress={() => onPressDetails(targetId)}
          >
            <Ionicons name="card-outline" size={16} color="#FFFFFF" />
            <Text className="text-white text-xs font-bold font-heading">
              ดูวิธีชำระเงิน & แจ้งชำระ
            </Text>
            <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
          </TouchableOpacity>
        ) : isReadyForPickup ? (
          <TouchableOpacity
            activeOpacity={0.85}
            className="flex-1 bg-sky-600 active:bg-sky-700 py-2.5 px-4 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
            onPress={() => onPressDetails(targetId)}
          >
            <Ionicons name="cube-outline" size={16} color="#FFFFFF" />
            <Text className="text-white text-xs font-bold font-heading">
              เครื่องพร้อมรับ (ดูรายละเอียด)
            </Text>
            <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            className="flex-1 bg-slate-900 active:bg-slate-800 py-2.5 px-4 rounded-xl flex-row items-center justify-center gap-2 shadow-xs"
            onPress={() => onPressDetails(targetId)}
          >
            <Ionicons name="newspaper-outline" size={15} color="#FFFFFF" />
            <Text className="text-white text-xs font-bold font-heading">
              ดูรายละเอียดและประวัติงาน
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
