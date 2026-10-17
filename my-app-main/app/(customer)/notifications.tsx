import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import { getRepairs } from '@/lib/api';

import { REPAIR_STATUS, QUOTE_STATUS, CANCEL_INSPECTION_FEE } from '@/constants/status';
import { Colors } from '@/constants/theme';

interface AppNotification {
  id: string;
  jobId: number | string;
  jobNo: string;
  title: string;
  message: string;
  time: string;
  /** ใช้เรียงลำดับการแจ้งเตือนใหม่ → เก่า (timestamp ของเหตุการณ์) */
  sortAt: number;
  type: 'quote' | 'repair' | 'ready' | 'info' | 'rejected' | 'cancelled' | 'receipt';
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  /** ปลายทางเมื่อแตะการแจ้งเตือน (ค่าเริ่มต้น = รายละเอียดงานซ่อม) */
  target?: 'detail' | 'receipt';
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await getRepairs();
      const jobs = res.data || [];

      const notifs: AppNotification[] = [];

      jobs.forEach((job: any) => {
        const jobId = job.id || job.job_id;
        const jobNo = job.job_number || job.job_no || `REP-${jobId}`;
        const device = [job.brand, job.model].filter(Boolean).join(' ') || job.device_type || 'อุปกรณ์ไอที';

        // เวลาที่แสดง = การเคลื่อนไหวล่าสุดของงาน (repair_job_detail) ไม่ใช่วันรับเครื่อง
        const rawTime = job.last_action_at || job.payment_verified_at || job.repaired_at || job.created_at;

        const statusId = Number(job.status_id);
        const quoteStatusId = Number(job.quote_status_id);
        const isCancelledJob =
          statusId === REPAIR_STATUS.CANCELLED ||
          quoteStatusId === QUOTE_STATUS.CANCELLED ||
          job.is_cancelled === true;
        const isPaid = Boolean(job.payment_verified);
        const hasSubmittedPayment = Boolean(job.payment_method_id || job.slip_image);
        const cancelFee = Number(job.total_cancel_price) || CANCEL_INSPECTION_FEE;

        const push = (
          notif: Omit<AppNotification, 'time' | 'sortAt'>,
          timeOverride?: string | null
        ) => {
          const t = timeOverride || rawTime;
          const d = t ? new Date(t) : null;
          const isValid = Boolean(d) && !isNaN((d as Date).getTime());
          notifs.push({
            ...notif,
            time: isValid
              ? (d as Date).toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'เมื่อเร็วๆ นี้',
            sortAt: isValid ? (d as Date).getTime() : 0,
          });
        };

        // 0. พนักงานตีกลับการชำระเงิน — ต้องเช็กก่อน branch อื่น (reject ไม่เปลี่ยน status_id)
        const rejectReason = String(job.payment_reject_reason || '').trim();
        if (rejectReason && !isPaid) {
          push({
            id: `rejected-${jobId}`,
            jobId,
            jobNo,
            title: `การชำระเงินถูกปฏิเสธ (${jobNo})`,
            message: `เหตุผล: ${rejectReason} — กรุณาตรวจสอบและส่งข้อมูลการชำระเงินใหม่`,
            type: 'rejected',
            icon: 'close-circle',
            color: Colors.primary,
            bgColor: '#FEE2E2',
          });
          return;
        }

        // ── งานที่ถูกยกเลิกซ่อม (ลูกค้าต้องชำระค่าบริการตรวจเช็คสภาพเครื่อง) ──
        if (isCancelledJob) {
          if (!isPaid) {
            push({
              id: `cancelled-${jobId}`,
              jobId,
              jobNo,
              title: `ยกเลิกซ่อม — รอชำระค่าตรวจเช็ค (${jobNo})`,
              message: `${device} ถูกยกเลิกการซ่อมแล้ว มีค่าบริการตรวจเช็คสภาพเครื่อง ${cancelFee.toLocaleString()} บาท กรุณาชำระเงินและแจ้งหลักฐานในระบบ`,
              type: 'cancelled',
              icon: 'close-circle',
              color: Colors.primary,
              bgColor: '#FEE2E2',
            });
          } else {
            push({
              id: `cancelled-paid-${jobId}`,
              jobId,
              jobNo,
              title: `ปิดงานซ่อม (ยกเลิกซ่อม) เรียบร้อย (${jobNo})`,
              message: `ชำระค่าบริการตรวจเช็คสภาพเครื่องเรียบร้อยแล้ว — สามารถมารับ ${device} คืนได้ที่ร้าน`,
              type: 'ready',
              icon: 'cube',
              color: '#0284C7',
              bgColor: '#E0F2FE',
            });
            push(
              {
                id: `receipt-${jobId}`,
                jobId,
                jobNo,
                title: `ใบเสร็จค่าตรวจเช็คพร้อมแล้ว (${jobNo})`,
                message: 'ใบเสร็จรับเงินพร้อมให้ตรวจสอบและบันทึกแล้ว แตะเพื่อเปิดใบเสร็จ',
                type: 'receipt',
                icon: 'receipt',
                color: '#16A34A',
                bgColor: '#DCFCE7',
                target: 'receipt',
              },
              job.return_date
            );
          }
          return;
        }

        // ── งานซ่อมปกติ (แยกตามสถานะงาน) ──
        if (statusId === REPAIR_STATUS.PENDING_CHECK || statusId === REPAIR_STATUS.CHECKING) {
          push({
            id: `check-${jobId}`,
            jobId,
            jobNo,
            title: `รับเครื่องเข้าระบบแล้ว (${jobNo})`,
            message: `ศูนย์บริการได้รับ ${device} เข้าสู่ขั้นตอนตรวจเช็คอาการเสียโดยช่างผู้เชี่ยวชาญ`,
            type: 'info',
            icon: 'shield-checkmark-outline',
            color: '#D97706',
            bgColor: '#FEF3C7',
          });
        } else if (statusId === REPAIR_STATUS.MAKING_QUOTE) {
          // ลูกค้าตีกลับ/ขอแก้ไขใบเสนอราคา (CHANGE_REQUEST) → กำลังปรับปรุงใบเสนอราคา
          const isChangeRequest =
            quoteStatusId === QUOTE_STATUS.CHANGE_REQUEST || Boolean(job.customer_remark);
          push({
            id: `revising-${jobId}`,
            jobId,
            jobNo,
            title: isChangeRequest
              ? `ได้รับคำขอแก้ไขใบเสนอราคาแล้ว (${jobNo})`
              : `กำลังจัดทำใบเสนอราคา (${jobNo})`,
            message: isChangeRequest
              ? `ทางร้านได้รับคำขอแก้ไขของคุณแล้ว ช่างกำลังปรับปรุงใบเสนอราคาให้ ${device} และจะแจ้งให้ยืนยันอีกครั้ง`
              : `ช่างกำลังตรวจเช็คและจัดทำใบเสนอราคาสำหรับ ${device} กรุณารอการแจ้งเตือนครั้งถัดไป`,
            type: 'quote',
            icon: 'construct-outline',
            color: '#4F46E5',
            bgColor: '#E0E7FF',
          });
        } else if (statusId === REPAIR_STATUS.PENDING_APPROVAL) {
          push({
            id: `quote-${jobId}`,
            jobId,
            jobNo,
            title: `มีใบเสนอราคารอการอนุมัติ (${jobNo})`,
            message: `ช่างได้ตรวจเช็ค ${device} และส่งใบเสนอราคาแล้ว กรุณากดตรวจสอบและยืนยันการซ่อม`,
            type: 'quote',
            icon: 'receipt',
            color: '#A855F7',
            bgColor: '#F3E8FF',
          });
        } else if (statusId === REPAIR_STATUS.APPROVED_WAIT_REPAIR) {
          push({
            id: `repair-${jobId}`,
            jobId,
            jobNo,
            title: `กำลังดำเนินการซ่อม (${jobNo})`,
            message: `ช่างซ่อมกำลังดำเนินการเปลี่ยนอะไหล่และแก้ไขปัญหาให้ ${device} ของคุณ`,
            type: 'repair',
            icon: 'hammer',
            color: '#6366F1',
            bgColor: '#EEF2FF',
          });
        } else if (statusId === REPAIR_STATUS.WAITING_PAYMENT) {
          push({
            id: `payment-${jobId}`,
            jobId,
            jobNo,
            title: hasSubmittedPayment
              ? `รอตรวจสอบการชำระเงิน (${jobNo})`
              : `ซ่อมเสร็จแล้ว รอชำระเงิน (${jobNo})`,
            message: hasSubmittedPayment
              ? `ระบบได้รับข้อมูลการชำระเงินของ ${device} แล้ว พนักงานกำลังตรวจสอบความถูกต้อง`
              : `${device} ซ่อมเสร็จเรียบร้อยแล้ว กรุณาชำระเงินและแจ้งสลิปในระบบ`,
            type: 'ready',
            icon: hasSubmittedPayment ? 'time-outline' : 'cash-outline',
            color: '#D97706',
            bgColor: '#FEF3C7',
          });
        } else if (statusId === REPAIR_STATUS.READY_FOR_PICKUP) {
          push({
            id: `pickup-${jobId}`,
            jobId,
            jobNo,
            title: `ตรวจสอบยอดแล้ว เครื่องพร้อมให้มารับ (${jobNo})`,
            message: `ทางร้านตรวจสอบการชำระเงินของ ${device} เรียบร้อยแล้ว สามารถติดต่อรับเครื่องที่หน้าร้านและเซ็นรับได้เลย`,
            type: 'ready',
            icon: 'cube',
            color: '#0284C7',
            bgColor: '#E0F2FE',
          });
        } else if (statusId === REPAIR_STATUS.COMPLETED) {
          push({
            id: `completed-${jobId}`,
            jobId,
            jobNo,
            title: `ส่งมอบเครื่องเสร็จสิ้นแล้ว (${jobNo})`,
            message: `การซ่อมแซม ${device} เสร็จสิ้นสมบูรณ์ ขอบคุณที่ไว้วางใจใช้บริการ IT VERTEX`,
            type: 'ready',
            icon: 'checkmark-circle',
            color: '#16A34A',
            bgColor: '#DCFCE7',
          });
          push(
            {
              id: `receipt-${jobId}`,
              jobId,
              jobNo,
              title: `ใบเสร็จรับเงินพร้อมแล้ว (${jobNo})`,
              message: 'ใบเสร็จรับเงินพร้อมให้ตรวจสอบและบันทึกแล้ว แตะเพื่อเปิดใบเสร็จ',
              type: 'receipt',
              icon: 'receipt',
              color: '#16A34A',
              bgColor: '#DCFCE7',
              target: 'receipt',
            },
            job.return_date
          );
        }
      });

