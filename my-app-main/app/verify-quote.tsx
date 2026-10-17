// 1. React & React Native
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

// 2. Third-party / Expo
import { useLocalSearchParams, useRouter } from 'expo-router';

// 3. API helpers
import { getRepair, updateRepairStatus, logRepairJobDetail } from '@/lib/api';

// 4. Components
import ConfirmSendModal from '@/components/ui/ConfirmSendModal';
import TechnicianQuoteCard from '@/components/Staff_verify_quote/TechnicianQuoteCard';
import PageHeader from '@/components/ui/PageHeader';
import { useAlert } from '@/hooks/use-alert';
import type { RepairJob } from '@/types/repair';
import type { QuoteItem } from '@/types/quotation';

import { Colors } from '@/constants/theme';

export default function VerifyQuoteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const jobIdParam = (params.job_id as string) || (params.id as string) || '';
  const jobNoParam = (params.job_no as string) || (params.job_number as string) || (jobIdParam ? `REP-${String(jobIdParam).padStart(6, '0')}` : '');
  const initialDeviceModel = (params.device as string) || 'อุปกรณ์ซ่อม';

  const [loading, setLoading] = useState(true);
  const [jobNumericId, setJobNumericId] = useState<number | null>(null);
  const [deviceModel, setDeviceModel] = useState<string>(initialDeviceModel);
  const [isSent, setIsSent] = useState(false);

  // Modals visibility
  const [isConfirmModalVisible, setConfirmModalVisible] = useState(false);

  // Quote Data
  const [job, setJob] = useState<RepairJob | null>(null);
  const [parts, setParts] = useState<QuoteItem[]>([]);
  const [services, setServices] = useState<QuoteItem[]>([]);
  const [actualSymptom, setActualSymptom] = useState<string>('');

  // ── การแจ้งเตือน (มาตรฐานกลาง — ดู STANDARD.md §3.3) ──
  const { showAlert, alertElement } = useAlert();

  // Fetch quote data from DB
  useEffect(() => {
    const fetchQuoteData = async () => {
      const numId = parseInt(jobIdParam, 10) || (jobNoParam ? parseInt(jobNoParam.split('-').pop() || '', 10) || parseInt(jobNoParam.replace(/[^0-9]/g, ''), 10) : NaN);
      if (isNaN(numId) || numId <= 0) {
        setLoading(false);
        return;
      }
      setJobNumericId(numId);

      try {
        const res = await getRepair(numId);
        if (res.success && res.data) {
          const jobData = res.data;
          setJob(jobData);

          const fullDevice = [jobData.brand, jobData.model].filter(Boolean).join(' ') || jobData.device_type || initialDeviceModel;
          setDeviceModel(fullDevice);
          if (jobData.actual_symptom) setActualSymptom(jobData.actual_symptom);

          if (jobData.quotation?.parts || jobData.quotation?.services) {
            if (jobData.quotation.parts) {
              setParts(jobData.quotation.parts.map((p: any) => ({
                id: String(p.details_id || p.item_id || Math.random()),
                name: p.item_name || p.name || 'อะไหล่',
                price: Number(p.total_price || p.unit_price * (p.quantity || 1) || 0),
              })));
            }
            if (jobData.quotation.services) {
              setServices(jobData.quotation.services.map((s: any) => ({
                id: String(s.details_id || s.item_id || Math.random()),
                name: s.item_name || s.name || 'ค่าบริการ',
                price: Number(s.total_price || s.unit_price * (s.quantity || 1) || 0),
              })));
            }
          } else if (jobData.quotation?.items && jobData.quotation.items.length > 0) {
            const fetchedParts: QuoteItem[] = [];
            const fetchedServices: QuoteItem[] = [];

            jobData.quotation.items.forEach((item: any) => {
              const itemName = item.item_name || item.name || 'รายการซ่อม';
              const price = Number(item.total_price || item.unit_price * (item.quantity || 1) || item.price || 0);

              if (item.item_type_id === 1 || itemName.includes('อะไหล่') || itemName.includes('พัดลม') || itemName.includes('จอ') || itemName.includes('แบต')) {
                fetchedParts.push({ id: String(item.details_id || item.quote_detail_id || item.id || Math.random()), name: itemName, price });
              } else {
                fetchedServices.push({ id: String(item.details_id || item.quote_detail_id || item.id || Math.random()), name: itemName, price });
              }
            });

            if (fetchedParts.length > 0) setParts(fetchedParts);
            if (fetchedServices.length > 0) setServices(fetchedServices);
          } else {
            // ไม่มีรายการใบเสนอราคาจริง ไม่แสดงข้อมูลจำลอง
            setParts([]);
            setServices([]);
          }
        }
      } catch (err) {
        console.error('fetchQuoteData error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuoteData();
  }, [jobNoParam]);

  // เปิดป๊อปอัปยืนยันก่อนกดส่ง (ตรวจสอบว่ามีรายการใบเสนอราคาจริง)
  const handleOpenConfirmModal = () => {
    if (parts.length === 0 && services.length === 0 && (!job || !job.total_amount || job.total_amount <= 0)) {
      showAlert('ไม่สามารถส่งได้', 'ไม่พบรายการหรือยอดเงินในใบเสนอราคาจริง กรุณาสร้างใบเสนอราคาก่อนส่งให้ลูกค้า', 'warning', () => router.back());
      return;
    }
    setConfirmModalVisible(true);
  };

  const [sending, setSending] = useState(false);

  // ยืนยันส่งให้ลูกค้า -> อัปเดตสถานะใน DB เป็น 4 (รอการอนุมัติ)
  const handleConfirmSend = async () => {
    if (sending) return;
    if (parts.length === 0 && services.length === 0 && (!job || !job.total_amount || job.total_amount <= 0)) {
      setConfirmModalVisible(false);
      showAlert('ไม่สามารถส่งได้', 'ไม่พบรายการหรือยอดเงินในใบเสนอราคาจริง กรุณาสร้างใบเสนอราคาก่อนส่งให้ลูกค้า', 'warning', () => router.back());
      return;
    }
    setSending(true);

    try {
      if (jobNumericId) {
        // 4 = รอการอนุมัติ (ส่งใบเสนอราคาให้ลูกค้าพิจารณาแล้ว)
        const res = await updateRepairStatus(jobNumericId, { status_id: 4 });
        if (!res.success) throw new Error(res.message);

        // Action 3 = ออกใบเสนอราคา
        await logRepairJobDetail(jobNumericId, 3, undefined, 'ส่งใบเสนอราคาให้ลูกค้าพิจารณา');
      }

      setConfirmModalVisible(false);
      setIsSent(true);
      showAlert('ส่งใบเสนอราคาสำเร็จ', 'ส่งใบเสนอราคาให้ลูกค้าพิจารณาเรียบร้อยแล้ว (สถานะเปลี่ยนเป็นรอการอนุมัติ)', 'success', () => router.back());
    } catch (err) {
      console.error('Error logging confirm send:', err);
      showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถส่งใบเสนอราคาได้ กรุณาลองใหม่อีกครั้ง', 'danger');
    } finally {
      setSending(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* Top Header Bar */}
      <PageHeader title="ตรวจสอบและส่งต่อ" bgColor={Colors.primary} />

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <TechnicianQuoteCard
            deviceModel={deviceModel}
            parts={parts}
            services={services}
            actualSymptom={actualSymptom}
            isSent={isSent}
            onForwardToCustomer={handleOpenConfirmModal}
          />
        </ScrollView>
      )}

      {/* Confirmation Modal Before Send */}
      <ConfirmSendModal
        visible={isConfirmModalVisible}
        onClose={() => !sending && setConfirmModalVisible(false)}
        onConfirm={handleConfirmSend}
        loading={sending}
      />

      {/* การแจ้งเตือน (มาตรฐานกลาง) */}
      {alertElement}
    </View>
  );
}
