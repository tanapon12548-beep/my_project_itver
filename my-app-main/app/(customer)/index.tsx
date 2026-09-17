// 1. React & React Native
import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

// 3. API helpers
import { getRepairs } from '@/lib/api';

export default function CustomerDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyJobs = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await getRepairs();
      setJobs(res.data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      if (!isSilent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMyJobs(true);
  }, [fetchMyJobs]);

  useFocusEffect(
    useCallback(() => {
      fetchMyJobs();
      // Real-time polling every 5 seconds
      const interval = setInterval(() => {
        fetchMyJobs(true);
      }, 5000);
      return () => clearInterval(interval);
    }, [fetchMyJobs])
  );

  const getStatusColor = (status: string) => {
    if (!status) return '#BAD80A';
    if (status.includes('เสร็จ') || status.includes('ชำระแล้ว')) return '#22C55E';
    if (status.includes('ยกเลิก')) return '#EF4444';
    if (status.includes('รอชำระ')) return '#EAB308';
    if (status.includes('กำลังซ่อม')) return '#0EA5E9';
    if (status.includes('อนุมัติแล้ว') || status.includes('รอซ่อม')) return '#3B82F6';
    if (status.includes('รออนุมัติ') || status.includes('รอการอนุมัติ')) return '#A855F7';
    if (status.includes('เสนอราคา')) return '#F59E0B';
    if (status.includes('ดำเนินการตรวจเช็ค')) return '#D97706';
    return '#BAD80A';
  };

  const renderJobItem = ({ item }: { item: any }) => {
    const targetId = item.id || item.job_id;
    const deviceTitle = `${item.brand || ''} ${item.model || ''}`.trim() || item.device_type || 'อุปกรณ์ซ่อม';
    const jobNo = item.job_number || item.job_no || (targetId ? `REP-${String(targetId).padStart(6, '0')}` : '-');
    const symptomText = item.symptoms || item.symptom_details || item.symptom || 'ไม่ระบุอาการ';
    const statusText = item.status || item.status_name || 'รอตรวจเช็ค';

    return (
      <TouchableOpacity
        className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-slate-100 flex-row items-center"
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: '/job-detail', params: { id: targetId } })}
      >
        <View className="w-12 h-12 bg-red-50 rounded-xl mr-4 items-center justify-center">
          <Ionicons name="hardware-chip-outline" size={24} color="#D32F2F" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-slate-800 font-heading" numberOfLines={1}>
            {deviceTitle}
          </Text>
          <Text className="text-xs text-slate-400 mb-1 font-body">{jobNo}</Text>
          <Text className="text-sm text-slate-600 mb-2 font-body" numberOfLines={1}>
            {symptomText}
          </Text>

          <View className="flex-row items-center justify-between">
            <View
              className="px-3 py-1 rounded-full flex-row items-center"
              style={{ backgroundColor: getStatusColor(statusText) }}
            >
              <View className="w-1.5 h-1.5 rounded-full bg-white mr-1.5" />
              <Text className="text-[11px] text-white font-bold">{statusText}</Text>
            </View>
            <Text className="text-xs text-slate-400 font-body">
              {item.created_at
                ? new Date(item.created_at).toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '-'}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#cbd5e1" className="ml-2" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar style="light" backgroundColor="#D32F2F" />

      {/* Red Header matching PDF */}
      <View className="bg-[#D32F2F] pt-4 pb-6 px-5 rounded-b-3xl mb-4 shadow-sm">
        <Text className="text-white text-xl font-bold font-heading">IT VERTEX</Text>
        <Text className="text-red-100 text-sm font-body mt-1">รายการซ่อมของฉัน</Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#D32F2F" />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item, index) => String(item.id || item.job_id || index)}
          renderItem={renderJobItem}
          contentContainerClassName="px-4 pb-20"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D32F2F']} />
          }
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center pt-20">
              <Ionicons name="document-text-outline" size={60} color="#cbd5e1" />
              <Text className="text-slate-400 mt-4 font-body">ยังไม่มีรายการซ่อม</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
