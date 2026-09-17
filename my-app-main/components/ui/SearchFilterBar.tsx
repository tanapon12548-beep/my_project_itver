// 1. React & React Native
import { TextInput, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface SearchFilterBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onPressFilter?: () => void;
  showFilter?: boolean;
}

export default function SearchFilterBar({ 
  value, 
  onChangeText, 
  onPressFilter,
  showFilter = false 
}: SearchFilterBarProps) {
  return (
    <View className="flex-row gap-3 mb-4">
      {/* ช่องค้นหา */}
      <View className="flex-1 flex-row items-center bg-white border border-slate-200 rounded-lg px-3 h-11">
        <Ionicons name="search" size={20} color="#94A3B8" />
        <TextInput
          className="flex-1 ml-2 text-sm text-slate-800 h-full"
          placeholder="ค้นหารายการ..."
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={onChangeText}
        />
      </View>

      {/* ปุ่มกรอง (3 ขีด) - ซ่อนไว้ชั่วคราวแต่เก็บโค้ดไว้เผื่อเปิดใช้งานภายหลัง */}
      {showFilter && (
        <TouchableOpacity className="w-11 h-11 bg-white border border-slate-200 rounded-lg justify-center items-center" onPress={onPressFilter}>
          <Ionicons name="filter" size={20} color="#1E293B" />
        </TouchableOpacity>
      )}
    </View>
  );
}