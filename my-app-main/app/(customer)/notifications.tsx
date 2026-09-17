import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function NotificationsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar style="light" backgroundColor="#D32F2F" />
      <View className="bg-[#D32F2F] pt-4 pb-6 px-5 rounded-b-3xl mb-4">
        <Text className="text-white text-xl font-bold font-heading">IT VERTEX</Text>
        <Text className="text-red-100 text-sm font-body mt-1">การแจ้งเตือน</Text>
      </View>
      
      <View className="flex-1 justify-center items-center px-6">
        <Ionicons name="notifications-off-outline" size={80} color="#cbd5e1" />
        <Text className="text-slate-400 font-body text-center mt-6 text-base">ไม่มีการแจ้งเตือนใหม่ในขณะนี้</Text>
      </View>
    </SafeAreaView>
  );
}
