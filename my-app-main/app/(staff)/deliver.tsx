// 1. React & React Native
import { useState, useCallback } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// 3. API helpers
import { getRepairs } from '@/lib/api';
import { REPAIR_STATUS, CANCEL_INSPECTION_FEE } from '@/constants/status';

// 4. Components
import Header from '@/components/Shared_Dashboard/Header';
import SearchFilterBar from '@/components/ui/SearchFilterBar';
import RepairDetailsModal from '@/components/Shared_Repairs/RepairDetailsModal';
import RepairStatusSection from '@/components/Shared_Repairs/RepairStatusSection';
import type { RepairItem } from '@/components/Shared_Repairs/types';
import type { RepairJob } from '@/types/repair';

type DeliverFilter = 'all' | 'payment' | 'pickup' | 'completed' | 'repairing';

interface DeliverySegmentCardProps {
  label: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
  softColor: string;
  isActive: boolean;
  onPress: () => void;
}

function DeliverySegmentCard({
  label,
  count,
  icon,
  accentColor,
  softColor,
  isActive,
  onPress,
}: DeliverySegmentCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      className="min-h-[96px] flex-1 rounded-3xl border px-3 py-3"
      style={{
        backgroundColor: isActive ? softColor : '#FFFFFF',
        borderColor: isActive ? accentColor : '#E2E8F0',
      }}
    >
      <View className="flex-row items-center justify-between">
        <View
          className="h-9 w-9 items-center justify-center rounded-2xl"
          style={{ backgroundColor: isActive ? '#FFFFFF' : softColor }}
        >
          <Ionicons name={icon} size={19} color={accentColor} />
        </View>
        <Text className="font-heading text-2xl font-bold" style={{ color: accentColor }}>
          {count}
        </Text>
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <Text className="flex-1 pr-1 font-heading text-xs text-slate-700" numberOfLines={1}>
          {label}
        </Text>
        {isActive && <Ionicons name="checkmark-circle" size={16} color={accentColor} />}
      </View>
    </TouchableOpacity>
  );
}

