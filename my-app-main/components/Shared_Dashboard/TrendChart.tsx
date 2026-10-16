// 1. React
import React from 'react';

// 2. Separated Trend Components
import RepairTrendChart, { type RepairTrendDataPoint, type RepairTrendChartProps } from './RepairTrendChart';
import RevenueTrendChart, { type RevenueTrendDataPoint, type RevenueTrendChartProps } from './RevenueTrendChart';

export interface TrendChartProps {
  timeFilter: 'day' | 'month' | 'year';
  deviceType?: string;
  data?: { value: number; label: string }[];
  isLoading?: boolean;
  /** 'count' = จำนวนงาน (แดง, หน่วยเครื่อง) | 'revenue' = รายได้ (เขียว, หน่วยบาท) */
  mode?: 'count' | 'revenue';
}

/**
 * TrendChart (Legacy / Unified Adapter)
 * สลับแสดงผลระหว่าง RepairTrendChart (เรื่องเครื่องซ่อม) และ RevenueTrendChart (เรื่องเงิน/รายได้)
 * เพื่อความสะดวกในการดูแลและปรับปรุง แนะนำให้เรียกใช้ RepairTrendChart หรือ RevenueTrendChart โดยตรง
 */
export default function TrendChart({
  timeFilter,
  deviceType,
  data = [],
  isLoading = false,
  mode = 'count',
}: TrendChartProps) {
  if (mode === 'revenue') {
    return (
      <RevenueTrendChart
        timeFilter={timeFilter}
        deviceType={deviceType}
        data={data}
        isLoading={isLoading}
      />
    );
  }

  return (
    <RepairTrendChart
      timeFilter={timeFilter}
      deviceType={deviceType}
      data={data}
      isLoading={isLoading}
    />
  );
}

// Re-export specific components & types for flexible importing
export { RepairTrendChart, RevenueTrendChart };
export type { RepairTrendChartProps, RevenueTrendChartProps, RepairTrendDataPoint, RevenueTrendDataPoint };
