// 1. React & React Native
import { Text, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface StaffTableProps {
    title: string;
    data: any[];
    headerColor: string;
    onPressDetails?: (item: any) => void;
}

export default function StaffTable({ title, data, headerColor, onPressDetails }: StaffTableProps) {
    return (
        <View className="bg-white mb-6 rounded-lg overflow-hidden border border-slate-200">
            <View className="py-2.5 px-4" style={{ backgroundColor: headerColor }}>
                <Text className="text-white font-bold text-base">{title}</Text>
            </View>

            <View className="flex-row bg-slate-100 py-2 px-4 border-b border-slate-200">
                <Text className="font-bold text-[13px] text-slate-800" style={{ flex: 2 }}>ชื่อพนักงาน</Text>
                <Text className="font-bold text-[13px] text-slate-800 text-right" style={{ flex: 1.2 }}>ตำแหน่ง</Text>
                {onPressDetails && (
                    <Text className="font-bold text-[13px] text-slate-800 text-right w-[55px]">จัดการ</Text>
                )}
            </View>

            {data.map((item, index) => {
                const getRoleColors = (role: string) => {
                    switch (role) {
                        case 'ช่าง':
                            return { bg: 'rgba(247, 127, 0, 0.1)', text: '#F77F00' };
                        case 'ผู้จัดการ':
                            return { bg: 'rgba(214, 40, 40, 0.1)', text: '#D62828' };
                        case 'ลูกค้า':
                            return { bg: 'rgba(40, 167, 69, 0.1)', text: '#28A745' };
                        case 'พนักงาน':
                        default:
                            return { bg: 'rgba(0, 119, 182, 0.1)', text: '#0077B6' };
                    }
                };
                const roleColor = getRoleColors(item.role);

                return (
                    <View key={item.id} className={`flex-row py-3 px-4 bg-white ${index === data.length - 1 ? '' : 'border-b border-slate-200'}`}>
                        <View style={{ flex: 2 }}>
                            <Text className="font-bold text-sm text-slate-800" numberOfLines={1}>{item.name}</Text>
                            <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
                              {[item.phone, item.email].filter(Boolean).join(' · ')}
                            </Text>
                        </View>
                        <View style={{ flex: 1.2, alignItems: 'flex-end', justifyContent: 'center' }}>
                            <View className="px-2 py-0.5 rounded-xl" style={{ backgroundColor: roleColor.bg }}>
                                <Text className="font-bold text-[11px]" style={{ color: roleColor.text }}>
                                    {item.role}
                                </Text>
                            </View>
                        </View>
                        {onPressDetails && (
                            <TouchableOpacity 
                                className="w-[55px] items-end justify-center" 
                                onPress={() => onPressDetails(item)}
                            >
                                <Ionicons name="create-outline" size={20} color="#00B4D8" />
                            </TouchableOpacity>
                        )}
                    </View>
                );
            })}
        </View>
    );
}
