// 1. React & React Native
import React from 'react';
import { ActivityIndicator, Text, View, useWindowDimensions } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-gifted-charts';

import { getDeviceTypeSuffix } from '@/lib/deviceTypeLabel';

import { Colors } from '@/constants/theme';

/** หนึ่งหมวดอุปกรณ์ที่ได้จาก API (ชื่อมาจากตาราง device_types จริง) */
export interface CategoryDatum {
  name: string;
  count: number;
}

interface CategoryChartProps {
  /** หมวดอุปกรณ์จากฐานข้อมูล (GET /api/dashboard/category) */
  types?: CategoryDatum[];
  total?: number;
  isLoading?: boolean;
  deviceType?: string;
}

/**
 * หน้าตาของแต่ละหมวด (ไอคอน + สี) — จับคู่จาก "ชื่อประเภทอุปกรณ์" ที่อยู่ในฐานข้อมูล
 * ถ้าชื่อไหนยังไม่ตรงกับตารางนี้ จะใช้ไอคอนกลาง + สีสำรองตามลำดับ (ไม่ทำให้กราฟพัง)
 */
const TYPE_VISUALS: { test: RegExp; icon: string; color: string }[] = [
  { test: /notebook|laptop/i, icon: 'laptop-outline', color: '#F97316' }, // ส้ม
  { test: /all-in-one|desktop|computer|\bpc\b/i, icon: 'desktop-outline', color: Colors.primary }, // แดงแบรนด์
  { test: /printer|scanner|print|scan/i, icon: 'print-outline', color: '#0284C7' }, // ฟ้า
  { test: /monitor|display|screen/i, icon: 'tv-outline', color: '#0D9488' }, // เขียวน้ำทะเล
  { test: /tablet|ipad/i, icon: 'tablet-portrait-outline', color: '#7C3AED' }, // ม่วง
  { test: /phone|mobile|มือถือ/i, icon: 'phone-portrait-outline', color: '#DB2777' }, // ชมพู
];

const FALLBACK_COLORS = ['#64748B', '#0EA5E9', '#65A30D', '#D97706', '#9333EA'];

const visualFor = (name: string, index: number) =>
  TYPE_VISUALS.find((v) => v.test.test(name)) ?? {
    icon: 'hardware-chip-outline',
    color: FALLBACK_COLORS[index % FALLBACK_COLORS.length],
  };

export default function CategoryChart({
  types,
  total,
  isLoading = false,
  deviceType,
}: CategoryChartProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 640;

  const data = types ?? [];
  const calculatedTotal = total ?? data.reduce((sum, t) => sum + t.count, 0);

  // เฉพาะหมวดที่มีงานจริง เรียงตามที่ API ส่งมา (มาก -> น้อย)
  const activeTypes = data.filter((t) => t.count > 0);

  const pieData =
    calculatedTotal > 0
      ? activeTypes.map((t, index) => ({
          value: t.count,
          color: visualFor(t.name, index).color,
        }))
      : // วงแหวนสีอ่อนตอนยังไม่มีข้อมูล
        [{ value: 1, color: '#F1F5F9' }];

  const getPercent = (count: number) => {
    if (calculatedTotal === 0) return 0;
    return Math.round((count / calculatedTotal) * 100);
  };

  const displayCategories = activeTypes.map((t, index) => ({
    id: `${t.name}-${index}`,
    label: t.name,
    count: t.count,
    percent: getPercent(t.count),
    ...visualFor(t.name, index),
  }));

  return (
    <View className="bg-white p-4 mx-4 mb-4 rounded-2xl border border-slate-200 shadow-sm">
      {/* Header Row */}
      <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 items-center justify-center">
            <Ionicons name="pie-chart" size={16} color={Colors.primary} />
          </View>
          <View>
            <Text className="text-sm font-bold text-slate-800 font-heading">
              สัดส่วนอุปกรณ์ตามประเภท
            </Text>
            <Text className="text-[11px] text-slate-400 font-body">
              จำแนกตามชนิดอุปกรณ์ • ซิงค์ตามตัวกรอง{getDeviceTypeSuffix(deviceType)}
            </Text>
          </View>
        </View>

        <View className="bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
          <Text className="text-xs font-bold text-slate-700 font-heading">
            {calculatedTotal} เครื่อง
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="h-[180px] justify-center items-center">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text className="mt-2.5 font-body text-xs text-slate-400">
            กำลังประมวลผลสัดส่วน...
          </Text>
        </View>
      ) : (
        <View className={`${isWide ? 'flex-row items-center justify-between gap-6' : 'flex-col'}`}>
          {/* Donut Chart Showcase */}
          <View className={`items-center justify-center ${isWide ? 'flex-1' : 'mb-5 py-2'}`}>
            <View className="relative items-center justify-center">
              <PieChart
                donut
                data={pieData}
                radius={76}
                innerRadius={54}
                showText={false}
                focusOnPress
                centerLabelComponent={() => (
                  <View className="justify-center items-center">
                    <Text className="text-2xl font-extrabold text-slate-800 font-heading">
                      {calculatedTotal}
                    </Text>
                    <Text className="text-[10px] font-medium text-slate-400 font-body -mt-0.5">
                      {calculatedTotal > 0 ? 'เครื่องทั้งหมด' : 'ไม่มีงาน'}
                    </Text>
                  </View>
                )}
              />
            </View>
          </View>

          {/* Clean Category Breakdown Cards */}
          <View className={`${isWide ? 'flex-1' : 'w-full'}`}>
            {displayCategories.length === 0 ? (
              <Text className="text-xs text-slate-400 font-body text-center py-4">
                ยังไม่มีงานซ่อมในช่วงที่เลือก
              </Text>
            ) : (
              displayCategories.map((item) => (
                <View
                  key={item.id}
                  className="bg-slate-50/80 border border-slate-100 rounded-xl p-2.5 mb-2"
                >
                  <View className="flex-row items-center justify-between">
                    {/* Left: Icon & Label */}
                    <View className="flex-row items-center gap-2 flex-1 mr-2">
                      <View
                        className="w-6 h-6 rounded-lg items-center justify-center"
                        style={{ backgroundColor: `${item.color}18` }}
                      >
                        <Ionicons name={item.icon as any} size={13} color={item.color} />
                      </View>
                      <Text
                        className="text-xs font-bold text-slate-800 font-heading"
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                    </View>

                    {/* Right: Count & Percentage */}
                    <View className="flex-row items-baseline gap-1.5">
                      <Text className="text-xs font-bold text-slate-900 font-heading">
                        {item.count} เครื่อง
                      </Text>
                      <Text className="text-[11px] font-semibold text-slate-400 font-body min-w-[32px] text-right">
                        {item.percent}%
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      )}
    </View>
  );
}
