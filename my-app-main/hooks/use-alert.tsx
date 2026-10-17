/**
 * hooks/use-alert.tsx
 * ─────────────────────────────────────────────────────────────
 * มาตรฐานกลางของการแจ้งเตือน (Single Alert Standard) — อ้างตาม STANDARD.md §3.3
 *
 * กติกา: ห้ามประกาศ showAlert / alertConfig ซ้ำในหน้าจออีก
 * ให้ทุกหน้าจอใช้ hook นี้ แล้วนำ `alertElement` ไปวางใน JSX แทน <CustomAlert />
 *
 * วิธีใช้
 * ──────
 *   const { showAlert, showConfirm, alertElement } = useAlert();
 *
 *   showAlert('สำเร็จ', 'บันทึกเรียบร้อยแล้ว', 'success');           // ปุ่มเดียว
 *   showAlert('ข้อผิดพลาด', 'เกิดข้อผิดพลาด', 'danger');             // ปุ่มเดียว (ค่า default = 'info')
 *   showAlert('สำเร็จ', 'กำลังกลับหน้าเข้าสู่ระบบ', 'success', () => router.replace('/(auth)/login'));
 *
 *   showConfirm({                                                    // สองปุ่ม
 *     title: 'ยืนยันการลบ',
 *     message: 'ต้องการลบรายการนี้หรือไม่',
 *     type: 'danger',
 *     confirmText: 'ลบ',
 *     onConfirm: () => handleDelete(),
 *   });
 *
 *   // ใน JSX
 *   {alertElement}
 */
import { useCallback, useState } from 'react';
import CustomAlert from '@/components/ui/CustomAlert';

/** ค่ามาตรฐานของประเภทการแจ้งเตือน — ตรงกับ prop `type` ของ CustomAlert */
export type AlertType = 'success' | 'warning' | 'danger' | 'info';

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  type: AlertType;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export interface ShowConfirmOptions {
  title: string;
  message: string;
  type?: AlertType;
  /** ข้อความปุ่มยืนยัน (ไม่ใส่ = 'ตกลง') */
  confirmText?: string;
  /** ข้อความปุ่มยกเลิก — **ไม่ใส่ = แสดงปุ่มเดียว** (พฤติกรรมเดียวกับ CustomAlert เดิม) */
  cancelText?: string;
  /** ทำงานหลังกดปุ่มยืนยัน (ไม่ใส่ = แค่ปิดกล่อง) */
  onConfirm?: () => void;
  onCancel?: () => void;
}

const INITIAL_STATE: AlertState = {
  visible: false,
  title: '',
  message: '',
  type: 'info',
  confirmText: 'ตกลง',
  onConfirm: () => {},
};

export function useAlert() {
  const [state, setState] = useState<AlertState>(INITIAL_STATE);

  const closeAlert = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  /**
   * แจ้งเตือนปุ่มเดียว
   * @param type ค่า default = 'info' (ระบุให้ชัดเจนทุกครั้งเพื่อให้อ่านง่าย)
   * @param onConfirm ทำงานหลังผู้ใช้กดปุ่มตกลง (ปิดกล่องก่อนแล้วจึงเรียก callback)
   */
  const showAlert = useCallback(
    (title: string, message: string, type: AlertType = 'info', onConfirm?: () => void) => {
      setState({
        visible: true,
        title,
        message,
        type,
        confirmText: 'ตกลง',
        cancelText: undefined,
        onConfirm: () => {
          setState((prev) => ({ ...prev, visible: false }));
          onConfirm?.();
        },
        onCancel: undefined,
      });
    },
    []
  );

  /** ยืนยัน (ใช้ก่อนกระทำที่ย้อนกลับไม่ได้ เช่น ลบ/ยกเลิก) — ใส่ `cancelText` เมื่อต้องการสองปุ่ม */
  const showConfirm = useCallback((options: ShowConfirmOptions) => {
    setState({
      visible: true,
      title: options.title,
      message: options.message,
      type: options.type ?? 'warning',
      confirmText: options.confirmText ?? 'ตกลง',
      cancelText: options.cancelText,
      onConfirm: () => {
        setState((prev) => ({ ...prev, visible: false }));
        options.onConfirm?.();
      },
      onCancel: () => {
        setState((prev) => ({ ...prev, visible: false }));
        options.onCancel?.();
      },
    });
  }, []);

  const alertElement = (
    <CustomAlert
      visible={state.visible}
      title={state.title}
      message={state.message}
      type={state.type}
      confirmText={state.confirmText}
      cancelText={state.cancelText}
      onConfirm={state.onConfirm}
      onCancel={state.onCancel}
    />
  );

  return { showAlert, showConfirm, closeAlert, alertElement };
}
