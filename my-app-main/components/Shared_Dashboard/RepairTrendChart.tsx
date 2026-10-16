// 1. React & React Native
import React from 'react';
import { ActivityIndicator, Text, View, useWindowDimensions } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import { LinearGradient, Stop } from 'react-native-svg';

import { getDeviceTypeBullet } from '@/lib/deviceTypeLabel';

export interface RepairTrendDataPoint {
  value: number;
  label: string;
  /** ซ่อนจุดข้อมูลของช่วงนั้น (ใช้กับช่วงที่ยังไม่มีงานซ่อม) ไม่ให้จุดไปนอนทับเส้นแกน X */
  hideDataPoint?: boolean;
}

export interface RepairTrendChartProps {
  timeFilter: 'day' | 'month' | 'year';
  deviceType?: string;
  data?: RepairTrendDataPoint[];
  isLoading?: boolean;
}

const NO_OF_SECTIONS = 4;
const CHART_HEIGHT = 180;
const EDGE_SPACING = 16;
/** ระยะห่างจุดต่ำสุดที่ชื่อวันยังอ่านออกบนมือถือ ถ้าน้อยกว่านี้ต้องยอมให้เลื่อนแนวนอน */
const MIN_FIT_SPACING = 15;

export default function RepairTrendChart({
  timeFilter,
  deviceType,
  data = [],
  isLoading = false,
}: RepairTrendChartProps) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(280, width - 84);
  const mainColor = '#DC2626'; // IT Vertex Crimson Red

  // รวมจำนวนเครื่องทั้งหมด
  const totalRepairs = data.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

  // คำนวณค่าสูงสุดให้เป็นจำนวนเต็มเสมอ ป้องกันตัวเลขทศนิยม (เช่น 1.1, 0.6 เครื่อง)
  const rawMax = data.length > 0 ? Math.max(...data.map((d) => Number(d.value) || 0)) : 0;
  const maxVal = rawMax <= 4 ? 4 : Math.ceil(rawMax / 4) * 4;
  const stepVal = Math.max(1, Math.round(maxVal / 4));

  // ค่าเฉลี่ยและจุดสูงสุด (คำนวณเป็นจำนวนเต็ม ปัดเศษ เช่น 0.1 หรือ 1.1 ให้เป็น 1)
  const avgRepairs =
    totalRepairs === 0 ? 0 : Math.max(1, Math.round(totalRepairs / (data.length || 1)));
  const peakPoint = data.reduce<{ value: number; label: string } | null>((max, d) => {
    const val = Number(d.value) || 0;
    return val > (max?.value || 0) ? { value: val, label: d.label } : max;
  }, null);

  // เตรียมข้อมูลสำหรับวาด: ยอด 0 ไม่ต้องวาดจุด (เหลือแค่เส้นกับพื้นที่) ไม่ให้จุดไปนอนทับเส้นแกน X
  const chartData: RepairTrendDataPoint[] = data.map((d) => {
    const value = Number(d.value) || 0;
    return { label: d.label, value, hideDataPoint: value <= 0 };
  });

  // ปรับ spacing และขนาดจุดให้สวยงามตามจำนวนข้อมูล (เช่น 1-31 วัน หรือ 12 เดือน)
  // ถ้าจำนวนช่วงน้อยพอ ก็ย่อให้พอดีความกว้างหน้าจอ ไม่ต้องเลื่อนแนวนอน
  const pointCount = chartData.length;
  const isDailyAxis = timeFilter === 'day';
  const pointRadius = pointCount > 24 ? 2.5 : 3.5;

  const fitSpacing = pointCount > 1 ? (chartWidth - EDGE_SPACING * 2) / (pointCount - 1) : chartWidth / 2;
  const needsScroll = fitSpacing < MIN_FIT_SPACING;
  const spacing = needsScroll ? (isDailyAxis ? 26 : 34) : fitSpacing;

  // ช่วงข้อมูลจริงบนแกน (ใช้อธิบายในหัวการ์ด เช่น วันที่ 1 - 16)
  const rangeLabel =
    pointCount > 1
      ? `${chartData[0]?.label} - ${chartData[pointCount - 1]?.label}`
      : `${chartData[0]?.label ?? ''}`;

  const deviceLabel = getDeviceTypeBullet(deviceType);

  const subtitleText =
    (timeFilter === 'day'
      ? `รายวัน (วันที่ ${rangeLabel})`
      : timeFilter === 'month'
      ? `รายเดือน (${rangeLabel})`
      : `รายปี (${rangeLabel})`) + deviceLabel;

  const periodUnit = timeFilter === 'day' ? '/วัน' : timeFilter === 'month' ? '/เดือน' : '/ปี';

  return (
    <View className="bg-white p-4 mx-4 mb-4 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-slate-100">
        <View className="flex-row items-center gap-2.5 flex-1 pr-2">
          <View className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 items-center justify-center">
            <Ionicons name="construct-outline" size={18} color={mainColor} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-sm font-bold text-slate-800 font-heading">
                แนวโน้มจำนวนงานซ่อม
              </Text>
              <Text className="text-xs text-slate-400 font-medium font-body">
                (เครื่อง)
              </Text>
            </View>
            <Text className="text-[11px] text-slate-400 font-body mt-0.5" numberOfLines={1}>
              {subtitleText}
              {needsScroll && pointCount > 1 ? ' • เลื่อนขวาเพื่อดูเพิ่มเติม' : ''}
            </Text>
          </View>
        </View>

        <View className="bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
          <Text className="text-xs font-bold text-red-600 font-heading">
            {totalRepairs.toLocaleString()} เครื่อง
          </Text>
        </View>
      </View>

      {/* Mini Summary Stats Row */}
      {data.length > 0 && !isLoading && (
        <View className="flex-row items-center justify-between bg-slate-50/90 rounded-xl px-3 py-2.5 mb-3 border border-slate-100">
          <View className="items-center flex-1">
            <Text className="text-[10px] text-slate-400 font-body">งานซ่อมรวม</Text>
            <Text className="text-xs font-bold text-slate-700 font-heading mt-0.5">
              {totalRepairs} เครื่อง
            </Text>
          </View>
          <View className="w-[1px] h-6 bg-slate-200" />
          <View className="items-center flex-1">
            <Text className="text-[10px] text-slate-400 font-body">เฉลี่ยต่อช่วง</Text>
            <Text className="text-xs font-bold text-slate-700 font-heading mt-0.5">
              {avgRepairs} เครื่อง{periodUnit}
            </Text>
          </View>
          <View className="w-[1px] h-6 bg-slate-200" />
          <View className="items-center flex-1">
            <Text className="text-[10px] text-slate-400 font-body">สูงสุดในรอบนี้</Text>
            <Text className="text-xs font-bold text-red-600 font-heading mt-0.5">
              {peakPoint && peakPoint.value > 0 ? `${peakPoint.value} เครื่อง` : '-'}
            </Text>
          </View>
        </View>
      )}

      {/* Chart Area */}
      <View className="-ml-2.5">
        {isLoading ? (
          <View className="h-[180px] justify-center items-center">
            <ActivityIndicator size="large" color={mainColor} />
            <Text className="mt-2 font-body text-xs text-slate-400">
              กำลังโหลดข้อมูลแนวโน้มงานซ่อม...
            </Text>
          </View>
        ) : data.length > 0 ? (
          <LineChart
            key={`repair_${timeFilter}_${data.length}`}
            isAnimated
            areaChart
            data={chartData}
            hideDataPoints={false}
            dataPointsColor={mainColor}
            dataPointsRadius={pointRadius}
            color={mainColor}
            thickness={2.5}
            areaGradientId="repairTrendAreaGradient"
            areaGradientComponent={() => (
              <LinearGradient id="repairTrendAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={mainColor} stopOpacity="0.25" />
                <Stop offset="1" stopColor={mainColor} stopOpacity="0.01" />
              </LinearGradient>
            )}
            initialSpacing={EDGE_SPACING}
            endSpacing={EDGE_SPACING}
            spacing={spacing}
            maxValue={maxVal}
            noOfSections={NO_OF_SECTIONS}
            stepValue={stepVal}
            roundToDigits={0}
            formatYLabel={(val) => Math.round(Number(val)).toString()}
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
          />
        ) : (
          <View className="h-[180px] justify-center items-center">
            <Ionicons name="file-tray-outline" size={28} color="#CBD5E1" />
            <Text className="mt-2 font-body text-xs text-slate-400">
              ไม่มีข้อมูลงานซ่อมในช่วงเวลาที่เลือก
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
