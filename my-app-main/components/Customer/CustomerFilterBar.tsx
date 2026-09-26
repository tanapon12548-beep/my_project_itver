// 1. React & React Native
import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import type { CustomerFilterTab } from './CustomerHeader';

interface CustomerFilterBarProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  activeTab: CustomerFilterTab;
  onSelectTab: (tab: CustomerFilterTab) => void;
}

const TABS: { key: CustomerFilterTab; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'in_progress', label: 'กำลังดำเนินการ' },
  { key: 'pending_approval', label: 'รออนุมัติราคา' },
  { key: 'completed', label: 'เสร็จสิ้น' },
];

export default function CustomerFilterBar({
  searchQuery,
  onSearchChange,
  activeTab,
  onSelectTab,
}: CustomerFilterBarProps) {
  return (
    <View className="mb-3">
      {/* Search Bar */}
      <View className="flex-row items-center bg-white rounded-xl px-3 py-2 border border-slate-200 mb-3 shadow-sm">
        <Ionicons name="search-outline" size={18} color="#94A3B8" />
        <TextInput
          placeholder="ค้นหาตามเลขงาน, อุปกรณ์ หรืออาการเสีย..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={onSearchChange}
          className="flex-1 ml-2 text-sm text-slate-800 font-body py-0"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <Ionicons name="close-circle" size={16} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Tab Pills */}
      <View className="flex-row items-center gap-1.5">
        {TABS.map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.8}
              onPress={() => onSelectTab(tab.key)}
              className={`min-h-[44px] justify-center px-4 py-2 rounded-full border ${
                isSelected
                  ? 'bg-[#DC2626] border-[#DC2626]'
                  : 'bg-white border-slate-200 active:bg-slate-50'
              }`}
            >
              <Text
                className={`text-xs font-heading ${
                  isSelected ? 'text-white font-bold' : 'text-slate-600'
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