export default function StaffDeliverScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [activeSegment, setActiveSegment] = useState<DeliverFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RepairItem | null>(null);
  const [isDetailsVisible, setDetailsVisible] = useState(false);
  const [waitingPickupItems, setWaitingPickupItems] = useState<RepairItem[]>([]);
  const [pendingPaymentItems, setPendingPaymentItems] = useState<RepairItem[]>([]);
  const [completedItems, setCompletedItems] = useState<RepairItem[]>([]);
  const [repairedContactItems, setRepairedContactItems] = useState<RepairItem[]>([]);

  const fetchDeliverItems = useCallback(async () => {
    try {
      const res = await getRepairs();

      if (!res.success) {
        console.error('Fetch repairs error:', res.message);
        return;
      }

      // กรองเฉพาะ status_id 5, 6, 7, 8, 9
      const items: RepairItem[] = (res.data || [])
        .filter((row: RepairJob) => (row.status_id ? [5, 6, 7, 8, 9].includes(row.status_id) : false))
        .map((row: RepairJob) => {
          const jobNo = `REP-${String(row.job_id).padStart(6, '0')}`;
          const custName = `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'ไม่ระบุชื่อ';

          let computedStatus = 'รอชำระเงิน';
          if (row.status_id === 8) {
            computedStatus = 'เสร็จสิ้น';
          } else if (row.status_id === 6) {
            computedStatus = 'รอลูกค้ามารับเครื่อง';
          } else if (row.status_id === 7) {
            computedStatus = 'รอชำระเงิน';
          } else if (row.status_id === 9) {
            computedStatus = 'ยกเลิกซ่อม (รอชำระค่าตรวจ)';
          } else if (row.status_id === 5) {
            computedStatus = 'อนุมัติแล้ว/รอซ่อม';
          }

          let formattedDate = '-';
          if (row.created_at) {
            try {
              const d = new Date(row.created_at);
              if (!isNaN(d.getTime())) {
                formattedDate = d.toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
              }
            } catch {}
          }

          const rawAmount = Number(row.total_amount);
          const finalPrice = !isNaN(rawAmount) && rawAmount > 0 ? rawAmount : (row.status_id === REPAIR_STATUS.CANCELLED ? CANCEL_INSPECTION_FEE : 0);

          return {
            id: String(row.job_id),
            job_no: jobNo,
            customer_name: custName,
            phone: row.phone || '-',
            device: `${row.brand || ''} ${row.model || ''}`.trim() || row.device_type || 'อุปกรณ์',
            device_type: row.device_type || 'อุปกรณ์',
            brand: row.brand || '',
            model: row.model || '',
            symptom: row.symptoms || row.symptom_details || row.symptom || 'ไม่ระบุอาการเสีย',
            symptoms: row.symptoms || row.symptom_details || row.symptom || 'ไม่ระบุอาการเสีย',
            symptom_details: row.symptom_details || row.symptoms || row.symptom || 'ไม่ระบุอาการเสีย',
            actual_symptom: row.actual_symptom || '',
            status: computedStatus,
            price: finalPrice,
            total_amount: finalPrice,
            date: formattedDate,
            created_at: row.created_at,
            technician: row.repairer_name || row.inspector_name || row.technician_name || 'ช่างประจำศูนย์',
            payment_verified: Boolean(row.payment_verified),
            status_id: row.status_id,
          };
        });

      setPendingPaymentItems(items.filter((i) => i.status_id === 7 || i.status_id === 9));
      setWaitingPickupItems(items.filter((i) => i.status_id === 6));
      setCompletedItems(items.filter((i) => i.status_id === 8));
      setRepairedContactItems(items.filter((i) => i.status_id === 5));
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
        job_id: item.id,
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

  const filteredPendingPayment = pendingPaymentItems.filter(filterFn);
  const filteredWaitingPickup = waitingPickupItems.filter(filterFn);
  const filteredCompleted = completedItems.filter(filterFn);
  const filteredRepairedContact = repairedContactItems.filter(filterFn);

  return (
    <View className="flex-1 bg-slate-50">
      <Header title="IT VERTEX" subtitle="ส่งมอบงานซ่อม & ชำระเงิน (พนักงาน)" />

      <View className="flex-1 p-4 pt-2">
        {/* Work status shortcuts */}
        <View className="mb-3 flex-row items-center gap-2.5">
          <DeliverySegmentCard
            label="รอชำระเงิน"
            count={filteredPendingPayment.length}
            icon="cash-outline"
            accentColor="#B45309"
            softColor="#FEF3C7"
            isActive={activeSegment === 'payment'}
            onPress={() => setActiveSegment('payment')}
          />
          <DeliverySegmentCard
            label="รอมารับเครื่อง"
            count={filteredWaitingPickup.length}
            icon="cube-outline"
            accentColor="#0284C7"
            softColor="#E0F2FE"
            isActive={activeSegment === 'pickup'}
            onPress={() => setActiveSegment('pickup')}
          />
          <DeliverySegmentCard
            label="ส่งมอบแล้ว"
            count={filteredCompleted.length}
            icon="checkmark-done-circle-outline"
            accentColor="#047857"
            softColor="#D1FAE5"
            isActive={activeSegment === 'completed'}
            onPress={() => setActiveSegment('completed')}
          />
        </View>

        <SearchFilterBar
          value={searchText}
          onChangeText={setSearchText}
          showFilter={false}
          placeholder="ค้นหาตามเลขงาน, ลูกค้า, เบอร์โทร หรืออุปกรณ์..."
        />

        {/* Filter Segment Pills */}
        <View className="flex-row items-center gap-1.5 mb-3 flex-wrap">
          {[
            { key: 'all', label: 'ทั้งหมด' },
            { key: 'payment', label: 'รอชำระ' },
            { key: 'pickup', label: 'รอมารับเครื่อง' },
            { key: 'completed', label: 'เสร็จสิ้น' },
            { key: 'repairing', label: 'อนุมัติ/รอซ่อม' },
          ].map((tab) => {
            const isSelected = activeSegment === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.8}
                onPress={() => setActiveSegment(tab.key as DeliverFilter)}
                className={`min-h-[44px] justify-center px-4 py-2 rounded-full border ${
                  isSelected ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200 active:bg-slate-50'
                }`}
              >
                <Text
                  className={`text-xs font-heading ${
                    isSelected ? 'text-white font-bold' : 'text-slate-600'
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading ? (
          <View className="flex-1 justify-center items-center py-10">
            <ActivityIndicator size="large" color="#DC2626" />
            <Text className="mt-3 text-sm text-slate-500 font-body">กำลังโหลดรายการส่งมอบจากฐานข้อมูล...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 80 }}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#DC2626']} />
            }
          >
            {(activeSegment === 'all' || activeSegment === 'payment') && (
              <RepairStatusSection
                statusId={7}
                title="รอชำระเงิน (ตรวจสอบการชำระเงิน / สลิป)"
                count={filteredPendingPayment.length}
                indicatorColor="#EAB308"
                items={filteredPendingPayment}
                defaultExpanded={true}
                onPressDetails={handlePressDetails}
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
            )}

            {(activeSegment === 'all' || activeSegment === 'pickup') && (
              <RepairStatusSection
                statusId={6}
                title="รอลูกค้ามารับเครื่อง (พนักงานส่งมอบ & ลูกค้าเซ็น)"
                count={filteredWaitingPickup.length}
                indicatorColor="#0284C7"
                items={filteredWaitingPickup}
                defaultExpanded={true}
                onPressDetails={handlePressDetails}
                onPressHandover={handlePressHandover}
              />
            )}

            {(activeSegment === 'all' || activeSegment === 'completed') && (
              <RepairStatusSection
                statusId={8}
                title="ส่งมอบเสร็จสิ้น (คำนวณรายได้แล้ว)"
                count={filteredCompleted.length}
                indicatorColor="#22C55E"
                items={filteredCompleted}
                defaultExpanded={activeSegment === 'completed'}
                onPressDetails={handlePressDetails}
              />
            )}

            {(activeSegment === 'all' || activeSegment === 'repairing') && (
              <RepairStatusSection
                statusId={5}
                title="อนุมัติแล้ว/รอซ่อม (อยู่ระหว่างซ่อม)"
                count={filteredRepairedContact.length}
                indicatorColor="#6366F1"
                items={filteredRepairedContact}
                defaultExpanded={false}
                onPressDetails={handlePressDetails}
              />
            )}
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
