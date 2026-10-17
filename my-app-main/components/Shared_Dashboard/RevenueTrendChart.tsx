// 1. React & React Native
import React from 'react';
import { ActivityIndicator, Text, View, useWindowDimensions } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { LineChart, CurveType } from 'react-native-gifted-charts';

import { getDeviceTypeBullet } from '@/lib/deviceTypeLabel';

import { Colors } from '@/constants/theme';

export interface RevenueTrendDataPoint {
  value: number;
  label: string;
  /** จุดข้อมูลรายวันของวันที่ยอด 0 จะถูกซ่อนอัตโนมัติ เพื่อไม่ให้มีจุดลอยอยู่บนแกนล่าง */
  hideDataPoint?: boolean;
}

export interface RevenueTrendChartProps {
  timeFilter: 'day' | 'month' | 'year';
  deviceType?: string;
  data?: RevenueTrendDataPoint[];
  isLoading?: boolean;
  /** ปรับโทนสีได้: 'emerald' (เขียวการเงินพรีเมียม ค่าเริ่มต้น) หรือ 'blue' (ฟ้าสอดคล้องกับ Dashboard) */
  colorTheme?: 'emerald' | 'blue';
  /** ต้นทุนอะไหล่ในช่วงเดียวกับกราฟ (เฉพาะใบเสนอราคาที่อนุมัติแล้ว) */
  partsCost?: number;
  /** กำไรขั้นต้น = รายได้รวม - ต้นทุนอะไหล่ */
  grossProfit?: number;
}

const COLOR_PALETTES = {
  emerald: {
    main: '#059669', // Emerald 600
    peak: '#047857', // วันที่ยอดสูงสุด (Emerald 700)
    areaStart: '#10B981', // ไล่เฉดสีใต้เส้น (Emerald 500)
    bgBadge: '#ECFDF5',
    borderBadge: '#A7F3D0',
    textBadge: '#047857',
    iconBg: '#ECFDF5',
    iconBorder: '#D1FAE5',
    statsHighlight: '#047857',
  },
  blue: {
    main: '#0284C7', // Sky 600
    peak: '#0369A1', // Sky 700
    areaStart: '#38BDF8', // Sky 400
    bgBadge: '#F0F9FF',
    borderBadge: '#BAE6FD',
    textBadge: '#0369A1',
    iconBg: '#F0F9FF',
    iconBorder: '#E0F2FE',
    statsHighlight: '#0369A1',
  },
};

const NO_OF_SECTIONS = 4;
const CHART_HEIGHT = 180;
const EDGE_SPACING = 16;
/** ความกว้างขั้นต่ำที่ชื่อบนแกน X 1 ชื่อต้องใช้ (px) — ใช้คำนวณว่าจะเว้นชื่อทุกกี่จุด */
const MIN_LABEL_WIDTH = 16;
/** ความโค้งของเส้น ยิ่งมากยิ่งโค้ง (0.2 = ค่ามาตรฐานของไลบรารี) */
const CURVATURE = 0.2;
/** ตัวคูณที่ทำให้ตัวเลขบนแกน Y เป็น "เลขสวย" (1, 1.5, 2, ... 10) ไม่กระโดดข้ามขั้นจนเกินจำเป็น */
const NICE_STEP_FACTORS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

/**
 * หาสเกลแกน Y แบบ "เลขสวย" ที่ใกล้ค่าจริงที่สุด
 * (เดิมกระโดดขั้นตาม magnitude ทำให้ maxVal โตเกินข้อมูลจริงได้เกือบ 2 เท่า)
 */
const calculateFinancialScale = (max: number) => {
  if (!max || max <= 0) return { maxVal: 1000, stepVal: 250 };

  const rawStep = max / NO_OF_SECTIONS;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));

  for (const factor of NICE_STEP_FACTORS) {
    // ปัดขึ้นเป็นจำนวนเต็มขั้นต่ำ 1 เสมอ เพราะหน่วยเงิน (บาท) ไม่มีทศนิยม
    const stepVal = Math.max(1, Math.ceil(magnitude * factor));
    if (stepVal * NO_OF_SECTIONS >= max) {
      return { maxVal: stepVal * NO_OF_SECTIONS, stepVal };
    }
  }

  const fallbackStep = Math.max(1, Math.ceil(magnitude * 10));
  return { maxVal: fallbackStep * NO_OF_SECTIONS, stepVal: fallbackStep };
};

