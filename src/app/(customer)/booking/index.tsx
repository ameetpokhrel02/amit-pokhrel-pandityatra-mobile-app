import React, { useState, useEffect } from 'react'; // Refreshed for routing
 // Refreshed for routing
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from 'react-native-ui-datepicker';
import { Calendar } from 'react-native-calendars';
import { fetchPanchang } from '@/services/panchang.service';
import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import localeData from 'dayjs/plugin/localeData';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import { useTheme } from '@/store/ThemeContext';
import { getPanditSummary } from '@/services/pandit.service';
import { getImageUrl } from '@/utils/image';
import { createBooking, availableSlots as fetchAvailableSlots } from '@/services/booking.service';
import { initiatePayment, PaymentIntentResponse } from '@/services/payment.service';
import { Booking, PanditService, Pandit, SamagriItem } from '@/services/api';
import { fetchPujaSamagriRecommendations } from '@/services/recommender.service';
import { getSamagriRequirements } from '@/services/samagri.service';
import { Image } from 'expo-image';
import { BookingDateTime } from '@/components/booking/BookingDateTime';
import { LazyLoader } from '@/components/ui/LazyLoader';

const MapLocationPicker = React.lazy(() => import('@/components/ui/MapLocationPicker'));
const LottieAnimation = React.lazy(() =>
  import('@/components/ui/LottieAnimation').then(m => ({ default: m.LottieAnimation }))
);

dayjs.extend(calendar);
dayjs.extend(localeData);
dayjs.extend(localizedFormat);

const STEPS = ['Service', 'Date & Time', 'Address', 'Review'];

