import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Platform, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import dayjs from 'dayjs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { availableSlots } from '@/services/booking.service';
import { fetchPanchang } from '@/services/panchang.service';

/**
 * CLEAN DATETIME BOOKING SCREEN
 * 
 * Requirements:
 * - react-native-calendars
 * - API: GET /api/bookings/available_slots/
 * - Panchang: GET /api/panchang/data/
 * - NativeWind + Saffron theme
 */
export default function BookingDateTimeScreen() {
    const { colors, theme } = useTheme();
    const router = useRouter();
    const params = useLocalSearchParams();
    const isDark = theme === 'dark';
    const saffron = '#FF6F00';

    // Get panditId and serviceId from navigation params
    const panditId = Number(params.panditId);
    const serviceId = Number(params.serviceId);
    const panditName = params.panditName as string;

    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [slots, setSlots] = useState<string[]>([]);
    const [panchangData, setPanchangData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const loadData = useCallback(async (date: string) => {
        if (!panditId || !serviceId) return;
        setLoading(true);
        try {
            const [slotsRes, panchangRes] = await Promise.all([
                availableSlots(panditId, date, serviceId),
                fetchPanchang(date)
            ]);

            setSlots(slotsRes.data || []);
            setPanchangData(panchangRes);
        } catch (error) {
            console.error('Failed to load booking data:', error);
            Alert.alert('Error', 'Unable to fetch available slots.');
        } finally {
            setLoading(false);
        }
    }, [panditId, serviceId]);

    useEffect(() => {
        loadData(selectedDate);
    }, [selectedDate, loadData]);

    const handleConfirm = () => {
        if (selectedDate && selectedTime) {
            // Proceed to next step (e.g., location/address)
            router.push({
                pathname: '/(customer)/booking',
                params: {
                    ...params,
                    selectedDate,
                    selectedTime,
                    step: 'details' 
                }
            });
        }
    };

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
            {/* Header */}
            <View 
                className="flex-row items-center px-4 py-4 border-b"
                style={{ backgroundColor: colors.card, borderBottomColor: isDark ? '#333' : '#F3F4F6' }}
            >
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View className="ml-2">
                    <Text className="text-lg font-bold" style={{ color: colors.text }}>Booking Schedule</Text>
                    {panditName && <Text className="text-xs opacity-60" style={{ color: colors.text }}>with {panditName}</Text>}
                </View>
            </View>

            <ScrollView 
                className="flex-1" 
                contentContainerStyle={{ paddingBottom: 110 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Calendar Card */}
                <View 
                    className="m-4 p-4 rounded-3xl shadow-sm border overflow-hidden"
                    style={{ 
                        backgroundColor: colors.card, 
                        borderColor: isDark ? '#333' : '#F3F4F6',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05,
                        shadowRadius: 10,
                        elevation: 2
                    }}
                >
                    <Calendar
                        current={selectedDate}
                        onDayPress={(day: any) => setSelectedDate(day.dateString)}
                        markedDates={{
                            [selectedDate]: { selected: true, selectedColor: saffron, selectedTextColor: '#FFF' }
                        }}
                        minDate={dayjs().format('YYYY-MM-DD')}
                        theme={{
                            backgroundColor: 'transparent',
                            calendarBackground: 'transparent',
                            textSectionTitleColor: isDark ? '#9ca3af' : '#4b5563',
                            selectedDayBackgroundColor: saffron,
                            selectedDayTextColor: '#ffffff',
                            todayTextColor: saffron,
                            dayTextColor: isDark ? '#e5e7eb' : '#1f2937',
                            textDisabledColor: isDark ? '#3f3f46' : '#d1d5db',
                            dotColor: saffron,
                            selectedDotColor: '#ffffff',
                            arrowColor: saffron,
                            monthTextColor: isDark ? '#f9fafb' : '#111827',
                            indicatorColor: saffron,
                            textDayFontWeight: '500',
                            textMonthFontWeight: 'bold',
                            textDayHeaderFontWeight: '600'
                        }}
                    />
                </View>

                {/* Panchang Highlight */}
                <View className="mx-4 p-5 rounded-2xl" style={{ backgroundColor: saffron + '08' }}>
                    <View className="flex-row items-center mb-4">
                        <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: saffron + '20' }}>
                            <Ionicons name="sparkles" size={16} color={saffron} />
                        </View>
                        <Text className="text-base font-bold" style={{ color: saffron }}>Panchang for {dayjs(selectedDate).format('MMM D')}</Text>
                    </View>
                    
                    {loading ? (
                        <ActivityIndicator color={saffron} size="small" />
                    ) : panchangData ? (
                        <View className="flex-row flex-wrap justify-between gap-y-4">
                            <PanchangItem label="Tithi" value={panchangData.tithi} icon="moon-outline" />
                            <PanchangItem label="Nakshatra" value={panchangData.nakshatra} icon="star-outline" />
                            <PanchangItem label="Yoga" value={panchangData.yoga} icon="infinite-outline" />
                            <PanchangItem label="Sun Rise" value={panchangData.sunrise} icon="sunny-outline" />
                        </View>
                    ) : (
                        <Text className="text-gray-400 text-xs italic">Auspicious timing details loading...</Text>
                    )}
                </View>

                {/* Time Slots */}
                <View className="mt-8 px-5">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-lg font-bold" style={{ color: colors.text }}>Select a Slot</Text>
                        <Text className="text-xs opacity-50" style={{ color: colors.text }}>{slots.length} available</Text>
                    </View>
                    
                    {loading ? (
                        <ActivityIndicator color={saffron} className="mt-8" />
                    ) : slots.length > 0 ? (
                        <View className="flex-row flex-wrap gap-3">
                            {slots.map((time) => (
                                <TouchableOpacity
                                    key={time}
                                    onPress={() => setSelectedTime(time)}
                                    className={`px-4 py-3 rounded-xl border flex-row items-center justify-center gap-2 ${selectedTime === time ? 'border-[transparent]' : 'border-gray-200 dark:border-zinc-800'}`}
                                    style={{ 
                                        backgroundColor: selectedTime === time ? saffron : colors.card,
                                        width: '30%'
                                    }}
                                >
                                    <Text 
                                        className={`font-bold text-xs ${selectedTime === time ? 'text-white' : ''}`}
                                        style={{ color: selectedTime === time ? 'white' : colors.text }}
                                    >
                                        {time}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View className="items-center py-10 bg-gray-50 dark:bg-zinc-900 rounded-2xl">
                            <Ionicons name="cloud-offline-outline" size={32} color={isDark ? '#333' : '#ddd'} />
                            <Text className="text-gray-400 mt-2">No available slots for this date.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Button */}
            <View 
                className="absolute bottom-0 w-full p-5 border-t"
                style={{ backgroundColor: colors.card, borderTopColor: isDark ? '#333' : '#F3F4F6' }}
            >
                <TouchableOpacity
                    disabled={!selectedTime}
                    onPress={handleConfirm}
                    className={`h-14 rounded-2xl items-center justify-center shadow-lg ${!selectedTime ? 'opacity-50' : ''}`}
                    style={{ backgroundColor: saffron, shadowColor: saffron }}
                >
                    <Text className="text-white font-extrabold text-lg">Continue to Details</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const PanchangItem = ({ label, value, icon }: { label: string, value: string, icon: any }) => {
    const { colors } = useTheme();
    return (
        <View className="w-[48%] flex-row items-start gap-2">
            <Ionicons name={icon} size={14} color="#666" style={{ marginTop: 2 }} />
            <View>
                <Text className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{label}</Text>
                <Text className="font-semibold text-sm leading-tight" style={{ color: colors.text }}>{value || 'Loading...'}</Text>
            </View>
        </View>
    );
};