export default function RevenueTrendChart({
  timeFilter,
  deviceType,
  data = [],
  isLoading = false,
  colorTheme = 'emerald',
  partsCost,
  grossProfit,
}: RevenueTrendChartProps) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(280, width - 84);
  const theme = COLOR_PALETTES[colorTheme] || COLOR_PALETTES.emerald;

  // แปลงค่าเงินย่อสำหรับ Badge / Cards (รองรับค่าติดลบ เช่น กำไรติดลบ)
  const formatCurrency = (amount: number) => {
    const safe = Number.isFinite(amount) ? amount : 0;
    const sign = safe < 0 ? '-' : '';
    const abs = Math.abs(safe);
    if (abs >= 1000000) return `${sign}฿${(abs / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `${sign}฿${(abs / 1000).toFixed(1)}K`;
    return `${sign}฿${Math.round(abs).toLocaleString()}`;
  };

  // คำนวณรายได้รวม
  const totalRevenue = data.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

  // สเกลทางการเงินของแกน Y (แบ่ง 4 ส่วน)
  const rawMax = data.length > 0 ? Math.max(...data.map((d) => Number(d.value) || 0)) : 0;
  const { maxVal, stepVal } = calculateFinancialScale(rawMax);

  // หน่วยของแกน: เลือกจากขนาดสเกล เพื่อให้ทุก label ใช้หน่วยเดียวกัน (ไม่ปน 800 / 1.6K / 2.4K)
  const axisUnit = maxVal >= 1000000 ? 1000000 : stepVal >= 1000 ? 1000 : 1;
  const axisSuffix = axisUnit === 1000000 ? 'M' : axisUnit === 1000 ? 'K' : '';

  // แสดงผลตัวเลขแกน Y ให้สั้น กระชับ และอ่านง่าย
  const formatY = (val: number) => {
    if (val === 0) return '0';
    if (axisUnit === 1) return Math.round(val).toLocaleString();
    const short = val / axisUnit;
    const decimals = Number.isInteger(short) ? 0 : Number.isInteger(short * 10) ? 1 : 2;
    return `${short.toFixed(decimals)}${axisSuffix}`;
  };

  // ค่าเฉลี่ย: คิดเฉพาะ "ช่วงที่มีรายได้จริง" (ไม่เอาวันที่ยอด 0 มาฉุดค่าเฉลี่ยให้ต่ำ)
  const earningCount = data.filter((d) => (Number(d.value) || 0) > 0).length;
  const avgRevenue = earningCount > 0 ? Math.round(totalRevenue / earningCount) : 0;
  const avgLabel =
    timeFilter === 'day'
      ? 'เฉลี่ยวันที่มีขาย'
      : timeFilter === 'month'
      ? 'เฉลี่ยเดือนที่มีขาย'
      : 'เฉลี่ยปีที่มีขาย';
  const peakPoint = data.reduce<{ value: number; label: string } | null>((max, d) => {
    const val = Number(d.value) || 0;
    return val > (max?.value || 0) ? { value: val, label: d.label } : max;
  }, null);

  const pointCount = data.length;

  // ── ย่อทุกจุดให้พอดีความกว้างจอเสมอ (ไม่ต้องเลื่อนซ้าย-ขวา) ──
  const availableWidth = Math.max(60, chartWidth - EDGE_SPACING * 2);
  const spacing = pointCount > 1 ? availableWidth / (pointCount - 1) : availableWidth;

  /**
   * ถ้าจุดถี่จนชื่อวันจะทับกัน (เช่นโหมดรายวัน 31 วัน) ให้เว้นชื่อเป็นช่วง ๆ
   * เช่น 1, 3, 5, ... 31 — จุดยังครบทุกวัน แค่ไม่เขียนเลขทุกจุด
   */
  const labelStride = Math.max(1, Math.ceil(MIN_LABEL_WIDTH / Math.max(spacing, 1)));

  // จุดที่ยอดสูงสุด → เน้นให้เด่นกว่าจุดอื่น
  const peakIndex = data.reduce(
    (best, d, i) => ((Number(d.value) || 0) > (Number(data[best]?.value) || 0) ? i : best),
    0
  );

  // ── จุดข้อมูล: เส้นโค้งเรียบ + ซ่อนจุดของวันที่ยอด 0 (ไม่ให้มีจุดลอยเกาะแกนล่าง) ──
  const lineData = data.map((d, index) => {
    const value = Math.max(0, Number(d.value) || 0);
    const isPeak = index === peakIndex && value > 0;

    return {
      value,
      // เว้นชื่อวันที่ไม่จำเป็น เพื่อไม่ให้เลขทับกันตอนดูรายวันทั้งเดือน
      label: index % labelStride === 0 ? d.label : '',
      hideDataPoint: value === 0,
      dataPointRadius: isPeak ? 5 : 3.5,
      dataPointColor: isPeak ? theme.peak : theme.main,
    };
  });

  // ช่วงข้อมูลจริงบนแกน (ใช้อธิบายในหัวการ์ด เช่น วันที่ 1 - 16)
  const rangeLabel =
    pointCount > 1
      ? `${data[0]?.label} - ${data[pointCount - 1]?.label}`
      : `${data[0]?.label ?? ''}`;

  const deviceLabel = getDeviceTypeBullet(deviceType);

  const subtitleText =
    (timeFilter === 'day'
      ? `รายวัน (วันที่ ${rangeLabel})`
      : timeFilter === 'month'
      ? `รายเดือน (${rangeLabel})`
      : `รายปี (${rangeLabel})`) + deviceLabel;

  // ── สรุปตัวเลขในกรอบเดียวกับข้อมูลจริงของกราฟ (รายรับ - ต้นทุนอะไหล่ = กำไรขั้นต้น) ──
  const safeRevenue = Math.max(0, totalRevenue);
  const profitIsNegative = (grossProfit ?? 0) < 0;
  const profitColor = profitIsNegative ? Colors.primary : '#047857';
  const marginPct = safeRevenue > 0 ? Math.round(((grossProfit ?? 0) / safeRevenue) * 100) : 0;

  const statCells: { label: string; value: string; color?: string }[] = [
    { label: 'รายได้รวม', value: formatCurrency(totalRevenue) },
  ];

  if (typeof partsCost === 'number') {
    statCells.push({ label: 'ต้นทุนอะไหล่', value: formatCurrency(partsCost), color: '#B45309' });
  }
  if (typeof grossProfit === 'number') {
    statCells.push({ label: 'กำไรขั้นต้น', value: formatCurrency(grossProfit), color: profitColor });
    // มีรายได้แต่ไม่มีกำไร (เช่น ยังไม่ได้กรอกราคาทุน) → ไม่ต้องโชว์ 0% ให้เข้าใจผิด
    statCells.push({
      label: 'อัตรากำไร',
      value: safeRevenue > 0 ? `${marginPct}%` : '-',
      color: profitColor,
    });
  }

  statCells.push({ label: avgLabel, value: formatCurrency(avgRevenue) });
  statCells.push({
    label: 'ยอดสูงสุด',
    value: peakPoint && peakPoint.value > 0 ? formatCurrency(peakPoint.value) : '-',
    color: theme.statsHighlight,
  });

  // แบ่งเป็นแถวละไม่เกิน 3 ช่อง เพื่อให้ตัวเลขไม่เบียดกันบนจอมือถือ
  const statRows: (typeof statCells)[] = [];
  for (let i = 0; i < statCells.length; i += 3) {
    statRows.push(statCells.slice(i, i + 3));
  }

  return (
    <View className="bg-white p-4 mx-4 mb-4 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-slate-100">
        <View className="flex-row items-center gap-2.5 flex-1 pr-2">
          <View
            className="w-9 h-9 rounded-xl border items-center justify-center"
            style={{ backgroundColor: theme.iconBg, borderColor: theme.iconBorder }}
          >
            <Ionicons name="trending-up-outline" size={18} color={theme.main} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-sm font-bold text-slate-800 font-heading">
                แนวโน้มรายได้
              </Text>
              <Text className="text-xs text-slate-400 font-medium font-body">
                (บาท)
              </Text>
            </View>
            <Text className="text-[11px] text-slate-400 font-body mt-0.5" numberOfLines={1}>
              {subtitleText}
            </Text>
          </View>
        </View>

        <View
          className="px-2.5 py-1 rounded-full border"
          style={{ backgroundColor: theme.bgBadge, borderColor: theme.borderBadge }}
        >
          <Text
            className="text-xs font-bold font-heading"
            style={{ color: theme.textBadge }}
          >
            {formatCurrency(totalRevenue)}
          </Text>
        </View>
      </View>

      {/* Mini Summary Stats — รายรับ / ต้นทุนอะไหล่ / กำไรขั้นต้น + ค่าสถิติของกราฟ */}
      {data.length > 0 && !isLoading && (
        <View className="bg-slate-50/90 rounded-xl px-3 py-2.5 mb-3 border border-slate-100">
          {statRows.map((row, rowIndex) => (
            <View key={`stat_row_${rowIndex}`}>
              {rowIndex > 0 && <View className="h-[1px] bg-slate-200 my-2.5" />}
              <View className="flex-row items-center justify-between">
                {row.map((cell, cellIndex) => (
                  <React.Fragment key={cell.label}>
                    {cellIndex > 0 && <View className="w-[1px] h-6 bg-slate-200" />}
                    <View className="items-center flex-1 px-1">
                      <Text className="text-[10px] text-slate-400 font-body" numberOfLines={1}>
                        {cell.label}
                      </Text>
                      <Text
                        className="text-xs font-bold text-slate-700 font-heading mt-0.5"
                        style={cell.color ? { color: cell.color } : undefined}
                        numberOfLines={1}
                      >
                        {cell.value}
                      </Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Chart Area */}
      <View className="-ml-2.5">
        {isLoading ? (
          <View className="h-[180px] justify-center items-center">
            <ActivityIndicator size="large" color={theme.main} />
            <Text className="mt-2 font-body text-xs text-slate-400">
              กำลังโหลดข้อมูลแนวโน้มรายได้...
            </Text>
          </View>
        ) : data.length > 0 ? (
          <LineChart
            key={`revenue_line_${timeFilter}_${data.length}_${colorTheme}`}
            isAnimated
            animationDuration={700}
            data={lineData}
            // เส้นโค้งเรียบแบบ Quadratic: มุมโค้งนุ่ม และค่าลบไม่ล้นลงใต้แกน 0
            curved
            curveType={CurveType.QUADRATIC}
            curvature={CURVATURE}
            thickness={3}
            color={theme.main}
            // ถมสีใต้เส้นแบบไล่เฉดจางลง เพื่อให้อ่านยอดรวมของช่วงได้ง่ายขึ้น
            areaChart
            startFillColor={theme.areaStart}
            endFillColor={theme.areaStart}
            startOpacity={0.28}
            endOpacity={0.02}
            gradientDirection="vertical"
            spacing={spacing}
            initialSpacing={EDGE_SPACING}
            endSpacing={EDGE_SPACING}
            maxValue={maxVal}
            noOfSections={NO_OF_SECTIONS}
            stepValue={stepVal}
            roundToDigits={0}
            formatYLabel={(val) => formatY(Number(val))}
            rulesType="dashed"
            rulesColor="#F1F5F9"
            dashWidth={4}
            dashGap={4}
            yAxisColor="transparent"
            xAxisColor="#E2E8F0"
            yAxisThickness={0}
            xAxisThickness={1}
            yAxisTextStyle={{ color: '#94A3B8', fontSize: 10, fontWeight: '500' }}
            xAxisLabelTextStyle={{
              color: '#64748B',
              fontSize: pointCount > 24 ? 9 : 10,
              fontWeight: '600',
            }}
            height={CHART_HEIGHT}
            labelsExtraHeight={14}
            xAxisLabelsVerticalShift={4}
            width={chartWidth}
            disableScroll
          />
        ) : (
          <View className="h-[180px] justify-center items-center">
            <Ionicons name="cash-outline" size={28} color="#CBD5E1" />
            <Text className="mt-2 font-body text-xs text-slate-400">
              ไม่มีข้อมูลรายได้ในช่วงเวลาที่เลือก
            </Text>
          </View>
        )}
      </View>

      {/* คำอธิบายสี (ช่วยให้อ่านจุดยอดสูงสุดได้ทันที) */}
      {!isLoading && data.length > 0 && rawMax > 0 && (
        <View className="flex-row items-center justify-center gap-4 mt-2.5">
          <View className="flex-row items-center gap-1.5">
            <View
              className="w-4 h-[3px] rounded-full"
              style={{ backgroundColor: theme.main }}
            />
            <Text className="text-[10px] text-slate-400 font-body">
              รายได้ราย{timeFilter === 'day' ? 'วัน' : 'ช่วง'}
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: theme.peak }}
            />
            <Text className="text-[10px] text-slate-400 font-body">ยอดสูงสุด</Text>
          </View>
        </View>
      )}
    </View>
  );
}
