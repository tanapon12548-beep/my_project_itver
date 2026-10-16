// 1. React & React Native
import React from 'react';
import { Text, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface MetricCardsProps {
  /** แสดงตัวเลขการเงิน (รายได้ / ต้นทุนอะไหล่ / กำไร) — ปิดสำหรับพนักงาน (Staff) */
  showRevenue?: boolean;
  totalRevenue?: number;
  /** ต้นทุนอะไหล่รวม (เฉพาะใบเสนอราคาที่ลูกค้าอนุมัติแล้ว) — ใช้คิดกำไรขั้นต้น */
  partsCost?: number;
  /** กำไรขั้นต้น = รายได้รวม - ต้นทุนอะไหล่ */
  grossProfit?: number;
  totalJobs?: number;
  completedJobs?: number;
  pendingJobs?: number;
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  borderColor: string;
  percent?: number;
  progress?: number;
}

function MetricRow({ title, value, icon, color, bgColor, borderColor, percent, progress }: MetricCardProps) {
  return (
    <View className="py-3.5">
      <View className="flex-row items-center">
        <View className="flex-1 flex-row items-center gap-3">
          <View
            className="h-9 w-9 items-center justify-center rounded-xl border"
            style={{ backgroundColor: bgColor, borderColor }}
          >
            <Ionicons name={icon} size={18} color={color} />
          </View>
          <Text className="flex-1 font-heading text-xs font-medium text-slate-600" numberOfLines={2}>
            {title}
          </Text>
        </View>
        <Text className="font-heading text-xl font-bold tracking-tight" style={{ color }}>
          {value}
        </Text>
        {/* {typeof percent === 'number' && (
          <Text className="ml-2 w-12 text-right font-body text-[11px] font-semibold text-slate-400">
            {percent}%
          </Text>
        )} */}
      </View>
      {/* {typeof progress === 'number' && (
        <View className="ml-12 mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <View
            className="h-full rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%`, backgroundColor: color }}
          />
        </View>
      )} */}
    </View>
  );
}

export default function MetricCards({
  showRevenue = true,
  totalRevenue = 0,
  partsCost = 0,
  grossProfit = 0,
  totalJobs = 0,
  completedJobs = 0,
  pendingJobs = 0,
}: MetricCardsProps) {
  // รองรับค่าติดลบ (กำไรติดลบ) ให้อ่านเป็น -฿1,890 ไม่ใช่ ฿-1,890
  const formatCurrency = (amount: number) => {
    const safe = Number.isFinite(amount) ? amount : 0;
    const sign = safe < 0 ? '-' : '';
    const abs = Math.abs(safe);
    if (abs >= 1000000) return `${sign}฿${(abs / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `${sign}฿${(abs / 1000).toFixed(1)}K`;
    return `${sign}฿${Math.round(abs).toLocaleString()}`;
  };

  const safeTotal = Math.max(0, totalJobs);
  const safeCompleted = Math.max(0, Math.min(completedJobs, safeTotal));
  const safePending = Math.max(0, Math.min(pendingJobs, safeTotal - safeCompleted));
  const otherCount = Math.max(0, safeTotal - safeCompleted - safePending);

  const pct = (n: number) => (safeTotal > 0 ? Math.round((n / safeTotal) * 100) : 0);

  const pieData: { value: number; color: string }[] = [];
  if (safeTotal > 0) {
    if (safeCompleted > 0) pieData.push({ value: safeCompleted, color: '#16A34A' });
    if (safePending > 0) pieData.push({ value: safePending, color: '#D97706' });
    if (otherCount > 0) pieData.push({ value: otherCount, color: '#94A3B8' });
  } else {
    pieData.push({ value: 1, color: '#F1F5F9' });
  }
  // กำไรขั้นต้น: ถ้าติดลบให้ใช้สีแดงเพื่อเตือน, margin% ยิ่งสูงยิ่งดี
  const safeRevenue = Math.max(0, totalRevenue);
  const safePartsCost = Math.max(0, partsCost);
  const profitIsNegative = grossProfit < 0;
  const profitColor = profitIsNegative ? '#DC2626' : '#059669';
  const profitBg = profitIsNegative ? '#FEF2F2' : '#ECFDF5';
  const profitBorder = profitIsNegative ? '#FEE2E2' : '#D1FAE5';
  const marginPct = safeRevenue > 0 ? Math.round((grossProfit / safeRevenue) * 100) : 0;

  // ตัวเลขการเงิน — แสดงเฉพาะบทบาทที่ดูได้ (ผู้จัดการ)
  const moneyMetrics: MetricCardProps[] = [
    {
      title: 'รายได้รวม',
      value: formatCurrency(totalRevenue),
      icon: 'cash',
      color: '#DC2626',
      bgColor: '#FEF2F2',
      borderColor: '#FEE2E2',
    },
    {
      title: 'ต้นทุนอะไหล่',
      value: formatCurrency(safePartsCost),
      icon: 'pricetags',
      color: '#B45309',
      bgColor: '#FFFBEB',
      borderColor: '#FEF3C7',
    },
    {
      title: 'กำไรขั้นต้น (รายรับ - ต้นทุนอะไหล่)',
      value: formatCurrency(grossProfit),
      icon: profitIsNegative ? 'trending-down' : 'trending-up',
      color: profitColor,
      bgColor: profitBg,
      borderColor: profitBorder,
      percent: safeRevenue > 0 ? marginPct : undefined,
    },
  ];

  // พนักงาน (Staff) จะไม่เห็นตัวเลขการเงินเลย → เริ่มจาก "งานซ่อมทั้งหมด" เป็นการ์ดหลักแทน
  const metrics: MetricCardProps[] = [
    ...(showRevenue ? moneyMetrics : []),
    {
      title: 'งานซ่อมทั้งหมด',
      value: `${safeTotal.toLocaleString()} เครื่อง`,
      icon: 'cube',
      color: '#0284C7',
      bgColor: '#F0F9FF',
      borderColor: '#E0F2FE',
    },
    {
      title: 'ซ่อมสำเร็จแล้ว',
      value: `${safeCompleted.toLocaleString()} เครื่อง`,
      icon: 'checkmark-done-circle',
      color: '#16A34A',
      bgColor: '#F0FDF4',
      borderColor: '#DCFCE7',
      percent: pct(safeCompleted),
      progress: safeTotal > 0 ? safeCompleted / safeTotal : 0,
    },
    {
      title: 'รอดำเนินการ',
      value: `${safePending.toLocaleString()} เครื่อง`,
      icon: 'time',
      color: '#D97706',
      bgColor: '#FFFBEB',
      borderColor: '#FEF3C7',
      percent: pct(safePending),
      progress: safeTotal > 0 ? safePending / safeTotal : 0,
    },
  ];

  const [primaryMetric, ...supportingMetrics] = metrics;

  return (
    <View className="mx-4 mb-4 overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <View className="bg-red-600 px-5 py-5">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-heading text-xs font-medium text-red-100">
              {primaryMetric.title}
            </Text>
            <Text className="mt-1 font-heading text-[32px] font-bold tracking-tight text-white">
              {primaryMetric.value}
            </Text>
          </View>
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <Ionicons name={primaryMetric.icon} size={24} color="#FFFFFF" />
          </View>
        </View>
        <View className="mt-4 h-1 w-10 rounded-full bg-red-200" />
      </View>

      <View className="px-4">
        {supportingMetrics.map((item, index) => (
          <View
            key={item.title}
            className={index < supportingMetrics.length - 1 ? 'border-b border-slate-100' : ''}
          >
            <MetricRow {...item} />
          </View>
        ))}
      </View>
    </View>
  );
}