export default function BookingScreen() {
  const { panditId, serviceId } = useLocalSearchParams();
  const router = useRouter();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [pandit, setPandit] = useState<Pandit | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentIntentResponse | null>(null);

  // Form State
  const [selectedService, setSelectedService] = useState<PanditService | null>(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedTime, setSelectedTime] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [recommendations, setRecommendations] = useState<SamagriItem[]>([]);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [panchangData, setPanchangData] = useState<any>(null);
  const [loadingPanchang, setLoadingPanchang] = useState(false);

  useEffect(() => {
    const loadPandit = async () => {
      if (typeof panditId === 'string') {
        const response = await getPanditSummary(Number(panditId));
        const data = response.data;
        setPandit(data || null);

        // Pre-select service if serviceId is provided
        if (data?.services && serviceId) {
          const service = data.services.find((s: PanditService) => s.id === Number(serviceId));
          if (service) {
            setSelectedService(service);
          }
        }
      }
    };
    loadPandit();
  }, [panditId, serviceId]);

  const handleNext = () => {
    if (currentStep === 0 && !selectedService) {
      Alert.alert('Required', 'Please select a service');
      return;
    }
    if (currentStep === 1 && (!selectedDate || !selectedTime)) {
      Alert.alert('Required', 'Please select date and time');
      return;
    }
    if (currentStep === 2 && !address) {
      Alert.alert('Required', 'Please enter address');
      return;
    }

    if (currentStep < STEPS.length - 1) {
      if (currentStep === 0 && selectedService) {
        // Fetch requirement mappings and initial slots
        loadRequirements(selectedService.puja_details.id);
        loadSlots(dayjs(selectedDate).format('YYYY-MM-DD'));
      }
      if (currentStep === 2 && selectedService) {
        loadRecommendations(selectedService.puja_details.id);
      }
      setCurrentStep(currentStep + 1);
    } else {
      handleBooking();
    }
  };

  const loadRecommendations = async (pujaId: number) => {
    try {
      setLoadingRecs(true);
      const response = await fetchPujaSamagriRecommendations(pujaId);
      const data = response.data;
      setRecommendations(data.recommendations || data || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoadingRecs(false);
    }
  };

  const loadRequirements = async (pujaId: number) => {
    try {
      setLoadingReqs(true);
      const response = await getSamagriRequirements({ puja_id: pujaId });
      setRequirements(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching requirements:', error);
    } finally {
      setLoadingReqs(false);
    }
  };

  const loadSlots = async (dateStr: string) => {
    if (!panditId) return;
    try {
      setLoadingSlots(true);
      setLoadingPanchang(true);
      
      const [slotsRes, panchangRes] = await Promise.all([
        fetchAvailableSlots(Number(panditId), dateStr, selectedService?.puja_details?.id as number),
        fetchPanchang(dateStr)
      ]);
      
      setAvailableSlots(slotsRes.data || []);
      setPanchangData(panchangRes);
      
      if (slotsRes.data?.length > 0 && !slotsRes.data.includes(selectedTime)) {
        setSelectedTime(slotsRes.data[0]);
      }
    } catch (error) {
      console.error('Error fetching booking data:', error);
    } finally {
      setLoadingSlots(false);
      setLoadingPanchang(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleBooking = async () => {
    if (!pandit || !selectedService) return;

    try {
      setIsSubmitting(true);

      // 1️⃣ Create booking on backend
      const bookingPayload: any = {
        pandit: pandit.id,
        service: selectedService.id,
        booking_date: dayjs(selectedDate).format('YYYY-MM-DD'),
        booking_time: selectedTime,
        location: address,
        notes,
      };

      const response = await createBooking(bookingPayload);
      const booking = response.data;

      // Save just the booking ID to state so we can pass it to the success screen
      setPaymentInfo({ payment_url: '', pidx: '', bookingId: booking.id } as any);
      setIsSuccess(true);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not complete booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <View style={[styles.successContainer, { backgroundColor: colors.background }]}>
      <LazyLoader height={styles.lottie.height}>
        <LottieAnimation
          source={require('@/assets/animations/success.json')} // Make sure this file exists or use a placeholder
          autoPlay
          loop={false}
          style={styles.lottie}
        />
      </LazyLoader>
      <View>
        <Text style={[styles.successTitle, { color: colors.text }]}>Booking Created</Text>
        <Text style={[styles.successMessage, { color: isDark ? '#AAA' : '#666' }]}>
          Your booking with {pandit?.user_details?.full_name} for {selectedService?.puja_details?.name} has been created.
        </Text>

        <Text style={[styles.successMessage, { color: isDark ? '#A7F3D0' : '#047857' }]}>
          Please complete your payment to finalize the booking.
        </Text>

        <View className="w-full gap-3 mt-4">
          <TouchableOpacity
            className="w-full h-14 bg-primary rounded-2xl items-center justify-center shadow-lg shadow-primary/30 active:opacity-80"
            onPress={() => router.replace(`/(customer)/payments/checkout?bookingId=${(paymentInfo as any)?.bookingId}`)}
          >
            <Text className="text-white text-lg font-bold">Pay Now</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="w-full h-14 border-2 border-primary rounded-2xl items-center justify-center active:bg-primary/5"
            onPress={() => router.push('/(customer)/bookings')}
          >
            <Text className="text-primary text-lg font-bold">View My Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-full h-14 bg-zinc-100 dark:bg-zinc-800 rounded-2xl items-center justify-center active:opacity-70"
            onPress={() => router.replace('/(customer)/' as any)}
          >
            <Text className="text-zinc-600 dark:text-zinc-300 text-lg font-bold">Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Book Puja</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { backgroundColor: colors.card }]}>
        {STEPS.map((step, index) => (
          <View key={index} style={styles.stepWrapper}>
            <View style={[
              styles.stepCircle,
              { backgroundColor: isDark ? '#333' : '#F0F0F0' },
              index <= currentStep && { backgroundColor: colors.primary },
              index < currentStep && styles.stepCircleCompleted
            ]}>
              {index < currentStep ? (
                <Ionicons name="checkmark" size={16} color="#FFF" />
              ) : (
                <Text style={[styles.stepNumber, { color: isDark ? '#AAA' : '#999' }, index <= currentStep && styles.stepNumberActive]}>
                  {index + 1}
                </Text>
              )}
            </View>
            <Text style={[styles.stepLabel, { color: isDark ? '#AAA' : '#999' }, index <= currentStep && { color: colors.primary, fontWeight: '600' }]}>
              {step}
            </Text>
            {index < STEPS.length - 1 && (
              <View style={[styles.stepLine, { backgroundColor: isDark ? '#333' : '#F0F0F0' }, index < currentStep && styles.stepLineActive]} />
            )}
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
          {currentStep === 0 && (
            <View key="step0">
              <Text style={[styles.stepTitle, { color: colors.text }]}>Select Puja Service</Text>
              <View className="gap-4">
                {pandit?.services?.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    className={`flex-row items-center p-3 rounded-3xl border mb-1 active:opacity-70 ${selectedService?.id === service.id ? 'border-primary ring-2 ring-primary/20' : 'border-gray-100 dark:border-zinc-800'}`}
                    style={{ backgroundColor: colors.card }}
                    onPress={() => setSelectedService(service)}
                  >
                    <Image 
                      source={{ uri: getImageUrl(service.puja_details?.image) || 'https://images.unsplash.com/photo-1544158404-585ff67ece33?q=80&w=300' }} 
                      style={styles.serviceImage} 
                      contentFit="cover"
                    />
                    <View className="flex-1 ml-4 justify-center">
                      <Text 
                        className="text-base font-bold leading-tight"
                        style={{ color: colors.text }}
                      >
                        {service.puja_details?.name}
                      </Text>
                      <View className="flex-row items-center mt-1 gap-3">
                         <View className="flex-row items-center gap-1">
                            <Ionicons name="time-outline" size={12} color={colors.primary} />
                            <Text className="text-[11px] opacity-60" style={{ color: colors.text }}>{service.duration_minutes} min</Text>
                         </View>
                         <View className="flex-row items-center gap-1">
                            <Ionicons name="cash-outline" size={12} color="#10B981" />
                            <Text className="text-[11px] font-bold text-emerald-600">NPR {service.custom_price}</Text>
                         </View>
                      </View>
                    </View>
                    <View 
                      className="w-6 h-6 rounded-full border-2 items-center justify-center mr-2"
                      style={{ borderColor: selectedService?.id === service.id ? colors.primary : (isDark ? '#444' : '#E5E7EB') }}
                    >
                      {selectedService?.id === service.id && (
                        <View className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.primary }} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {currentStep === 1 && (
            <View key="step1">
              <Text style={[styles.stepTitle, { color: colors.text }]}>Schedule Puja</Text>

              <Text style={[styles.subLabel, { color: colors.text }]}>Select Date</Text>
              <View 
                className="rounded-3xl border overflow-hidden mb-6"
                style={{ backgroundColor: colors.card, borderColor: isDark ? '#333' : '#F3F4F6' }}
              >
                <Calendar
                  current={selectedDate.format('YYYY-MM-DD')}
                  onDayPress={(day: any) => {
                    const newDate = dayjs(day.dateString);
                    setSelectedDate(newDate);
                    loadSlots(day.dateString);
                  }}
                  markedDates={{
                    [selectedDate.format('YYYY-MM-DD')]: { selected: true, selectedColor: colors.primary, selectedTextColor: '#FFF' }
                  }}
                  minDate={dayjs().format('YYYY-MM-DD')}
                  theme={{
                    backgroundColor: 'transparent',
                    calendarBackground: 'transparent',
                    textSectionTitleColor: isDark ? '#9ca3af' : '#4b5563',
                    selectedDayBackgroundColor: colors.primary,
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: colors.primary,
                    dayTextColor: isDark ? '#e5e7eb' : '#1f2937',
                    textDisabledColor: isDark ? '#222' : '#d1d5db',
                    dotColor: colors.primary,
                    arrowColor: colors.primary,
                    monthTextColor: isDark ? '#f9fafb' : '#111827',
                    indicatorColor: colors.primary,
                    textDayFontWeight: '500',
                    textMonthFontWeight: 'bold',
                    textDayHeaderFontWeight: '600'
                  }}
                />
              </View>

              {/* Panchang Insight */}
              <View 
                 className="p-5 rounded-3xl mb-6 flex-row items-center gap-4" 
                 style={{ backgroundColor: colors.primary + '10', borderLeftWidth: 4, borderLeftColor: colors.primary }}
              >
                 <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary + '20' }}>
                    <Ionicons name="sparkles" size={20} color={colors.primary} />
                 </View>
                 <View className="flex-1">
                    <Text className="text-xs font-bold uppercase tracking-wider opacity-60" style={{ color: colors.primary }}>Auspicious Timing</Text>
                    {loadingPanchang ? (
                       <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
                    ) : (
                       <Text className="text-base font-bold" style={{ color: colors.text }}>
                         {panchangData?.tithi || 'Shukla Dashami'} | {panchangData?.nakshatra || 'Pushya'}
                       </Text>
                    )}
                 </View>
              </View>

              <Text style={[styles.subLabel, { color: colors.text }]}>Available Slots</Text>
              {loadingSlots ? (
                <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
              ) : availableSlots.length > 0 ? (
                <View className="flex-row flex-wrap gap-3 mb-6">
                  {availableSlots.map((time) => (
                    <TouchableOpacity
                      key={time}
                      className={`flex-row items-center justify-center p-3 rounded-2xl border gap-2 active:opacity-70 ${selectedTime === time ? 'border-[transparent]' : 'border-gray-100 dark:border-zinc-800'}`}
                      style={{ 
                        backgroundColor: selectedTime === time ? colors.primary : colors.card,
                        width: '31%'
                      }}
                      onPress={() => setSelectedTime(time)}
                    >
                      <Ionicons
                        name={time.includes('9') || time.includes('10') || time.includes('11') ? 'sunny' : 'partly-sunny'}
                        size={14}
                        color={selectedTime === time ? '#FFF' : colors.text}
                      />
                      <Text 
                        className={`text-xs font-bold ${selectedTime === time ? 'text-white' : ''}`}
                        style={{ color: selectedTime === time ? '#FFF' : colors.text }}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View className="p-8 items-center justify-center rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 mb-6">
                  <Ionicons name="calendar-outline" size={32} color={isDark ? '#444' : '#DDD'} />
                  <Text className="text-gray-400 mt-2 font-medium">No slots available for this date.</Text>
                </View>
              )}
            </View>
          )}

          {currentStep === 2 && (
            <View key="step2">
              <Text style={[styles.stepTitle, { color: colors.text }]}>Puja Location</Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? '#AAA' : '#666' }]}>Search/Select on Map</Text>
                <LazyLoader height={56}>
                  <MapLocationPicker
                    value={address}
                    onSelect={(loc) => setAddress(loc.address)}
                    placeholder="Where should the puja be performed?"
                    colors={colors}
                    isDark={isDark}
                    label="Pin Location"
                  />
                </LazyLoader>
              </View>

              {address ? (
                <View 
                   className="p-5 rounded-3xl mb-6 flex-row items-center gap-4" 
                   style={{ backgroundColor: isDark ? '#111' : '#F9FAFB', borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB' }}
                >
                   <View className="w-10 h-10 rounded-full items-center justify-center bg-primary/10">
                      <Ionicons name="location" size={20} color={colors.primary} />
                   </View>
                   <View className="flex-1">
                      <Text className="text-[10px] font-bold uppercase tracking-wider opacity-60" style={{ color: colors.text }}>Selected Address</Text>
                      <Text className="text-sm font-semibold mt-0.5" style={{ color: colors.text }} numberOfLines={2}>{address}</Text>
                   </View>
                   <TouchableOpacity onPress={() => setAddress('')}>
                      <Ionicons name="close-circle" size={20} color={isDark ? '#555' : '#CCC'} />
                   </TouchableOpacity>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? '#AAA' : '#666' }]}>Add Note for Pandit (Optional)</Text>
                <TextInput
                  style={[styles.textInput, { height: 120, backgroundColor: colors.card, color: colors.text, borderColor: isDark ? '#333' : '#F0F0F0', borderRadius: 24 }]}
                  placeholder="E.g. Please bring extra garlands..."
                  placeholderTextColor={isDark ? '#AAA' : '#999'}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>
          )}

          {currentStep === 3 && (
            <View key="step3">
              <Text style={[styles.stepTitle, { color: colors.text }]}>Confirm Booking</Text>

              <View 
                className="rounded-[32px] p-6 shadow-sm border mb-8"
                style={{ backgroundColor: colors.card, borderColor: isDark ? '#333' : '#F3F4F6' }}
              >
                {[
                  { label: 'Selected Pandit', value: pandit?.user_details?.full_name, icon: 'person-outline' },
                  { label: 'Puja Service', value: selectedService?.puja_details?.name, icon: 'color-wand-outline' },
                  { label: 'Schedule', value: `${dayjs(selectedDate).format('ddd, MMM D')} at ${selectedTime}`, icon: 'calendar-outline' },
                  { label: 'Location', value: address, icon: 'location-outline' }
                ].map((item, index) => (
                  <View key={index} className="mb-4">
                    <View className="flex-row items-center gap-3">
                      <View className="w-8 h-8 rounded-full items-center justify-center bg-gray-50 dark:bg-zinc-800">
                        <Ionicons name={item.icon as any} size={16} color={colors.primary} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</Text>
                        <Text className="text-sm font-bold mt-0.5" style={{ color: colors.text }} numberOfLines={1}>{item.value}</Text>
                      </View>
                    </View>
                  </View>
                ))}
                
                <View className="h-[1px] bg-gray-100 dark:bg-zinc-800 my-2" />
                <View className="flex-row justify-between items-center pt-3">
                  <Text className="text-base font-bold" style={{ color: colors.text }}>Total Pay</Text>
                  <Text className="text-2xl font-black text-primary">NPR {selectedService?.custom_price}</Text>
                </View>
              </View>

              {/* Samagri Requirements */}
              {requirements.length > 0 && (
                <View style={styles.recsSection}>
                  <View style={styles.recsHeader}>
                    <View style={[styles.aiBadge, { backgroundColor: '#3B82F620' }]}>
                      <Ionicons name="list" size={14} color="#3B82F6" />
                      <Text style={[styles.aiBadgeText, { color: '#3B82F6' }]}>Required Samagri</Text>
                    </View>
                  </View>
                  <View 
                    className="rounded-2xl p-4 border mt-2" 
                    style={{ backgroundColor: colors.card, borderColor: isDark ? '#333' : '#F3F4F6' }}
                  >
                    {requirements.map((req, idx) => (
                      <View key={idx} className={`flex-row justify-between py-2 ${idx < requirements.length - 1 ? 'border-b border-gray-100 dark:border-zinc-800' : ''}`}>
                        <Text className="text-sm" style={{ color: colors.text }}>{req.samagri_item_details?.name || 'Item'}</Text>
                        <Text className="text-sm font-bold" style={{ color: colors.text }}>{req.quantity} {req.unit || 'pcs'}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* AI Recommendations */}
              <View style={styles.recsSection}>
                <View style={styles.recsHeader}>
                  <View style={[styles.aiBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="sparkles" size={14} color={colors.primary} />
                    <Text style={[styles.aiBadgeText, { color: colors.primary }]}>AI Recommended Samagri</Text>
                  </View>
                </View>

                {loadingRecs ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
                ) : recommendations.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recsList}>
                    {recommendations.map((item) => (
                      <TouchableOpacity 
                        key={item.id} 
                        style={[styles.recCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => router.push(`/(customer)/shop?search=${item.name}` as any)}
                      >
                        <Image 
                          source={{ uri: getImageUrl(item.image) || 'https://images.unsplash.com/photo-1544158404-585ff67ece33?q=80&w=300' }} 
                          style={styles.recImage} 
                          contentFit="cover" 
                        />
                        <Text style={[styles.recName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                        <Text style={[styles.recPrice, { color: colors.primary }]}>NPR {item.price}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity 
                      style={[styles.recCard, styles.viewAllCard, { borderColor: colors.primary + '40' }]}
                      onPress={() => router.push('/(customer)/shop' as any)}
                    >
                      <Ionicons name="arrow-forward-circle" size={32} color={colors.primary} />
                      <Text style={[styles.viewAllText, { color: colors.primary }]}>Shop All</Text>
                    </TouchableOpacity>
                  </ScrollView>
                ) : (
                  <Text style={[styles.noRecsText, { color: colors.text + '50' }]}>No specific recommendations for this Puja.</Text>
                )}
              </View>

              <View style={[styles.paymentNote, { backgroundColor: isDark ? '#1A2E3B' : '#E3F2FD' }]}>
                <Ionicons name="information-circle" size={20} color={colors.primary} />
                <Text style={[styles.paymentNoteText, { color: isDark ? '#64B5F6' : '#1976D2' }]}>
                  Payment will be collected after the service is completed.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

      {/* Footer */}
      <View 
        className="absolute bottom-0 left-0 right-0 p-6 border-t"
        style={{ 
          backgroundColor: colors.card, 
          borderTopColor: isDark ? '#333' : '#F3F4F6',
          paddingBottom: Math.max(insets.bottom, 24)
        }}
      >
        <TouchableOpacity
          className={`w-full h-15 bg-primary rounded-[24px] flex-row items-center justify-center gap-2 shadow-lg shadow-primary/30 active:opacity-80 ${(isSubmitting || (currentStep === 1 && !selectedTime)) ? 'opacity-50' : ''}`}
          style={{ height: 60 }}
          onPress={handleNext}
          disabled={isSubmitting || (currentStep === 1 && !selectedTime)}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text className="text-white text-lg font-black tracking-tight">
                {currentStep === STEPS.length - 1 ? 'CONFIRM BOOKING' : 'CONTINUE'}
              </Text>
              {currentStep < STEPS.length - 1 && (
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              )}
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 16,
  },
  stepWrapper: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    zIndex: 2,
  },
  stepCircleCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepNumberActive: {
    color: '#FFF',
  },
  stepLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  stepLine: {
    position: 'absolute',
    top: 16,
    left: '50%',
    width: '100%',
    height: 2,
    zIndex: 1,
  },
  stepLineActive: {
    backgroundColor: '#4CAF50',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  serviceImage: {
    width: 64,
    height: 64,
    borderRadius: 20,
  },
  subLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  calendarContainer: {
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  paymentNote: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  paymentNoteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  lottie: {
    width: 200,
    height: 200,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  recsSection: {
    marginTop: 10,
    marginBottom: 30,
  },
  recsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recsList: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  recCard: {
    width: 120,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 12,
  },
  recImage: {
    width: '100%',
    height: 80,
    borderRadius: 10,
    marginBottom: 8,
  },
  recName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  recPrice: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewAllCard: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
  },
  viewAllText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 'bold',
  },
  noRecsText: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
});