      // เรียงใหม่สุด → เก่าสุด
      notifs.sort((a, b) => b.sortAt - a.sortAt);
      setNotifications(notifs);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      if (!isSilent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(true);
  };

  const handlePressNotification = (notif: AppNotification) => {
    if (notif.target === 'receipt') {
      router.push({
        pathname: '/receipt',
        params: { jobId: notif.jobId, job_no: notif.jobNo },
      });
      return;
    }
    router.push({
      pathname: '/job-detail',
      params: { id: notif.jobId },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      <StatusBar style="light" backgroundColor={Colors.primary} />

      {/* Header */}
      <View className="bg-primary px-5 pt-4 pb-6 rounded-b-[28px] shadow-sm">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white/80 text-xs font-bold tracking-wider font-heading uppercase">
              NOTIFICATIONS
            </Text>
            <Text className="text-white text-xl font-bold font-heading mt-0.5">
              การแจ้งเตือนงานซ่อม
            </Text>
          </View>
          <View className="px-3 py-1 bg-white/20 rounded-full">
            <Text className="text-white text-xs font-bold font-heading">
              {notifications.length} รายการ
            </Text>
          </View>
        </View>
      </View>

      {/* Notification List */}
      <View className="flex-1 px-4 pt-3">
        {loading ? (
          <View className="flex-1 justify-center items-center py-12">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text className="text-slate-400 text-xs font-body mt-2">กำลังโหลดการแจ้งเตือน...</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 80 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handlePressNotification(item)}
                className="bg-white rounded-2xl p-4 mb-3 border border-slate-200 shadow-sm flex-row items-start gap-3"
              >
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mt-0.5"
                  style={{ backgroundColor: item.bgColor }}
                >
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-bold text-slate-800 font-heading flex-1 mr-2" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="text-[11px] text-slate-400 font-body">{item.time}</Text>
                  </View>

                  <Text className="text-xs text-slate-600 font-body leading-4 mb-2" numberOfLines={2}>
                    {item.message}
                  </Text>

                  <View className="flex-row items-center gap-1">
                    <Text className="text-[11px] font-bold text-primary font-heading">
                      {item.target === 'receipt' ? 'แตะเพื่อดูใบเสร็จ' : 'แตะเพื่อดูรายละเอียด'}
                    </Text>
                    <Ionicons name="chevron-forward" size={12} color={Colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View className="bg-white rounded-2xl p-8 items-center justify-center border border-slate-200 mt-4">
                <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-3">
                  <Ionicons name="notifications-off-outline" size={32} color="#94A3B8" />
                </View>
                <Text className="text-base font-bold text-slate-700 font-heading mb-1">
                  ไม่มีการแจ้งเตือนใหม่
                </Text>
                <Text className="text-xs text-slate-400 font-body text-center max-w-xs leading-4">
                  เมื่อมีความคืบหน้าของงานซ่อมหรือใบเสนอราคา ระบบจะแจ้งเตือนให้คุณทราบทันที
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
