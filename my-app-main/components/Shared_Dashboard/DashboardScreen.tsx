// 1. React & React Native
import React, { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';

// 2. Third-party / Expo
import { useFocusEffect } from 'expo-router';

// 3. API helpers
import {
  getDashboardCategory,
  getDashboardMetrics,
  getDashboardTrend,
} from '@/lib/api';

// 4. Components
import CategoryChart from '@/components/Shared_Dashboard/CategoryChart';
import DashboardFilters from '@/components/Shared_Dashboard/DashboardFilters';
import Header from '@/components/Shared_Dashboard/Header';
import MetricCards from '@/components/Shared_Dashboard/MetricCards';
import TrendChart from '@/components/Shared_Dashboard/TrendChart';

interface DashboardScreenProps {
  /** 'staff' or 'manager' — passed to getDashboardMetrics */
  role: 'staff' | 'manager';
}

export default function DashboardScreen({ role }: DashboardScreenProps) {
  // Filters
  const [timeFilter, setTimeFilter] = useState<'day' | 'month' | 'year'>('day');
  const [deviceType, setDeviceType] = useState('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // Data
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalJobs: 0,
    completedJobs: 0,
    pendingJobs: 0,
  });
  const [trendData, setTrendData] = useState<{ value: number; label: string }[]>([]);
  const [categoryData, setCategoryData] = useState<{
    pc: number;
    laptop: number;
    printer: number;
    other?: number;
    total?: number;
  }>({ pc: 0, laptop: 0, printer: 0, other: 0, total: 0 });

  const fetchOverviewData = useCallback(async () => {
    try {
      const [metricsRes, categoryRes] = await Promise.all([
        getDashboardMetrics(role),
        getDashboardCategory(),
      ]);

      if (metricsRes?.success && metricsRes.data) {
        setMetrics(metricsRes.data);
      }

      if (categoryRes?.success && categoryRes.data) {
        setCategoryData(categoryRes.data);
      }
    } catch (err) {
      console.error('Dashboard overview fetch error:', err);
    }
  }, [role]);

  // โหลดข้อมูลกราฟแนวโน้ม (เฉพาะกราฟเส้น) ตามตัวกรองที่เลือก
  const fetchTrendData = useCallback(async () => {
    try {
      setIsLoading(true);
      const trendRes = await getDashboardTrend({
        period: timeFilter,
        device_type: deviceType,
        date_start: dateStart,
        date_end: dateEnd,
      });

      if (trendRes?.success && Array.isArray(trendRes.data)) {
        setTrendData(trendRes.data);
      } else {
        setTrendData([]);
      }
    } catch (err) {
      console.error('Trend fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [timeFilter, deviceType, dateStart, dateEnd]);

  useFocusEffect(
    useCallback(() => {
      fetchOverviewData();
      fetchTrendData();
    }, [fetchOverviewData, fetchTrendData])
  );

  return (
    <View className="flex-1 bg-bg">
      <Header />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
      >
        <MetricCards
          totalRevenue={metrics.totalRevenue}
          totalJobs={metrics.totalJobs}
          completedJobs={metrics.completedJobs}
          pendingJobs={metrics.pendingJobs}
        />

        <DashboardFilters
          timeFilter={timeFilter}
          onChangeTimeFilter={setTimeFilter}
          deviceType={deviceType}
          onChangeDeviceType={setDeviceType}
          dateStart={dateStart}
          dateEnd={dateEnd}
          onChangeDateStart={setDateStart}
          onChangeDateEnd={setDateEnd}
        />

        <TrendChart
          timeFilter={timeFilter}
          data={trendData}
          isLoading={isLoading}
        />

        <CategoryChart
          pcPercent={categoryData.pc}
          laptopPercent={categoryData.laptop}
          printerPercent={categoryData.printer}
          otherCount={categoryData.other}
          total={categoryData.total}
          isLoading={isLoading}
        />
      </ScrollView>
    </View>
  );
}
