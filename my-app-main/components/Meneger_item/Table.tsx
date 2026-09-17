// 1. React & React Native
import { Text, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface PartTableProps {
    title: string;
    data: any[];
    headerColor: string;
    onPressDetails?: (item: any) => void;
}

export default function PartTable({ title, data, headerColor, onPressDetails }: PartTableProps) {
    return (
        <View className="bg-white mb-6 rounded-lg overflow-hidden border border-slate-200">
            <View className="py-2.5 px-4" style={{ backgroundColor: headerColor }}>
                <Text className="text-white font-bold text-base">{title}</Text>
            </View>

            <View className="flex-row bg-slate-100 py-2 px-4 border-b border-slate-200">
                <Text className="font-bold text-[13px] text-slate-800" style={{ flex: 2 }}>ชื่อรายการ</Text>
                <Text className="font-bold text-[13px] text-slate-800 text-right" style={{ flex: 1.2 }}>ราคา (บาท)</Text>
                {onPressDetails && (
                    <Text className="font-bold text-[13px] text-slate-800 text-right w-[50px]">จัดการ</Text>
                )}
            </View>

            {data.map((item, index) => (
                <View key={item.item_id} className={`flex-row py-3 px-4 bg-white ${index === data.length - 1 ? '' : 'border-b border-slate-200'}`}>
                    <Text className="text-sm text-slate-800" style={{ flex: 2 }} numberOfLines={2}>{item.item_name}</Text>
                    <Text className="text-sm text-slate-800 text-right" style={{ flex: 1.2 }}>
                        {item.selling_price ? item.selling_price.toLocaleString() : '-'}
                    </Text>
                    {onPressDetails && (
                        <TouchableOpacity 
                            className="w-[50px] items-end justify-center" 
                            onPress={() => onPressDetails(item)}
                        >
                            <Ionicons name="eye-outline" size={20} color="#00B4D8" />
                        </TouchableOpacity>
                    )}
                </View>
            ))}
        </View>
    );
}