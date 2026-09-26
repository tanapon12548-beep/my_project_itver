// 1. React & React Native
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

// 2. Third-party / Expo
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

// 3. API & Auth helpers
import { getRepairs } from '@/lib/api';
import { getUser } from '@/lib/auth';
import type { RepairJob } from '@/types/repair';

// 4. Modular Customer Components
import CustomerHeader, { type CustomerFilterTab } from '@/components/Customer/CustomerHeader';
import CustomerJobCard from '@/components/Customer/CustomerJobCard';
import CustomerUrgentBanner from '@/components/Customer/CustomerUrgentBanner';
import CustomerFilterBar from '@/components/Customer/CustomerFilterBar';
import CustomerEmptyState from '@/components/Customer/CustomerEmptyState';

export default function CustomerDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customerName, setCustomerName] = useState<string>('ลูกค้า');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<CustomerFilterTab>('all');

  // Fetch current customer profile name
  useEffect(() => {
    async function loadProfile() {
      try {
        const u = await getUser();
        if (u) {
          const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
          if (fullName) setCustomerName(fullName);
          else if (u.email) setCustomerName(u.email.split('@')[0]);
        }
      } catch (err) {
        console.error('Error loading customer user:', err);
      }
    }
    loadProfile();
  }, []);

  const fetchMyJobs = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await getRepairs();
      setJobs(res.data || []);
    } catch (error) {
      console.error('Error fetching customer jobs:', error);
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
      const interval = setInterval(() => {
        fetchMyJobs(true);
      }, 2500);
      return () => clearInterval(interval);
    }, [fetchMyJobs])
  );

  // Status Counts
  const counts = useMemo(() => {
    let inProgress = 0;
    let pendingApproval = 0;
    let completed = 0;

    jobs.forEach((j) => {
      const st = (j.status || j.status_name || '').toLowerCase();
      const stId = Number(j.status_id);

      if (stId === 4 || st.includes('รอการอนุมัติ') || st.includes('รออนุมัติ') || st.includes('เสนอราคา')) {
        pendingApproval++;
      } else if (stId === 8 || st.includes('เสร็จสิ้น') || st.includes('ชำระแล้ว')) {
        completed++;
      } else if (stId !== 9 && !st.includes('ยกเลิก')) {
        inProgress++;
      }
    });

    return { inProgress, pendingApproval, completed, total: jobs.length };
  }, [jobs]);

  // Urgent pending approval job (if any)
  const urgentApprovalJob = useMemo(() => {
    return jobs.find((j) => {
      const st = (j.status || j.status_name || '');
      const stId = Number(j.status_id);
      return stId === 4 || st.includes('รอการอนุมัติ') || st.includes('รออนุมัติ');
    });
  }, [jobs]);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((item) => {
      const targetId = item.id || item.job_id;
      const jobNo = (item.job_number || item.job_no || `REP-${targetId}`).toLowerCase();
      const deviceTitle = `${item.brand || ''} ${item.model || ''} ${item.device_type || ''}`.toLowerCase();
      const symptom = (item.symptoms || item.symptom_details || item.symptom || '').toLowerCase();
      const query = searchQuery.trim().toLowerCase();

      // Search matching
      if (query && !jobNo.includes(query) && !deviceTitle.includes(query) && !symptom.includes(query)) {
        return false;
      }

      // Tab filtering
      const st = (item.status || item.status_name || '').toLowerCase();
      const stId = Number(item.status_id);

      if (activeTab === 'pending_approval') {
        return stId === 4 || st.includes('รอการอนุมัติ') || st.includes('รออนุมัติ') || st.includes('เสนอราคา');
      }
      if (activeTab === 'in_progress') {
        return (
          stId !== 8 &&
          stId !== 9 &&
          stId !== 4 &&
          !st.includes('เสร็จสิ้น') &&
          !st.includes('ยกเลิก') &&
          !st.includes('รออนุมัติ')
        );
      }
      if (activeTab === 'completed') {
        return stId === 8 || st.includes('เสร็จสิ้น') || st.includes('ชำระแล้ว');
      }

      return true;
    });
  }, [jobs, searchQuery, activeTab]);

  const handlePressDetails = useCallback(
    (targetId: string | number) => {
      router.push({ pathname: '/job-detail', params: { id: targetId } });
    },
    [router]
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      <StatusBar style="light" backgroundColor="#DC2626" />

      {/* Customer Top Header with Counters */}
      <CustomerHeader
        customerName={customerName}
        counts={counts}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      <View className="flex-1 px-4 pt-3">
        {/* Urgent Approval Banner (If quotation awaits approval) */}
        {urgentApprovalJob && (
          <CustomerUrgentBanner
            job={urgentApprovalJob}
            onPress={handlePressDetails}
          />
        )}

        {/* Search Bar & Tab Filter Pills */}
        <CustomerFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />

        {/* Job List */}
        {loading ? (
          <View className="flex-1 justify-center items-center py-12">
            <ActivityIndicator size="large" color="#DC2626" />
            <Text className="text-slate-400 text-xs font-body mt-2">กำลังโหลดรายการงานซ่อม...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredJobs}
            keyExtractor={(item, index) => String(item.id || item.job_id || index)}
            renderItem={({ item }) => (
              <CustomerJobCard
                item={item}
                onPressDetails={handlePressDetails}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 90 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#DC2626']} />
            }
            ListEmptyComponent={
              <CustomerEmptyState
                isFiltered={Boolean(searchQuery || activeTab !== 'all')}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
