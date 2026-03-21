import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import { Calendar } from 'react-native-calendars';
import dayjs from 'dayjs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import apiClient from '@/services/api-client';
import { availableSlots } from '@/services/booking.service';
import { fetchPanchang } from '@/services/panchang.service';

interface BookingDateTimeProps {
    panditId: number;
    serviceId: number;
    onSelect?: (date: string, time: string) => void;
    onBack?: () => void;
}

export const BookingDateTime: React.FC<BookingDateTimeProps> = ({
    panditId,
    serviceId,
    onSelect,
    onBack
}) => {
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';
    const saffron = '#FF6F00';

    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [slots, setSlots] = useState<string[]>([]);
    const [panchangData, setPanchangData] = useState<any>(null);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [loadingPanchang, setLoadingPanchang] = useState(false);

    const loadData = useCallback(async (date: string) => {
        setLoadingSlots(true);
        setLoadingPanchang(true);
        try {
            // Concurrent fetching
            const [slotsRes, panchangRes] = await Promise.all([
                availableSlots(panditId, selectedDate, serviceId),
                fetchPanchang(date)
            ]);

            setSlots(slotsRes.data || []);
            setPanchangData(panchangRes);
            setSelectedTime(null); // Reset time on date change
        } catch (error) {
            console.error('Failed to load booking data:', error);
        } finally {
            setLoadingSlots(false);
            setLoadingPanchang(false);
        }
    }, [panditId, serviceId]);

    useEffect(() => {
        loadData(selectedDate);
    }, [selectedDate, loadData]);

    const handleDayPress = (day: any) => {
        setSelectedDate(day.dateString);
    };

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
            <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <TouchableOpacity onPress={onBack} className="p-2 -ml-2">
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text className="text-lg font-bold ml-2" style={{ color: colors.text }}>Select Date & Time</Text>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Calendar Section */}
                <View className="p-4 bg-white dark:bg-zinc-900 mx-4 mt-4 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800">
                    <Calendar
                        current={selectedDate}
                        onDayPress={handleDayPress}
                        markedDates={{
                            [selectedDate]: { selected: true, disableTouchEvent: true, selectedColor: saffron }
                        }}
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

                {/* Panchang Info */}
                <View className="p-4 mx-4 mt-4 rounded-2xl" style={{ backgroundColor: saffron + '10' }}>
                    <View className="flex-row items-center mb-3">
                        <Ionicons name="sunny-outline" size={20} color={saffron} />
                        <Text className="ml-2 font-bold text-base" style={{ color: saffron }}>Panchang Insight</Text>
                    </View>
                    
                    {loadingPanchang ? (
                        <ActivityIndicator color={saffron} size="small" />
                    ) : panchangData ? (
                        <View className="flex-row flex-wrap justify-between gap-y-3">
                            <View className="w-[48%]">
                                <Text className="text-xs text-gray-500 font-medium">Tithi</Text>
                                <Text className="font-semibold text-sm" style={{ color: colors.text }}>{panchangData.tithi || 'Shukla Ekadashi'}</Text>
                            </View>
                            <View className="w-[48%]">
                                <Text className="text-xs text-gray-500 font-medium">Nakshatra</Text>
                                <Text className="font-semibold text-sm" style={{ color: colors.text }}>{panchangData.nakshatra || 'Pushya'}</Text>
                            </View>
                            <View className="w-[48%]">
                                <Text className="text-xs text-gray-500 font-medium">Muhurta</Text>
                                <Text className="font-semibold text-sm" style={{ color: saffron }}>{panchangData.muhurta || 'Abhijit Muhurta'}</Text>
                            </View>
                            <View className="w-[48%]">
                                <Text className="text-xs text-gray-500 font-medium">Status</Text>
                                <Text className="font-semibold text-sm text-green-600">Auspicious Day</Text>
                            </View>
                        </View>
                    ) : (
                        <Text className="text-gray-400 text-xs italic">Unable to load panchang data for this day.</Text>
                    )}
                </View>

                {/* Time Slots */}
                <View className="px-5 mt-6">
                    <Text className="text-lg font-bold mb-4" style={{ color: colors.text }}>Available Slots</Text>
                    
                    {loadingSlots ? (
                        <ActivityIndicator color={saffron} style={{ marginTop: 20 }} />
                    ) : slots.length > 0 ? (
                        <View className="flex-row flex-wrap gap-3">
                            {slots.map((time) => (
                                <TouchableOpacity
                                    key={time}
                                    onPress={() => setSelectedTime(time)}
                                    className={`px-4 py-3 rounded-xl border flex-row items-center gap-2 ${selectedTime === time ? 'border-[transparent]' : 'border-gray-200 dark:border-zinc-800'}`}
                                    style={{ 
                                        backgroundColor: selectedTime === time ? saffron : (isDark ? '#18181b' : '#ffffff'),
                                        width: '30%'
                                    }}
                                >
                                    <Ionicons 
                                        name="time-outline" 
                                        size={16} 
                                        color={selectedTime === time ? 'white' : colors.text} 
                                    />
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
                        <View className="items-center py-8 bg-gray-50 dark:bg-zinc-900 rounded-2xl">
                            <Ionicons name="calendar-outline" size={32} color={isDark ? '#333' : '#ddd'} />
                            <Text className="text-gray-400 mt-2">No slots available for this date.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <View className="absolute bottom-0 w-full p-4 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800">
                <TouchableOpacity
                    disabled={!selectedTime}
                    onPress={() => onSelect?.(selectedDate, selectedTime!)}
                    className={`py-4 rounded-2xl items-center ${!selectedTime ? 'opacity-50' : ''}`}
                    style={{ backgroundColor: saffron }}
                >
                    <Text className="text-white font-bold text-lg">Confirm Booking</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};
