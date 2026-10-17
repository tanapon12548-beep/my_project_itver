// 1. React & React Native
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

// 3. API helpers & Types
import { createPayment, getRepair, verifyPayment, rejectPayment, getImageUrl } from '@/lib/api';
import { REPAIR_STATUS, QUOTE_STATUS, PAYMENT_METHODS, CANCEL_INSPECTION_FEE } from '@/constants/status';

// 4. Components
import { useAlert, type AlertType } from '@/hooks/use-alert';
import InvoiceSummaryCard from '@/components/Staff_verify_payment/InvoiceSummaryCard';
import StaffReviewCard from '@/components/Staff_verify_payment/StaffReviewCard';
import CustomerLockedCard from '@/components/Staff_verify_payment/CustomerLockedCard';
import CustomerPaymentForm from '@/components/Staff_verify_payment/CustomerPaymentForm';
import SlipPreviewModal from '@/components/Staff_verify_payment/SlipPreviewModal';
import PaymentFooterButtons from '@/components/Staff_verify_payment/PaymentFooterButtons';

import { Colors } from '@/constants/theme';

export default function VerifyPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    jobId?: string;
    job_id?: string;
    job_no?: string;
    customer_name?: string;
    amount?: string;
    role?: string;
  }>();

  const isStaff = params.role === 'staff';

  const rawJobId =
    params.jobId ||
    params.job_id ||
    (params.job_no ? String(params.job_no).replace(/[^0-9]/g, '') : '');
  const numericJobId = parseInt(rawJobId, 10);
  const displayJobNo =
    params.job_no ||
    (!isNaN(numericJobId)
      ? `REP-${String(numericJobId).padStart(6, '0')}`
      : 'REP-000000');

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [slipImage, setSlipImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingJob, setLoadingJob] = useState(true);

  const [customerName, setCustomerName] = useState<string>(params.customer_name || '');
  const [totalAmount, setTotalAmount] = useState<number>(Number(params.amount || 0));
  const [isCancelled, setIsCancelled] = useState<boolean>(false);
  const [existingSlipUrl, setExistingSlipUrl] = useState<string | null>(null);
  const [existingSlipFilename, setExistingSlipFilename] = useState<string | null>(null);
  const [existingPaymentMethodId, setExistingPaymentMethodId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectInputText, setRejectInputText] = useState('');

  // ── การแจ้งเตือน (มาตรฐานกลาง — ดู STANDARD.md §3.3) ──
  const { showAlert, showConfirm, alertElement } = useAlert();

  const askConfirmBeforeSave = (
    title: string,
    message: string,
    onConfirmAction: () => void,
    type: AlertType = 'warning'
  ) => {
    showConfirm({
      title,
      message,
      type,
      confirmText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      onConfirm: onConfirmAction,
    });
  };

  const hasAlreadySubmitted = Boolean((existingPaymentMethodId || existingSlipUrl) && !rejectReason);

  // Fetch job details on load
  useEffect(() => {
    async function loadJobInfo() {
      if (!rawJobId && !numericJobId) {
        setLoadingJob(false);
        return;
      }
      try {
        const res = await getRepair(numericJobId || rawJobId);
        if (res.success && res.data) {
          const d = res.data;
          if (d.customer_name) setCustomerName(d.customer_name);
          const q = d.quotation;
          const isCancelledJob =
            Number(d.status_id) === REPAIR_STATUS.CANCELLED ||
            d.status === 'ยกเลิกซ่อม' ||
            String(d.status || '').includes('ยกเลิก') ||
            Number(d.quote_status_id) === QUOTE_STATUS.CANCELLED ||
            Number(q?.quote_status_id) === QUOTE_STATUS.CANCELLED ||
            Boolean(d.is_cancelled);

          const cancelPrice = Number(d.total_cancel_price) || Number(q?.total_cancel_price) || CANCEL_INSPECTION_FEE;
          const repairPrice = Number(d.total_repair_price) || Number(q?.total_repair_price) || Number(d.total_amount) || 0;
          const computedTotal = isCancelledJob ? cancelPrice : (repairPrice > 0 ? repairPrice : (Number(params.amount) || CANCEL_INSPECTION_FEE));

          setTotalAmount(computedTotal);
          setIsCancelled(isCancelledJob);

          if (d.payment_method_id) {
            setExistingPaymentMethodId(d.payment_method_id);
            if (d.payment_method_id === PAYMENT_METHODS.TRANSFER) setPaymentMethod('transfer');
            else if (d.payment_method_id === PAYMENT_METHODS.CASH) setPaymentMethod('cash');
          }
          if (d.payment_verified) {
            setPaymentVerified(true);
          }
          if (d.payment_reject_reason) {
            setRejectReason(d.payment_reject_reason);
          }
          if (d.slip_image) {
            setExistingSlipUrl(getImageUrl(d.slip_image));
            setExistingSlipFilename(d.slip_filename || null);
          }
        }
      } catch (err) {
        console.error('Error fetching job details for payment:', err);
      } finally {
        setLoadingJob(false);
      }
    }
    loadJobInfo();
  }, [rawJobId, numericJobId, params.amount]);

  const handlePickImage = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('ต้องการสิทธิ์การเข้าถึง', 'กรุณาอนุญาตให้เข้าถึงรูปภาพเพื่อแนบสลิป', 'warning');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSlipImage(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (isBusy) return;
    if (paymentMethod === 'transfer' && !slipImage) {
      showAlert('กรุณาแนบสลิป', 'สำหรับการโอนเงิน กรุณาอัปโหลดหลักฐานสลิปการโอนเงินก่อนยืนยัน', 'warning');
      return;
    }
    const methodText = paymentMethod === 'cash' ? 'ชำระหน้าร้าน' : 'โอนเงิน';
    askConfirmBeforeSave(
      'ยืนยันข้อมูลการชำระเงิน?',
      `ยืนยันการเลือกชำระเงินแบบ "${methodText}" ยอด ${formattedAmount} บาท? เมื่อบันทึกแล้วจะไม่สามารถแก้ไขได้`,
      () => doSubmitPayment()
    );
  };

  const doSubmitPayment = async () => {
    if (isBusy) return;
    setSubmitting(true);
    try {
      let payload: any;
      let isFormData = false;

      if (paymentMethod === 'transfer' && slipImage) {
        isFormData = true;
        const formData = new FormData();
        formData.append('job_id', String(numericJobId || rawJobId));
        formData.append('job_no', displayJobNo);
        formData.append('payment_method', paymentMethod);

        if (Platform.OS === 'web') {
          const res = await fetch(slipImage);
          const blob = await res.blob();
          const ext = blob.type.split('/')[1] || 'jpg';
          const fileName = `slip_${numericJobId || 'job'}.${ext}`;
          formData.append('slip_image', blob, fileName);
          formData.append('slip', blob, fileName);
        } else {
          const filename = slipImage.split('/').pop() || 'slip.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const ext = match ? match[1] : 'jpg';
          const type = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
          const fileObj = { uri: slipImage, name: filename, type } as any;
          formData.append('slip_image', fileObj);
          formData.append('slip', fileObj);
        }
        payload = formData;
      } else {
        payload = {
          job_id: numericJobId || rawJobId,
          job_no: displayJobNo,
          payment_method: paymentMethod,
        };
      }

      const res = await createPayment(payload, isFormData);
      if (res.success) {
        showAlert('บันทึกสำเร็จ!', 'ระบบได้บันทึกข้อมูลการชำระเงินเรียบร้อยแล้ว', 'success', () => {
          if (router.canGoBack()) router.back();
          else router.replace('/');
        });
      } else {
        showAlert('เกิดข้อผิดพลาด', res.message || 'ไม่สามารถบันทึกข้อมูลได้', 'danger');
      }
    } catch (err: any) {
      showAlert('ข้อผิดพลาด', err.message || 'ไม่สามารถบันทึกข้อมูลได้', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyPayment = () => {
    if (isBusy) return;
    askConfirmBeforeSave(
      'ยืนยันการชำระเงิน?',
      `ยืนยันว่าลูกค้าได้ชำระเงินยอด ${formattedAmount} บาทเรียบร้อยแล้วและปรับสถานะพร้อมส่งมอบ? กดยืนยันเพื่อดำเนินการ`,
      () => doVerifyPayment(),
      'warning'
    );
  };

  const doVerifyPayment = async () => {
    if (isBusy) return;
    setVerifying(true);
    try {
      const res = await verifyPayment(numericJobId || rawJobId);
      if (res.success) {
        setPaymentVerified(true);
        showConfirm({
          title: 'ยืนยันการชำระเงินสำเร็จ!',
          message: 'ปรับสถานะเป็น "พร้อมส่งมอบ" เรียบร้อยแล้ว สามารถไปหน้าส่งมอบเครื่องต่อได้',
          type: 'success',
          confirmText: 'ยืนยัน',
        });
      }
    } catch (err: any) {
      showAlert('ข้อผิดพลาด', err.message || 'ไม่สามารถยืนยันการชำระเงินได้', 'danger');
    } finally {
      setVerifying(false);
    }
  };

  const handleRejectPayment = async () => {
    if (isBusy) return;
    setRejecting(true);
    try {
      const res = await rejectPayment(numericJobId || rawJobId, rejectInputText.trim() || undefined);
      if (res.success) {
        setShowRejectInput(false);
        setRejectReason(rejectInputText.trim() || 'สลิปไม่ถูกต้อง');
        setExistingPaymentMethodId(null);
        setExistingSlipUrl(null);
        setExistingSlipFilename(null);
        setRejectInputText('');
        showConfirm({ title: 'ปฏิเสธการชำระเงินแล้ว', message: 'ระบบได้แจ้งให้ลูกค้าทราบเพื่อส่งหลักฐานใหม่แล้ว', type: 'success', confirmText: 'ยืนยัน' });
      }
    } catch (err: any) {
      showAlert('ข้อผิดพลาด', err.message || 'ไม่สามารถปฏิเสธการชำระเงินได้', 'danger');
    } finally {
      setRejecting(false);
    }
  };

  const handleStaffCashPayment = () => {
    if (isBusy) return;
    askConfirmBeforeSave(
      'ยืนยันรับเงินสด?',
      `บันทึกรับชำระเงินสดหน้าร้านยอด ${formattedAmount} บาทและยืนยันทันที กดยืนยันเพื่อบันทึก`,
      () => doStaffCashPayment()
    );
  };

  const doStaffCashPayment = async () => {
    if (isBusy) return;
    setVerifying(true);
    try {
      await createPayment({
        job_id: numericJobId || rawJobId,
        job_no: displayJobNo,
        payment_method: 'cash',
      });
      const res = await verifyPayment(numericJobId || rawJobId);
      if (res.success) {
        setPaymentVerified(true);
        setExistingPaymentMethodId(1);
        showConfirm({ title: 'สำเร็จ', message: 'บันทึกรับชำระเงินสดหน้าร้านและยืนยันเรียบร้อยแล้ว', type: 'success', confirmText: 'ยืนยัน' });
      }
    } catch (err: any) {
      showAlert('ข้อผิดพลาด', err.message || 'ไม่สามารถทำรายการได้', 'danger');
    } finally {
      setVerifying(false);
    }
  };

  const isBusy = submitting || verifying || rejecting;
  const formattedAmount = Number(totalAmount).toLocaleString();

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar style="light" backgroundColor={Colors.primary} />

      {/* Header */}
      <View className="bg-primary pt-4 pb-6 px-4 flex-row items-center relative z-10">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View>
          <Text className="text-white text-lg font-bold font-heading">
            {isStaff ? 'ตรวจสอบการชำระเงิน' : 'ชำระเงินค่าซ่อม'}
          </Text>
          <Text className="text-red-200 text-xs font-body">{displayJobNo}</Text>
        </View>
      </View>

      {loadingJob ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text className="text-slate-500 font-body text-xs mt-3">กำลังโหลดข้อมูล...</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 relative z-0" contentContainerClassName="p-4 pb-28">
          <InvoiceSummaryCard
            displayJobNo={displayJobNo}
            customerName={customerName}
            formattedAmount={formattedAmount}
            isCancelled={isCancelled}
          />

          {isStaff ? (
            <StaffReviewCard
              paymentVerified={paymentVerified}
              existingPaymentMethodId={existingPaymentMethodId}
              existingSlipUrl={existingSlipUrl}
              existingSlipFilename={existingSlipFilename}
              onOpenSlipModal={() => setModalVisible(true)}
              showRejectInput={showRejectInput}
              rejectInputText={rejectInputText}
              onRejectInputChange={setRejectInputText}
              onCancelReject={() => {
                setShowRejectInput(false);
                setRejectInputText('');
              }}
              onConfirmReject={handleRejectPayment}
              isBusy={isBusy}
              rejecting={rejecting}
            />
          ) : hasAlreadySubmitted ? (
            <CustomerLockedCard
              paymentVerified={paymentVerified}
              existingPaymentMethodId={existingPaymentMethodId}
              existingSlipUrl={existingSlipUrl}
              existingSlipFilename={existingSlipFilename}
              onOpenSlipModal={() => setModalVisible(true)}
            />
          ) : (
            <CustomerPaymentForm
              rejectReason={rejectReason}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              formattedAmount={formattedAmount}
              handlePickImage={handlePickImage}
              slipImage={slipImage}
              displayJobNo={displayJobNo}
            />
          )}
        </ScrollView>
      )}

      {/* Fullscreen Slip Modal */}
      <SlipPreviewModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        slipUrl={existingSlipUrl || slipImage}
        slipFilename={existingSlipFilename}
      />

      {/* Footer Buttons */}
      <PaymentFooterButtons
        isStaff={isStaff}
        paymentVerified={paymentVerified}
        hasAlreadySubmitted={hasAlreadySubmitted}
        hasExistingPayment={Boolean(existingPaymentMethodId || existingSlipUrl)}
        isBusy={isBusy}
        showRejectInput={showRejectInput}
        verifying={verifying}
        submitting={submitting}
        onBack={() => router.back()}
        onGoToHandover={() => {
          router.push({
            pathname: '/deliver-handover' as any,
            params: {
              job_id: String(numericJobId || rawJobId),
              job_no: displayJobNo,
              customer_name: customerName,
              role: 'staff',
            },
          });
        }}
        onShowRejectInput={() => setShowRejectInput(true)}
        onVerifyPayment={handleVerifyPayment}
        onStaffCashPayment={handleStaffCashPayment}
        onSubmitPayment={handleSubmit}
      />

      {/* การแจ้งเตือน (มาตรฐานกลาง) */}
      {alertElement}
    </SafeAreaView>
  );
}
