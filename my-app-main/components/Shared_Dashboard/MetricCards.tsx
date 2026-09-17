// 1. React & React Native
import React from 'react';
import { Text, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface MetricCardsProps {
  totalRevenue?: number;
  totalJobs?: number;
  completedJobs?: number;
  pendingJobs?: number;
}

export default function MetricCards({
  totalRevenue = 0,
  totalJobs = 0,
  completedJobs = 0,
  pendingJobs = 0,
}: MetricCardsProps) {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `฿${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `฿${(amount / 1000).toFixed(1)}K`;
    return `฿${amount.toLocaleString()}`;
  };

  const metrics = [
    { title: 'รายได้รวม', value: formatCurrency(totalRevenue), icon: 'cash-outline', color: '#D62828' },
    { title: 'งานทั้งหมด', value: totalJobs.toLocaleString(), icon: 'briefcase-outline', color: '#0077B6' },
    { title: 'ซ่อมสำเร็จ', value: completedJobs.toLocaleString(), icon: 'checkmark-circle-outline', color: '#2D6A4F' },
    { title: 'รอดำเนินการ', value: pendingJobs.toLocaleString(), icon: 'time-outline', color: '#E85D04' },
  ];

  return (
    <View className="flex-row flex-wrap mx-4 justify-between">
      {metrics.map((item, index) => (
        <View key={index} className="w-[48%] bg-white p-4 rounded-xl border border-app-border mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-xs text-text-light font-heading font-medium">{item.title}</Text>
            <Ionicons name={item.icon as any} size={18} color={item.color} />
          </View>
          <Text className="text-xl font-bold text-text-dark font-heading">{item.value}</Text>
        </View>
      ))}
    </View>
  );
}