// 1. React & React Native
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { useAlert } from '@/hooks/use-alert';

// 3. API helpers
import { updateItem, createItem } from '@/lib/api';

interface AddPartModalProps {
  visible: boolean;
  itemToEdit?: any | null; // ถ้ามีค่าแสดงว่าอยู่ในโหมดแก้ไข
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPartModal({ visible, itemToEdit, onClose, onSuccess }: AddPartModalProps) {
  const [itemType, setItemType] = useState<'parts' | 'services'>('parts');
  const [itemName, setItemName] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [loading, setLoading] = useState(false);

  // ── การแจ้งเตือน (มาตรฐานกลาง — ดู STANDARD.md §3.3) ──
  const { showAlert, alertElement } = useAlert();

  useEffect(() => {
    if (itemToEdit) {
      setItemType(itemToEdit.item_type_id === 2 ? 'services' : 'parts');
      setItemName(itemToEdit.item_name || '');
      setSellingPrice(itemToEdit.selling_price ? String(itemToEdit.selling_price) : '');
      setCostPrice(itemToEdit.cost_price ? String(itemToEdit.cost_price) : '');
    } else {
      resetForm();
    }
  }, [itemToEdit, visible]);

  const resetForm = () => {
    setItemType('parts');
    setItemName('');
    setSellingPrice('');
    setCostPrice('');
  };

  const handleSave = async () => {
    if (loading) return;
    if (!itemName.trim()) {
      showAlert('ข้อผิดพลาด', 'กรุณากรอกชื่อรายการ', 'warning');
      return;
    }
    const priceNum = parseFloat(sellingPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      showAlert('ข้อผิดพลาด', 'ราคาขายต้องเป็นตัวเลขและไม่เป็นค่าติดลบ', 'warning');
      return;
    }

    // ราคาทุนมีเฉพาะอะไหล่ (ค่าบริการไม่มีต้นทุนสินค้า) → ใช้คิดกำไรขั้นต้นในแดชบอร์ด
    // บังคับต้องกรอกและมากกว่า 0 เพื่อไม่ให้กำไรขั้นต้นสูงเกินจริง
    const isPart = itemType === 'parts';
    let costNum = 0;
    if (isPart) {
      if (costPrice.trim() === '') {
        showAlert('ข้อผิดพลาด', 'กรุณากรอกราคาทุนของอะไหล่ (ต้องมากกว่า 0 บาท)', 'warning');
        return;
      }
      costNum = parseFloat(costPrice);
      if (isNaN(costNum) || costNum <= 0) {
        showAlert('ข้อผิดพลาด', 'ราคาทุนของอะไหล่ต้องมากกว่า 0 บาท', 'warning');
        return;
      }
      if (costNum > priceNum) {
        showAlert(
          'ข้อผิดพลาด',
          'ราคาทุนต้องไม่สูงกว่าราคาขาย มิฉะนั้นกำไรขั้นต้นจะติดลบ',
          'warning'
        );
        return;
      }
    }

    const payload = {
      item_name: itemName.trim(),
      item_type_id: isPart ? 1 : 2,
      selling_price: priceNum,
      cost_price: costNum,
    };

    setLoading(true);
    try {
      if (itemToEdit) {
        // Mode: Update
        const res = await updateItem(itemToEdit.item_id, payload);
        if (!res.success) throw new Error(res.message);
        showAlert('สำเร็จ', 'แก้ไขข้อมูลรายการเรียบร้อยแล้ว', 'success', () => {
          resetForm();
          onSuccess();
          onClose();
        });
      } else {
        // Mode: Insert
        const res = await createItem(payload);
        if (!res.success) throw new Error(res.message);
        showAlert('สำเร็จ', 'เพิ่มรายการใหม่เรียบร้อยแล้ว', 'success', () => {
          resetForm();
          onSuccess();
          onClose();
        });
      }
    } catch (err: any) {
      console.error('Save item error:', err);
      showAlert('ล้มเหลว', err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 bg-black/50 justify-center items-center p-5"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="w-full max-w-[400px] bg-white rounded-2xl p-5 shadow-lg shadow-black/25 elevation-5">
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-lg font-bold text-slate-800">
              {itemToEdit ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}
            </Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View className="mb-4">
            <Text className="text-sm text-slate-800 mb-2">ประเภท</Text>
            <View className="flex-row items-center py-1">
              <TouchableOpacity
                className="flex-row items-center mr-6 py-1"
                activeOpacity={0.7}
                onPress={() => setItemType('parts')}
                disabled={loading}
              >
                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${itemType === 'parts' ? 'border-primary' : 'border-slate-300'}`}>
                  {itemType === 'parts' && <View className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </View>
                <Text className="text-sm font-medium text-slate-800 font-heading">อะไหล่</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center mr-6 py-1"
                activeOpacity={0.7}
                onPress={() => setItemType('services')}
                disabled={loading}
              >
                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${itemType === 'services' ? 'border-primary' : 'border-slate-300'}`}>
                  {itemType === 'services' && <View className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </View>
                <Text className="text-sm font-medium text-slate-800 font-heading">ค่าบริการ</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-slate-800 mb-1.5 font-heading">ชื่อรายการ</Text>
            <TextInput
              className="border border-slate-200 rounded-xl px-3.5 h-12 bg-slate-50 text-slate-800 font-body text-sm"
              placeholder="กรอกชื่อรายการ"
              placeholderTextColor="#94a3b8"
              value={itemName}
              onChangeText={setItemName}
              editable={!loading}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-slate-800 mb-1.5 font-heading">ราคาขาย (บาท)</Text>
            <TextInput
              className="border border-slate-200 rounded-xl px-3.5 h-12 bg-slate-50 text-slate-800 font-body text-sm"
              placeholder="กรอกราคาขาย"
              keyboardType="numeric"
              placeholderTextColor="#94a3b8"
              value={sellingPrice}
              onChangeText={(text) => setSellingPrice(text.replace(/[^0-9.]/g, ''))}
              editable={!loading}
            />
          </View>

          {itemType === 'parts' && (
            <View className="mb-4">
              <Text className="text-sm font-medium text-slate-800 mb-1.5 font-heading">
                ราคาทุน / ต้นทุนอะไหล่ (บาท) <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="border border-slate-200 rounded-xl px-3.5 h-12 bg-slate-50 text-slate-800 font-body text-sm"
                placeholder="กรอกราคาทุนที่ร้านซื้อมา (ต้องมากกว่า 0)"
                keyboardType="numeric"
                placeholderTextColor="#94a3b8"
                value={costPrice}
                onChangeText={(text) => setCostPrice(text.replace(/[^0-9.]/g, ''))}
                editable={!loading}
              />
              {(() => {
                const sell = parseFloat(sellingPrice);
                const cost = parseFloat(costPrice);
                if (isNaN(sell) || isNaN(cost) || cost <= 0) {
                  return (
                    <Text className="text-[11px] text-slate-400 font-body mt-1.5">
                      จำเป็นต้องกรอก — ใช้คำนวณกำไรขั้นต้น (รายรับรวม − ต้นทุนอะไหล่)
                    </Text>
                  );
                }
                const profit = sell - cost;
                return (
                  <Text
                    className={`text-[11px] font-body mt-1.5 ${profit < 0 ? 'text-red-500' : 'text-emerald-600'}`}
                  >
                    กำไรต่อชิ้น ฿{profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    {sell > 0 ? ` (${Math.round((profit / sell) * 100)}%)` : ''}
                  </Text>
                );
              })()}
            </View>
          )}

          <TouchableOpacity
            className={`bg-primary h-12 rounded-xl justify-center items-center mt-2.5 shadow-sm active:opacity-90 ${loading ? 'opacity-70' : ''}`}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-bold text-base font-heading">
                {itemToEdit ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {alertElement}
    </Modal>
  );
}
