// 1. React & React Native
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

// 2. Third-party / Expo
import { useFocusEffect, useRouter } from 'expo-router';

// 3. API helpers
import { deleteQuotation, getQuotations } from '@/lib/api';

// 4. Components & Theme
import Header from '@/components/Shared_Dashboard/Header';
import SearchFilterBar from '@/components/ui/SearchFilterBar';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import { useAlert } from '@/hooks/use-alert';
import QuotationDetailModal from '@/components/Technician_detail/QuotationDetailModal';

// Sub-components
import QuotationFilterTabs from '@/components/Technician_quotation/QuotationFilterTabs';
import QuotationCard from '@/components/Technician_quotation/QuotationCard';
import QuotationTable from '@/components/Technician_quotation/QuotationTable';
import QuotationEmptyState from '@/components/Technician_quotation/QuotationEmptyState';
import { canEditOrDeleteQuote } from '@/components/Technician_quotation/QuotationStatusBadge';

// Types
import type { QuotationFilter, QuotationItem } from '@/types/quotation';

import { QUOTE_STATUS, REPAIR_STATUS } from '@/constants/status';
import { Colors } from '@/constants/theme';

export default function TechnicianQuotationScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quotations, setQuotations] = useState<QuotationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<QuotationFilter>('all');

  // Quotation Detail Modal state
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);

  // Delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingQuoteNo, setDeletingQuoteNo] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  // ── การแจ้งเตือน (มาตรฐานกลาง — ดู STANDARD.md §3.3) ──
  const { showAlert, alertElement } = useAlert();

  const loadQuotations = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getQuotations();
      if (res?.success && Array.isArray(res.data)) {
        setQuotations(res.data);
      } else {
        setQuotations([]);
      }
    } catch (err: any) {
      console.error('Error loading quotations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadQuotations();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadQuotations(true);
  };

  // Filter count calculations
  const countRejected = quotations.filter(
    (q) => (q.quote_status_id === QUOTE_STATUS.CHANGE_REQUEST || q.quote_status_id === QUOTE_STATUS.REVISING || (q.customer_remark && q.repair_status_id === REPAIR_STATUS.MAKING_QUOTE))
  ).length;

  const countPending = quotations.filter((q) => q.quote_status_id === QUOTE_STATUS.PENDING).length;
  const countApproved = quotations.filter((q) => q.quote_status_id === QUOTE_STATUS.APPROVED).length;
  const countCancelled = quotations.filter((q) => q.quote_status_id === QUOTE_STATUS.CANCELLED).length;

  // Filter & Search logic
  const filteredQuotations = quotations.filter((item) => {
    if (activeFilter === 'rejected') {
      const isRejected = item.quote_status_id === QUOTE_STATUS.CHANGE_REQUEST || item.quote_status_id === QUOTE_STATUS.REVISING || (item.customer_remark && item.repair_status_id === REPAIR_STATUS.MAKING_QUOTE);
      if (!isRejected) return false;
    } else if (activeFilter === 'pending') {
      if (item.quote_status_id !== QUOTE_STATUS.PENDING) return false;
    } else if (activeFilter === 'approved') {
      if (item.quote_status_id !== QUOTE_STATUS.APPROVED) return false;
    } else if (activeFilter === 'cancelled') {
      if (item.quote_status_id !== QUOTE_STATUS.CANCELLED) return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (item.quote_no || '').toLowerCase().includes(q) ||
      (item.job_no || '').toLowerCase().includes(q) ||
      (item.customer_name || '').toLowerCase().includes(q) ||
      (item.phone || '').toLowerCase().includes(q) ||
      (item.model || '').toLowerCase().includes(q) ||
      (item.brand || '').toLowerCase().includes(q) ||
      (item.actual_symptom || '').toLowerCase().includes(q)
    );
  });

  const handlePromptDelete = (item: QuotationItem) => {
    if (!canEditOrDeleteQuote(item)) {
      showAlert('ไม่อนุญาตให้ลบ', 'สามารถลบได้เฉพาะใบเสนอราคาที่อยู่ในสถานะ "รอการอนุมัติ" หรือ "ขอแก้ไข" เท่านั้น', 'warning');
      return;
    }
    setDeletingId(item.quotation_id);
    setDeletingQuoteNo(item.quote_no || `QUO-${item.quotation_id}`);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await deleteQuotation(deletingId);
      if (res?.success) {
        setDeleteModalVisible(false);
        showAlert('สำเร็จ', 'ลบใบเสนอราคาเรียบร้อยแล้ว สถานะงานซ่อมถูกรีเซ็ตกลับเป็นขั้นตอนตรวจเช็ค', 'success');
        loadQuotations(true);
      } else {
        throw new Error(res?.message || 'ไม่สามารถลบใบเสนอราคาได้');
      }
    } catch (err: any) {
      showAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถลบใบเสนอราคาได้ กรุณาลองใหม่อีกครั้ง', 'danger');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const handleOpenDetail = (item: QuotationItem) => {
    setSelectedQuoteId(item.quotation_id);
    setDetailModalVisible(true);
  };

  const handleEdit = (item: QuotationItem) => {
    if (!canEditOrDeleteQuote(item)) {
      showAlert('ไม่อนุญาตให้แก้ไข', 'สามารถแก้ไขได้เฉพาะใบเสนอราคาที่อยู่ในสถานะ "รอการอนุมัติ" หรือ "ขอแก้ไข" เท่านั้น', 'warning');
      return;
    }
    router.push({
      pathname: '/make-quote',
      params: {
        job_no: item.job_no,
        job_id: String(item.job_id),
        quote_id: String(item.quotation_id),
        customer_name: item.customer_name,
      },
    });
  };

  const handleViewJob = (item: QuotationItem) => {
    router.push({
      pathname: '/detail',
      params: {
        job_id: String(item.job_id),
        job_no: item.job_no,
        customer_name: item.customer_name,
        phone: item.phone,
      },
    });
  };

  const resultSummary = useMemo(() => {
    if (searchQuery.trim() || activeFilter !== 'all') return `พบ ${filteredQuotations.length} รายการ`;
    return `ทั้งหมด ${quotations.length} ใบเสนอราคา`;
  }, [filteredQuotations.length, quotations.length, searchQuery, activeFilter]);

  return (
    <View className="flex-1 bg-slate-50">
      {/* ── App Standard Header ── */}
      <Header title="รายการใบเสนอราคา" subtitle="จัดการและติดตามสถานะใบเสนอราคา" />

      {/* ── Body Container ── */}
      <View className="flex-1 px-4 pt-3">
        {/* Search Bar */}
        <SearchFilterBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="ค้นหาเลขที่เอกสาร, รหัสงาน, ลูกค้า, รุ่น..."
        />

        {/* Horizontal Filter Tabs */}
        <QuotationFilterTabs
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          totalCount={quotations.length}
          countRejected={countRejected}
          countPending={countPending}
          countApproved={countApproved}
          countCancelled={countCancelled}
        />

        {/* ── Quotation Content: cards on phone, table on tablet/desktop ── */}
        {loading ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text className="mt-3 text-sm text-slate-500 font-body">กำลังโหลดรายการใบเสนอราคา...</Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 110 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
            }
          >
            {/* Result count */}
            <View className="flex-row items-center justify-between px-1 pb-2">
              <Text className="text-xs font-semibold text-slate-500 font-body">{resultSummary}</Text>
              {!isWide && filteredQuotations.length > 0 ? (
                <Text className="text-[11px] text-slate-400 font-body">แตะการ์ดเพื่อดูรายละเอียด</Text>
              ) : null}
            </View>

            {filteredQuotations.length === 0 ? (
              <QuotationEmptyState searchQuery={searchQuery} activeFilter={activeFilter} />
            ) : isWide ? (
              <QuotationTable
                filteredQuotations={filteredQuotations}
                onOpenDetail={handleOpenDetail}
                onViewJob={handleViewJob}
                onEdit={handleEdit}
                onPromptDelete={handlePromptDelete}
              />
            ) : (
              <View className="pb-4">
                {filteredQuotations.map((item) => (
                  <QuotationCard
                    key={item.quotation_id}
                    item={item}
                    onOpenDetail={handleOpenDetail}
                    onViewJob={handleViewJob}
                    onEdit={handleEdit}
                    onPromptDelete={handlePromptDelete}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* Quotation Detail Modal */}
      <QuotationDetailModal
        visible={detailModalVisible}
        quotationId={selectedQuoteId}
        onClose={() => setDetailModalVisible(false)}
        onEdit={(qId, jNo, jId, cName) => {
          const targetQuote = quotations.find((q) => q.quotation_id === qId);
          if (targetQuote && !canEditOrDeleteQuote(targetQuote)) {
            showAlert('ไม่อนุญาตให้แก้ไข', 'สามารถแก้ไขได้เฉพาะใบเสนอราคาที่อยู่ในสถานะ "รอการอนุมัติ" หรือ "ขอแก้ไข" เท่านั้น', 'warning');
            return;
          }
          router.push({
            pathname: '/make-quote',
            params: {
              job_no: jNo,
              job_id: String(jId),
              quote_id: String(qId),
              customer_name: cName,
            },
          });
        }}
        onViewJob={(jId, jNo, cName, cPhone) => {
          router.push({
            pathname: '/detail',
            params: {
              job_id: String(jId),
              job_no: jNo,
              customer_name: cName,
              phone: cPhone,
            },
          });
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        visible={deleteModalVisible}
        title="ยืนยันการลบใบเสนอราคา"
        itemName={deletingQuoteNo}
        message="การลบใบเสนอราคาจะรีเซ็ตสถานะงานซ่อมกลับไปเป็นขั้นตอนตรวจเช็ค และล้างรายการอะไหล่/บริการในใบเสนอราคานี้"
        confirmText="ยืนยันลบ"
        cancelText="ยกเลิก"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteModalVisible(false);
            setDeletingId(null);
          }
        }}
      />

      {/* การแจ้งเตือน (มาตรฐานกลาง) */}
      {alertElement}
    </View>
  );
}
