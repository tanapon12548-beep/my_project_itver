// 1. React & React Native
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { useFocusEffect } from 'expo-router';

// 3. API helpers
import { deleteItem, getItems } from '@/lib/api';

// 4. Components
import Header from '@/components/Shared_Dashboard/Header';
import AddPartModal from '@/components/Meneger_item/AddPartModal';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import PartDetailsModal from '@/components/Meneger_item/PartDetailsModal';
import SearchFilterBar from '@/components/ui/SearchFilterBar';
import PartTable from '@/components/Meneger_item/Table';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';

export default function PartsScreen() {
  const [devices, setDevices] = useState<any[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<any | null>(null);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<'parts' | 'services'>('parts');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDetailsVisible, setDetailsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      const typeId = activeTab === 'parts' ? 1 : 2;
      const res = await getItems(typeId);
      if (!res.success) throw new Error(res.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      
      let data = res.data || [];
      // กรองแยกประเภท อะไหล่ (1) และ ค่าบริการ (2) อย่างแม่นยำ
      data = data.filter((item: any) => Number(item.item_type_id) === typeId);

      if (searchText.trim()) {
        const s = searchText.toLowerCase();
        data = data.filter((item: any) => 
          (item.item_name || '').toLowerCase().includes(s) ||
          (item.item_code || '').toLowerCase().includes(s)
        );
      }
      setDevices(data);
    } catch (err: any) {
      console.error('Error fetching devices:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchText]);

  useFocusEffect(
    useCallback(() => {
      fetchDevices();
    }, [fetchDevices])
  );

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleOpenAddModal = () => {
    setItemToEdit(null);
    setModalVisible(true);
  };

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenEditModal = (item: any) => {
    setDetailsVisible(false);
    setItemToEdit(item);
    setModalVisible(true);
  };

  const handleDeleteItem = (item: any) => {
    setItemToDelete(item);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteItem(itemToDelete.item_id);
      if (!res.success) throw new Error(res.message || 'ล้มเหลวในการลบ');

      showAlert('สำเร็จ', 'ลบรายการเรียบร้อยแล้ว');
      setDetailsVisible(false);
      setSelectedItem(null);
      setDeleteModalVisible(false);
      setItemToDelete(null);
      fetchDevices();
    } catch (err: any) {
      console.error('Delete error:', err);
      showAlert('ล้มเหลว', err.message || 'ไม่สามารถลบรายการได้');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <Header subtitle="จัดการอะไหล่และค่าแรง" />

      <View className="flex-1 p-4">
        <SearchFilterBar
          value={searchText}
          onChangeText={setSearchText}
          onPressFilter={() => []}
        />

        <View className="flex-row bg-slate-200 rounded-lg p-1 mb-4">
          <TouchableOpacity
            className={`flex-1 py-2.5 items-center justify-center rounded-md ${
              activeTab === 'parts' ? 'bg-white shadow-sm shadow-black/10 elevation-2' : ''
            }`}
            onPress={() => setActiveTab('parts')}
          >
            <Text className={`font-body text-sm ${
              activeTab === 'parts' ? 'font-bold text-[#D32F2F] font-heading' : 'text-slate-500'
            }`}>
              อะไหล่
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 py-2.5 items-center justify-center rounded-md ${
              activeTab === 'services' ? 'bg-white shadow-sm shadow-black/10 elevation-2' : ''
            }`}
            onPress={() => setActiveTab('services')}
          >
            <Text className={`font-body text-sm ${
              activeTab === 'services' ? 'font-bold text-[#D32F2F] font-heading' : 'text-slate-500'
            }`}>
              ค่าบริการ
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View className="flex-1 justify-center items-center py-10">
            <ActivityIndicator size="large" color="#D32F2F" />
            <Text className="mt-3 font-body text-sm text-slate-500">กำลังโหลดข้อมูล...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
            <PartTable
              title={activeTab === 'parts' ? "รายการอะไหล่" : "รายการค่าบริการ"}
              data={devices}
              headerColor={activeTab === 'parts' ? "#6B4E00" : "#8B0000"}
              onPressDetails={(item) => {
                setSelectedItem(item);
                setDetailsVisible(true);
              }}
            />
          </ScrollView>
        )}
      </View>

      <FloatingActionButton onPress={handleOpenAddModal} />

      <AddPartModal
        visible={isModalVisible}
        itemToEdit={itemToEdit}
        onClose={() => {
          setModalVisible(false);
          setItemToEdit(null);
        }}
        onSuccess={fetchDevices}
      />

      <PartDetailsModal
        visible={isDetailsVisible}
        item={selectedItem}
        onClose={() => {
          setDetailsVisible(false);
          setSelectedItem(null);
        }}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteItem}
      />

      <ConfirmDeleteModal
        visible={deleteModalVisible}
        title="ยืนยันการลบรายการ"
        itemName={itemToDelete?.item_name}
        message="คุณต้องการลบรายการนี้ออกจากระบบอย่างถาวรหรือไม่?"
        confirmText="ลบรายการ"
        cancelText="ยกเลิก"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setItemToDelete(null);
        }}
      />
    </View>
  );
}
