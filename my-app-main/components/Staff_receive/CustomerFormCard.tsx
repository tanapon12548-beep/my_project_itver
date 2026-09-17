// 1. React & React Native
import { useState, useRef } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

// 3. API helpers
import { lookupProfiles } from '@/lib/api';

export interface ProfileSuggestion {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
}

interface CustomerFormCardProps {
  customerName: string;
  onChangeCustomerName: (text: string) => void;
  phone: string;
  onChangePhone: (text: string) => void;
  email: string;
  onChangeEmail: (text: string) => void;
  selectedCustomerId?: string | null;
  onSelectCustomer?: (profile: ProfileSuggestion) => void;
  onClearCustomer?: () => void;
}

export default function CustomerFormCard({
  customerName,
  onChangeCustomerName,
  phone,
  onChangePhone,
  email,
  onChangeEmail,
  selectedCustomerId,
  onSelectCustomer,
  onClearCustomer,
}: CustomerFormCardProps) {
  const [suggestions, setSuggestions] = useState<ProfileSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSearchType, setActiveSearchType] = useState<'name' | 'phone' | null>(null);
  const debounceTimerRef = useRef<any>(null);

  // Search profiles from Backend API with 300ms Debounce
  const searchProfiles = (query: string, type: 'name' | 'phone') => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        setActiveSearchType(type);

        const response = await lookupProfiles(query.trim(), type);

        if (response.success && response.data && response.data.length > 0) {
          setSuggestions(response.data);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error('Search profiles error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelectSuggestion = (item: ProfileSuggestion) => {
    const fullName = `${item.first_name || ''} ${item.last_name || ''}`.trim();
    onChangeCustomerName(fullName);
    if (item.phone) onChangePhone(item.phone);
    if (item.email) onChangeEmail(item.email);
    onSelectCustomer?.(item);
    setShowSuggestions(false);
  };

  return (
    <View className="bg-white rounded-2xl overflow-hidden mb-4 border border-blue-50 shadow-sm shadow-black/5 elevation-2">
      {/* Header */}
      <View className="bg-blue-50 px-4 py-2.5 flex-row items-center justify-between">
        <Text className="text-sm font-bold text-blue-800">ข้อมูลลูกค้า (เลือกจากระบบสมาชิก) *</Text>
        {selectedCustomerId ? (
          <View className="flex-row items-center bg-emerald-100 px-2 py-0.5 rounded-full">
            <Ionicons name="checkmark-circle" size={14} color="#059669" />
            <Text className="text-[11px] font-bold text-emerald-800 ml-1">เลือกลูกค้าแล้ว</Text>
          </View>
        ) : (
          <View className="flex-row items-center bg-amber-100 px-2 py-0.5 rounded-full">
            <Ionicons name="alert-circle" size={14} color="#D97706" />
            <Text className="text-[11px] font-bold text-amber-800 ml-1">ต้องเลือกลูกค้า</Text>
          </View>
        )}
      </View>

      <View className="p-4 flex-col gap-3">
        {selectedCustomerId && (
          <View className="flex-row items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl mb-1">
            <View className="flex-row items-center flex-1 mr-2">
              <Ionicons name="person-circle" size={24} color="#059669" />
              <View className="ml-2 flex-1">
                <Text className="text-xs font-bold text-emerald-900" numberOfLines={1}>
                  {customerName}
                </Text>
                <Text className="text-[11px] text-emerald-700">
                  โทร: {phone || '-'}
                </Text>
              </View>
            </View>
            {onClearCustomer && (
              <TouchableOpacity
                onPress={onClearCustomer}
                className="px-2.5 py-1 bg-white border border-emerald-300 rounded-lg"
              >
                <Text className="text-xs text-emerald-800 font-medium">เปลี่ยน</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {/* Full Name Input with Autocomplete */}
        <View className="flex-col gap-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-slate-500">ชื่อ-นามสกุล</Text>
            {loading && activeSearchType === 'name' && (
              <ActivityIndicator size="small" color="#D32F2F" />
            )}
          </View>
          <TextInput
            className="h-[42px] border border-slate-200 rounded-lg px-3 text-sm text-slate-800 bg-white"
            value={customerName}
            onChangeText={(text) => {
              onChangeCustomerName(text);
              searchProfiles(text, 'name');
            }}
            placeholder="พิมพ์ชื่อเพื่อค้นหา เช่น สมชาย..."
            placeholderTextColor="#A0A0A0"
          />
        </View>

        {/* Phone Input with Autocomplete */}
        <View className="flex-col gap-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-slate-500">เบอร์โทรศัพท์</Text>
            {loading && activeSearchType === 'phone' && (
              <ActivityIndicator size="small" color="#D32F2F" />
            )}
          </View>
          <TextInput
            className="h-[42px] border border-slate-200 rounded-lg px-3 text-sm text-slate-800 bg-white"
            value={phone}
            onChangeText={(text) => {
              const digits = text.replace(/[^0-9]/g, '').slice(0, 10);
              onChangePhone(digits);
              searchProfiles(digits, 'phone');
            }}
            placeholder="พิมพ์เบอร์โทร เช่น 081..."
            placeholderTextColor="#A0A0A0"
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        {/* Email */}
        <View className="flex-col gap-1">
          <Text className="text-xs text-slate-500">อีเมล</Text>
          <TextInput
            className="h-[42px] border border-slate-200 rounded-lg px-3 text-sm text-slate-800 bg-white"
            value={email}
            onChangeText={(text) => onChangeEmail(text.trim())}
            placeholder="example@email.com"
            placeholderTextColor="#A0A0A0"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Suggestions Dropdown List */}
        {showSuggestions && suggestions.length > 0 && (
          <View className="mt-1 bg-slate-50 rounded-xl border border-sky-200 overflow-hidden">
            <View className="flex-row items-center gap-1.5 bg-sky-100 px-3 py-1.5">
              <Ionicons name="people-outline" size={14} color="#0055A5" />
              <Text className="text-[11px] font-bold text-sky-700">พบลายชื่อสมาชิกในระบบ (แตะเพื่อเติมข้อมูลอัตโนมัติ)</Text>
            </View>

            {suggestions.map((item) => {
              const fullName = `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'ไม่ระบุชื่อ';
              return (
                <TouchableOpacity
                  key={item.id}
                  className="flex-row items-center p-2.5 border-b border-slate-100 gap-2.5"
                  activeOpacity={0.7}
                  onPress={() => handleSelectSuggestion(item)}
                >
                  <View className="w-7 h-7 rounded-full bg-orange-100 items-center justify-center">
                    <Ionicons name="person" size={14} color="#D32F2F" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[13px] font-bold text-slate-800">{fullName}</Text>
                    <Text className="text-[11px] text-slate-500 mt-0.5">
                      📱 {item.phone || '-'}  •  ✉️ {item.email || '-'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}
