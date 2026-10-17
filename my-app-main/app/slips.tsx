// 1. React & React Native
import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  ActivityIndicator, ScrollView,
  FlatList, Modal, Dimensions, Platform
} from 'react-native';

// 2. Third-party / Expo
import * as ImagePicker from 'expo-image-picker';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// 3. API & Auth helpers
import { deleteSlip, createSlip, getSlips } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

// 4. Hooks (มาตรฐานกลาง)
import { useAlert } from '@/hooks/use-alert';

const { width } = Dimensions.get('window');

import type { SlipRecord } from '@/types/payment';

export default function SlipsPage() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mySlips, setMySlips] = useState<SlipRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: number | string; email: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // ── การแจ้งเตือน (มาตรฐานกลาง — ดู STANDARD.md §3.3) ──
  const { showAlert, showConfirm, alertElement } = useAlert();

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const user = await getCurrentUser();
    if (user) {
      setCurrentUser({ id: user.id, email: user.email ?? 'unknown' });
      fetchMySlips(user.id);
    } else {
      showAlert('ไม่ได้เข้าสู่ระบบ', 'กรุณา Login ก่อนใช้งาน', 'danger');
    }
  };

  const fetchMySlips = async (_userId?: number | string) => {
    try {
      setLoading(true);
      const res = await getSlips();
      if (res.success) {
        setMySlips(res.data ?? []);
      } else {
        setMySlips([]);
      }
    } catch (error: any) {
      console.error('Fetch error:', error);
      setMySlips([]);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { showAlert('สิทธิ์การเข้าถึง', 'ต้องการสิทธิ์เข้าถึงคลังภาพ', 'info'); return; }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { showAlert('สิทธิ์การเข้าถึง', 'ต้องการสิทธิ์เข้าถึงกล้อง', 'info'); return; }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const uploadImage = async () => {
    if (!imageUri) { showAlert('กรุณาเลือกรูปภาพ', 'กรุณาเลือกรูปภาพก่อน', 'info'); return; }
    if (!currentUser) { showAlert('ไม่ได้เข้าสู่ระบบ', 'กรุณา Login ก่อน', 'danger'); return; }

    try {
      setUploading(true);
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const fetchRes = await fetch(imageUri);
        const blob = await fetchRes.blob();
        formData.append('slip', blob, 'slip.jpg');
      } else {
        const filename = imageUri.split('/').pop() || 'slip.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1] : 'jpg';
        const type = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        formData.append('slip', { uri: imageUri, name: filename, type } as any);
      }

      const res = await createSlip(formData);

      if (!res.success) throw new Error(res.message || 'อัปโหลดไม่สำเร็จ');

      setImageUri(null);
      fetchMySlips();
      showAlert('สำเร็จ', 'อัปโหลดสลิปเรียบร้อยแล้ว', 'success');
    } catch (error: any) {
      console.error('Upload error:', error);
      showAlert('อัปโหลดไม่สำเร็จ', error.message || 'เกิดข้อผิดพลาดในการอัปโหลด', 'danger');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSlip = async (item: SlipRecord) => {
    showConfirm({
      title: 'ยืนยันการลบ',
      message: 'คุณต้องการลบสลิปนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
      type: 'danger',
      confirmText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      onConfirm: async () => {
        try {
          const res = await deleteSlip(item.id);
          if (!res.success) throw new Error(res.message);
          setMySlips(prev => prev.filter(s => s.id !== item.id));
          showAlert('สำเร็จ', 'ลบสลิปเรียบร้อยแล้ว', 'success');
        } catch (error: any) {
          console.error('General delete error:', error);
          showAlert('ลบไม่สำเร็จ', error.message || 'เกิดข้อผิดพลาดในการลบ', 'danger');
        }
      },
    });
  };

  const renderSlipCard = ({ item }: { item: SlipRecord }) => (
    <View className="bg-white rounded-xl mb-3.5 overflow-hidden shadow-sm shadow-black/10 elevation-2">
      <TouchableOpacity onPress={() => setPreviewUrl(item.image_url)}>
        <Image source={{ uri: item.image_url }} className="w-full h-[180px]" resizeMode="cover" />
      </TouchableOpacity>
      <View className="p-3">
        <Text className="text-[13px] font-semibold text-slate-800 mb-1">เจ้าของ: {currentUser?.email}</Text>
        <Text className="text-xs text-slate-500 mb-1">
          {new Date(item.uploaded_at).toLocaleString('th-TH')}
        </Text>
        <Text className="text-[11px] text-slate-400" numberOfLines={1}>
          ID: #{item.id}
        </Text>
      </View>
      <TouchableOpacity className="bg-red-500 py-2.5 items-center" onPress={() => handleDeleteSlip(item)}>
        <Text className="text-white font-bold text-sm">ลบ</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-100">
      <Stack.Screen options={{ title: 'อัปโหลดสลิป' }} />

      {/* Custom Header with Back Button */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
        <TouchableOpacity className="p-1 rounded-lg" onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-slate-800">อัปโหลดสลิป</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60, alignItems: 'center' }}>
        {/* แสดงข้อมูล User ปัจจุบัน */}
        {currentUser && (
          <View className="w-full bg-blue-600 rounded-xl p-3 mb-5 items-center">
            <Text className="text-white font-bold text-sm">{currentUser.email}</Text>
            <Text className="text-blue-200 text-xs mt-0.5">ID: #{currentUser.id}</Text>
          </View>
        )}

        {/* Preview รูปที่เลือก */}
        {imageUri ? (
          <TouchableOpacity onPress={() => setImageUri(null)}>
            <Image source={{ uri: imageUri }} className="rounded-2xl mb-1" style={{ width: width - 32, height: width - 32 }} resizeMode="cover" />
            <Text className="text-center text-slate-500 text-xs mb-4">กดที่รูปเพื่อยกเลิก</Text>
          </TouchableOpacity>
        ) : (
          <View className="h-[220px] bg-slate-200 rounded-2xl items-center justify-center mb-5 border-2 border-dashed border-slate-400" style={{ width: width - 32 }}>
            <Text className="text-slate-500 text-base mt-2">ยังไม่ได้เลือกรูปภาพ</Text>
          </View>
        )}

        {/* ปุ่มเลือก/ถ่ายรูป */}
        <View className="flex-row justify-between w-full mb-3">
          <TouchableOpacity className="flex-1 mx-1 py-3.5 rounded-xl items-center bg-blue-500" onPress={takePhoto}>
            <Text className="text-white font-semibold text-sm">ถ่ายรูป</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 mx-1 py-3.5 rounded-xl items-center bg-indigo-500" onPress={pickImage}>
            <Text className="text-white font-semibold text-sm">จากคลัง</Text>
          </TouchableOpacity>
        </View>

        {/* ปุ่มอัปโหลด */}
        <TouchableOpacity
          className={`w-full py-4 rounded-xl items-center mb-5 ${(!imageUri || uploading) ? 'bg-green-300' : 'bg-green-600'}`}
          onPress={uploadImage}
          disabled={!imageUri || uploading}
        >
          {uploading
            ? <ActivityIndicator color="#ffffff" />
            : <Text className="text-white font-bold text-base">อัปโหลดสลิป</Text>
          }
        </TouchableOpacity>

        {/* แถบแบ่ง */}
        <View className="flex-row items-center w-full my-4">
          <View className="flex-1 h-[1px] bg-slate-300" />
          <Text className="mx-2.5 text-slate-600 font-semibold">ประวัติสลิปของฉัน</Text>
          <View className="flex-1 h-[1px] bg-slate-300" />
        </View>

        {/* ปุ่มรีโหลด */}
        <TouchableOpacity className="w-full mb-4 py-3.5 rounded-xl items-center bg-orange-500" onPress={() => fetchMySlips()}>
          <Text className="text-white font-semibold text-sm">โหลดประวัติใหม่</Text>
        </TouchableOpacity>

        {/* รายการสลิป */}
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" className="mt-5" />
        ) : mySlips.length === 0 ? (
          <Text className="text-slate-400 text-sm mt-5">ยังไม่มีสลิปที่อัปโหลด</Text>
        ) : (
          <FlatList
            data={mySlips}
            keyExtractor={item => String(item.id)}
            renderItem={renderSlipCard}
            scrollEnabled={false}
            className="w-full"
          />
        )}
      </ScrollView>

      {/* Modal แสดงรูปเต็มจอ */}
      <Modal visible={!!previewUrl} transparent animationType="fade">
        <TouchableOpacity className="flex-1 bg-black/90 justify-center items-center" onPress={() => setPreviewUrl(null)}>
          <Image source={{ uri: previewUrl! }} className="w-[95%] h-[80%]" resizeMode="contain" />
          <Text className="text-white mt-4 text-base">ปิด</Text>
        </TouchableOpacity>
      </Modal>

      {/* การแจ้งเตือน (มาตรฐานกลาง) */}
      {alertElement}
    </SafeAreaView>
  );
}
