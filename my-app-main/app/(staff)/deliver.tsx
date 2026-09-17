// 1. React & React Native
import { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';

// 2. Third-party / Expo
import { useRouter, useFocusEffect } from 'expo-router';

// 3. API helpers
import { getRepairs } from '@/lib/api';

// 4. Components
import Header from '@/components/Shared_Dashboard/Header';
import SearchFilterBar from '@/components/ui/SearchFilterBar';
import RepairDetailsModal from '@/components/Shared_Repairs/RepairDetailsModal';
import RepairStatusSection from '@/components/Shared_Repairs/RepairStatusSection';

interface RepairItem {
  id: string;
  job_no: string;
  customer_name: string;
  phone: string;
  device?: string;
  status?: string;
  price?: number;
}

export default function StaffDeliverScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RepairItem | null>(null);
  const [isDetailsVisible, setDetailsVisible] = useState(false);
  const [waitingPickupItems, setWaitingPickupItems] = useState<RepairItem[]>([]);
  const [pendingPaymentItems, setPendingPaymentItems] = useState<RepairItem[]>([]);
  const [repairedContactItems, setRepairedContactItems] = useState<RepairItem[]>([]);

  const fetchDeliverItems = useCallback(async () => {
    try {
      const res = await getRepairs();

      if (!res.success) {
        console.error('Fetch repairs error:', res.message);
        return;
      }

      const STATUS_MAP: Record<number, string> = {
        5: 'อนุมัติแล้ว/รอซ่อม',
        7: 'รอชำระ',
        8: 'เสร็จสิ้น',
      };

      // กรองเฉพาะ status_id 5, 7, 8
      const items: RepairItem[] = (res.data || [])
        .filter((row: any) => [5, 7, 8].includes(row.status_id))
        .map((row: any) => {
          const jobNo = `REP-${String(row.job_id).padStart(6, '0')}`;
          const custName = `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'ไม่ระบุชื่อ';

          return {
            id: String(row.job_id),
            job_no: jobNo,
            customer_name: custName,
            phone: row.phone || '-',
            device: `${row.brand || ''} ${row.model || ''}`.trim() || row.device_type || 'อุปกรณ์',
            status: STATUS_MAP[row.status_id] || 'รอลูกค้ารับเครื่อง',
            price: Number(row.total_amount) || 300,
          };
        });

      setWaitingPickupItems(items.filter((i) => i.status === 'รอลูกค้ารับเครื่อง' || i.status === 'เสร็จสิ้น'));
      setPendingPaymentItems(items.filter((i) => i.status === 'รอชำระ'));
      setRepairedContactItems(items.filter((i) => i.status === 'อนุมัติแล้ว/รอซ่อม'));
    } catch (err) {
      console.error('Error fetching deliver items:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDeliverItems();
      const interval = setInterval(() => {
        fetchDeliverItems();
      }, 5000);
      return () => clearInterval(interval);
    }, [fetchDeliverItems])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDeliverItems();
  };

  const handlePressDetails = (item: RepairItem) => {
    setSelectedItem(item);
    setDetailsVisible(true);
  };

  const handleOpenFullDocument = (item: RepairItem) => {
    router.push({
      pathname: '/detail',
      params: {
        job_no: item.job_no,
        customer_name: item.customer_name,
        phone: item.phone,
        role: 'staff',
        edit: 'true',
      },
    });
  };

  const handlePressHandover = (item: RepairItem) => {
    router.push({
      pathname: '/deliver-handover',
      params: {
        job_id: item.id,
        job_no: item.job_no,
        customer_name: item.customer_name,
        device: item.device || 'อุปกรณ์',
        price: String(item.price || 300),
        role: 'staff',
      },
    });
  };

  const filterFn = (item: RepairItem) => {
    if (!searchText.trim()) return true;
    const s = searchText.toLowerCase();
    return (
      item.job_no.toLowerCase().includes(s) ||
      item.customer_name.toLowerCase().includes(s) ||
      item.phone.includes(s) ||
      (item.device || '').toLowerCase().includes(s)
    );
  };

  const filteredWaitingPickup = waitingPickupItems.filter(filterFn);
  const filteredPendingPayment = pendingPaymentItems.filter(filterFn);
  const filteredRepairedContact = repairedContactItems.filter(filterFn);

  return (
    <View className="flex-1 bg-slate-50">
      <Header title="IT VERTEX" subtitle="ส่งมอบงานซ่อม (พนักงาน)" />

      <View className="flex-1 p-4 pt-2">
        <SearchFilterBar
          value={searchText}
          onChangeText={setSearchText}
          showFilter={false}
        />

        {isLoading ? (
          <View className="flex-1 justify-center items-center py-10">
            <ActivityIndicator size="large" color="#D32F2F" />
            <Text className="mt-3 text-sm text-slate-500 font-body">กำลังโหลดรายการส่งมอบจากฐานข้อมูล...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 80 }}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#D32F2F']} />
            }
          >
            <RepairStatusSection
              title="รอลูกค้ารับเครื่อง"
              count={filteredWaitingPickup.length}
              indicatorColor="#22C55E"
              items={filteredWaitingPickup}
              defaultExpanded={true}
              onPressDetails={handlePressDetails}
              onPressHandover={handlePressHandover}
            />

            <RepairStatusSection
              title="รอชำระ"
              count={filteredPendingPayment.length}
              indicatorColor="#EAB308"
              items={filteredPendingPayment}
              defaultExpanded={filteredWaitingPickup.length === 0}
              onPressDetails={handlePressDetails}
              onPressHandover={handlePressHandover}
              onPressPaymentCheck={(item) =>
                router.push({
                  pathname: '/verify-payment',
                  params: {
                    jobId: item.id,
                    job_no: item.job_no,
                    customer_name: item.customer_name,
                    amount: String(item.price || 300),
                    role: 'staff',
                  },
                })
              }
            />

            <RepairStatusSection
              title="อนุมัติแล้ว/รอซ่อม"
              count={filteredRepairedContact.length}
              indicatorColor="#3B82F6"
              items={filteredRepairedContact}
              defaultExpanded={false}
              onPressDetails={handlePressDetails}
              onPressHandover={handlePressHandover}
            />
          </ScrollView>
        )}
      </View>

      <RepairDetailsModal
        visible={isDetailsVisible}
        item={selectedItem}
        onClose={() => {
          setDetailsVisible(false);
          setSelectedItem(null);
        }}
        onOpenFullDocument={handleOpenFullDocument}
      />
    </View>
  );
}
