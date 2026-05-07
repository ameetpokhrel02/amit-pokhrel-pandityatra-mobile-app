import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
import {
  Service,
  Pandit,
  PanditService,
  Puja,
  SamagriItem,
  PanchangData,
  SamagriRecommendation,
  AISamagriRecommendation
} from '@/services/api';
import { fetchBookingSamagri, fetchBookingSamagriRecommendations, addSamagriItem, removeSamagriItem } from '@/services/recommender.service';
import { getSamagriRequirements, aiRecommendSamagri } from '@/services/samagri.service';
import { Image } from 'expo-image';
import { LazyLoader } from '@/components/ui/LazyLoader';

const MapLocationPicker = React.lazy(() => import('@/components/ui/MapLocationPicker'));
const LottieAnimation = React.lazy(() =>
  import('@/components/ui/LottieAnimation').then(m => ({ default: m.LottieAnimation }))
);

dayjs.extend(calendar);
dayjs.extend(localeData);
dayjs.extend(localizedFormat);

const STEPS = ['Service', 'Schedule', 'Location', 'Samagri', 'Review'];

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
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  // Form State
  const [selectedService, setSelectedService] = useState<PanditService | null>(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedTime, setSelectedTime] = useState('');
  const [locationType, setLocationType] = useState<'USER_LOCATION' | 'ONLINE' | 'TEMPLE' | 'PANDIT_PLACE'>('USER_LOCATION');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [recommendations, setRecommendations] = useState<AISamagriRecommendation[]>([]);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [panchangData, setPanchangData] = useState<any>(null);
  const [loadingPanchang, setLoadingPanchang] = useState(false);
  const [selectedSamagriIds, setSelectedSamagriIds] = useState<Set<number>>(new Set());
  const [removedRequirementIds, setRemovedRequirementIds] = useState<Set<number>>(new Set());

  const totalSamagriPrice = React.useMemo(() => {
    let total = 0;
    selectedSamagriIds.forEach(id => {
      const item = recommendations.find(r => r.id === id);
      if (item?.price) total += Number(item.price);
    });
    return total;
  }, [selectedSamagriIds, recommendations]);

  const finalTotal = (Number(selectedService?.custom_price) || 0) + totalSamagriPrice;

  useEffect(() => {
    const loadPandit = async () => {
      if (typeof panditId === 'string') {
        const response = await getPanditSummary(Number(panditId));
        const data = response.data;
        setPandit(data || null);

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
    if (currentStep === 2 && locationType === 'USER_LOCATION' && !address) {
      Alert.alert('Required', 'Please provide your address');
      return;
    }

    if (currentStep < STEPS.length - 1) {
      if (currentStep === 0 && selectedService) {
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
      const response = await aiRecommendSamagri({
        puja_id: pujaId,
        location: locationType,
        user_notes: notes
      });
      // AI endpoint returns { recommendations: [...], context: {...} }
      setRecommendations(response.recommendations || []);
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
    if (!panditId || !selectedService) return;
    try {
      setLoadingSlots(true);
      setLoadingPanchang(true);

      const [slotsRes, panchangRes] = await Promise.all([
        fetchAvailableSlots(Number(panditId), dateStr, selectedService.id),
        fetchPanchang(dateStr)
      ]);

      setAvailableSlots(slotsRes.data.available_slots || []);
      setPanchangData(panchangRes);

      const slots = slotsRes.data.available_slots || [];
      if (slots.length > 0 && !slots.includes(selectedTime)) {
        // Only auto-select if nothing was selected yet
        if (!selectedTime) setSelectedTime(slots[0]);
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

      const bookingPayload: any = {
        pandit: pandit.id,
        service: selectedService.id,
        booking_date: dayjs(selectedDate).format('YYYY-MM-DD'),
        booking_time: selectedTime,
        location: locationType === 'ONLINE' ? 'Online' : address,
        location_type: locationType,
        notes,
        samagri_required: true,
      };

      const response = await createBooking(bookingPayload);
      const booking = response.data;
      const bId = booking.id;

      for (const reqId of Array.from(removedRequirementIds)) {
        try { await removeSamagriItem(bId, reqId); } catch (e) { console.warn('Failed to remove req', reqId); }
      }

      for (const recId of Array.from(selectedSamagriIds)) {
        try { await addSamagriItem(bId, recId); } catch (e) { console.warn('Failed to add rec', recId); }
      }

      setPaymentInfo({ bookingId: bId });
      setIsSuccess(true);
    } catch (error) {
      console.error(error);
      Alert.alert('Booking Error', 'We could not process your booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <View style={[styles.successContainer, { backgroundColor: colors.background }]}>
        <LazyLoader height={300}>
          <LottieAnimation
            source={require('@/assets/animations/success.json')}
            autoPlay
            loop={false}
            style={styles.lottie}
          />
        </LazyLoader>
        <View className="px-6 items-center">
          <Text className="text-3xl font-black text-center" style={{ color: colors.text }}>Booking Request Sent!</Text>
          <Text className="text-center mt-3 opacity-60 px-4" style={{ color: colors.text }}>
            Your request for {selectedService?.puja_details?.name} has been received by {pandit?.user_details?.full_name}.
          </Text>

          <View className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl mt-6 border border-emerald-100 dark:border-emerald-900/50">
            <Text className="text-emerald-700 dark:text-emerald-400 text-center font-bold">
              Secure your slot by completing the payment now.
            </Text>
          </View>

          <View className="w-full gap-4 mt-8">
            <TouchableOpacity
              className="w-full h-16 bg-primary rounded-2xl items-center justify-center shadow-xl shadow-primary/30"
              onPress={() => router.replace(`/(customer)/payments/checkout?bookingId=${paymentInfo?.bookingId}`)}
            >
              <Text className="text-white text-xl font-black">PAY NOW</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-full h-16 border-2 border-primary rounded-2xl items-center justify-center"
              onPress={() => router.push('/(customer)/bookings')}
            >
              <Text className="text-primary text-lg font-bold">VIEW STATUS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity onPress={handleBack} className="w-12 h-12 rounded-full items-center justify-center bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800">
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-black" style={{ color: colors.text }}>Book Ritual</Text>
        <TouchableOpacity className="w-12 h-12 rounded-full items-center justify-center bg-primary/10">
          <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View className="px-6 py-4 flex-row items-center justify-between">
        {STEPS.map((step, index) => (
          <View key={index} className="items-center" style={{ width: (Dimensions.get('window').width - 48) / 5 }}>
            <View
              className={`w-9 h-9 rounded-full items-center justify-center mb-1 border-2 ${index < currentStep ? 'bg-emerald-500 border-emerald-500' :
                index === currentStep ? 'bg-primary border-primary' :
                  'bg-transparent border-gray-200 dark:border-zinc-800'
                }`}
            >
              {index < currentStep ? (
                <Ionicons name="checkmark" size={18} color="#FFF" />
              ) : (
                <Text className={`text-xs font-black ${index === currentStep ? 'text-white' : 'text-gray-400'}`}>{index + 1}</Text>
              )}
            </View>
            <Text className={`text-[8px] font-black uppercase tracking-tighter ${index <= currentStep ? 'text-primary' : 'text-gray-400'}`} numberOfLines={1}>
              {step}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 0 && (
          <View key="step0">
            <Text className="text-2xl font-black mb-1" style={{ color: colors.text }}>Choose Service</Text>
            <Text className="text-sm opacity-50 mb-6" style={{ color: colors.text }}>Select the ritual you wish to perform with {pandit?.user_details?.full_name}</Text>

            <View className="gap-4">
              {pandit?.services?.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  className={`p-4 rounded-[28px] border-2 mb-2 ${selectedService?.id === service.id ? 'border-primary bg-primary/5' : 'border-gray-50 dark:border-zinc-900 bg-gray-50/50 dark:bg-zinc-900/50'}`}
                  onPress={() => setSelectedService(service)}
                >
                  <View className="flex-row items-center">
                    <Image
                      source={{ uri: getImageUrl(service.puja_details?.image) || undefined }}
                      className="w-16 h-16 rounded-2xl"
                      contentFit="cover"
                    />
                    <View className="flex-1 ml-4">
                      <Text className="text-lg font-black leading-tight" style={{ color: colors.text }}>{service.puja_details?.name}</Text>
                      <View className="flex-row items-center mt-1 gap-4">
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="time-outline" size={14} color={colors.primary} />
                          <Text className="text-xs font-bold opacity-60" style={{ color: colors.text }}>{service.duration_minutes}m</Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="cash-outline" size={14} color="#10B981" />
                          <Text className="text-xs font-black text-emerald-600">NPR {service.custom_price}</Text>
                        </View>
                      </View>
                    </View>
                    {selectedService?.id === service.id && (
                      <View className="bg-primary rounded-full p-1">
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {currentStep === 1 && (
          <View key="step1">
            <Text className="text-2xl font-black mb-1" style={{ color: colors.text }}>Select Schedule</Text>
            <Text className="text-sm opacity-50 mb-6" style={{ color: colors.text }}>Choose an auspicious time for your ritual</Text>

            <View
              className="rounded-[32px] border-2 overflow-hidden mb-6"
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
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
                  selectedDayBackgroundColor: colors.primary,
                  todayTextColor: colors.primary,
                  dayTextColor: colors.text,
                  textDisabledColor: isDark ? '#333' : '#CCC',
                  monthTextColor: colors.text,
                  arrowColor: colors.primary,
                  textDayFontWeight: '800',
                  textMonthFontWeight: '900',
                  textDayHeaderFontWeight: '700',
                  calendarBackground: colors.card,
                  backgroundColor: colors.card,
                  textSectionTitleColor: colors.primary,
                  selectedDayTextColor: '#FFFFFF',
                  indicatorColor: colors.primary,
                  textDayFontSize: 14,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 12
                }}
              />
            </View>

            <View className="p-5 rounded-3xl mb-8 flex-row items-center gap-4 bg-primary/5">
              <View className="w-12 h-12 rounded-2xl items-center justify-center bg-primary/10">
                <Ionicons name="sparkles" size={24} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-black uppercase tracking-widest text-primary">Panchang Detail</Text>
                {loadingPanchang ? (
                  <ActivityIndicator size="small" color={colors.primary} className="mt-1 self-start" />
                ) : (
                  <Text className="text-base font-black" style={{ color: colors.text }}>
                    {panchangData?.tithi || 'Shukla Dashami'} • {panchangData?.nakshatra || 'Pushya'}
                  </Text>
                )}
              </View>
            </View>

            <Text className="text-lg font-black mb-4" style={{ color: colors.text }}>Available Time Slots</Text>
            {loadingSlots ? (
              <ActivityIndicator color={colors.primary} className="my-8" />
            ) : availableSlots.length > 0 ? (
              <View className="flex-row flex-wrap gap-3 mb-8">
                {availableSlots.map((time) => (
                  <TouchableOpacity
                    key={time}
                    className={`h-12 px-4 rounded-2xl border-2 items-center justify-center flex-row gap-2 ${selectedTime === time ? 'border-primary bg-primary' : 'border-gray-50 dark:border-zinc-900 bg-gray-50/50 dark:bg-zinc-900/50'}`}
                    style={{ width: '31%' }}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text className={`text-xs font-black ${selectedTime === time ? 'text-white' : 'opacity-60'}`} style={{ color: selectedTime === time ? '#FFF' : colors.text }}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View className="p-12 items-center justify-center rounded-[32px] border-2 border-dashed border-gray-100 dark:border-zinc-800 mb-8">
                <Ionicons name="calendar-outline" size={40} color={isDark ? '#333' : '#DDD'} />
                <Text className="text-gray-400 mt-3 font-bold">No slots for this date</Text>
              </View>
            )}
          </View>
        )}

        {currentStep === 2 && (
          <View key="step2">
            <Text className="text-2xl font-black mb-1" style={{ color: colors.text }}>Puja Location</Text>
            <Text className="text-sm opacity-50 mb-6" style={{ color: colors.text }}>Where would you like to perform the ritual?</Text>

            <View className="flex-row flex-wrap gap-3 mb-8">
              {[
                { id: 'USER_LOCATION', label: 'My Place', icon: 'home-outline' },
                { id: 'PANDIT_PLACE', label: "Pandit's Place", icon: 'person-outline' },
                { id: 'TEMPLE', label: 'Temple', icon: 'business-outline' },
                { id: 'ONLINE', label: 'Online (Video)', icon: 'videocam-outline' },
              ].map((type) => (
                <TouchableOpacity
                  key={type.id}
                  className={`h-14 px-4 rounded-2xl border-2 items-center justify-center flex-row gap-2 ${locationType === type.id ? 'border-primary bg-primary' : 'border-gray-50 dark:border-zinc-900 bg-gray-50/50 dark:bg-zinc-900/50'}`}
                  style={{ width: '48%' }}
                  onPress={() => setLocationType(type.id as any)}
                >
                  <Ionicons name={type.icon as any} size={18} color={locationType === type.id ? '#FFF' : colors.text} />
                  <Text className={`text-xs font-black ${locationType === type.id ? 'text-white' : 'opacity-60'}`} style={{ color: locationType === type.id ? '#FFF' : colors.text }}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {locationType === 'USER_LOCATION' && (
              <View className="gap-6">
                <View>
                  <Text className="text-sm font-black mb-3" style={{ color: colors.text }}>Enter Address</Text>
                  <LazyLoader height={60}>
                    <MapLocationPicker
                      value={address}
                      onSelect={(loc) => setAddress(loc.address)}
                      placeholder="Search your location..."
                      colors={colors}
                      isDark={isDark}
                    />
                  </LazyLoader>
                </View>

                <View>
                  <Text className="text-sm font-black mb-3" style={{ color: colors.text }}>Note for Pandit (Optional)</Text>
                  <TextInput
                    className="p-5 rounded-3xl border-2 border-gray-50 dark:border-zinc-900 text-base"
                    style={{ height: 120, backgroundColor: colors.card, color: colors.text }}
                    placeholder="Special instructions..."
                    placeholderTextColor="#999"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </View>
            )}

            {locationType !== 'USER_LOCATION' && (
              <View className="p-8 items-center justify-center rounded-[32px] bg-primary/5 border-2 border-primary/10">
                <Ionicons name={locationType === 'ONLINE' ? 'videocam' : 'location'} size={48} color={colors.primary} />
                <Text className="text-lg font-black mt-4 text-center" style={{ color: colors.text }}>
                  {locationType === 'ONLINE' ? 'Video Call Ritual' : 'Fixed Location Ritual'}
                </Text>
                <Text className="text-center opacity-60 mt-2 px-4" style={{ color: colors.text }}>
                  {locationType === 'ONLINE'
                    ? 'You will receive a video link before the ritual starts.'
                    : 'The exact address will be shared after confirmation.'}
                </Text>
              </View>
            )}
          </View>
        )}

        {currentStep === 3 && (
          <View key="step3">
            <Text className="text-2xl font-black mb-1" style={{ color: colors.text }}>Samagri Checklist</Text>
            <Text className="text-sm opacity-50 mb-8" style={{ color: colors.text }}>Select the items you need. We can provide them or you can arrange your own.</Text>

            <View className="mb-8">
              <Text className="text-lg font-black mb-4" style={{ color: colors.text }}>Standard Requirements</Text>
              {requirements.map((req, idx) => (
                <TouchableOpacity
                  key={idx}
                  className={`flex-row items-center p-5 rounded-[24px] mb-3 border-2 ${!removedRequirementIds.has(req.id) ? 'border-emerald-500/30 bg-emerald-50/10' : 'border-gray-50 dark:border-zinc-900 bg-gray-50/30 dark:bg-zinc-900/30 opacity-40'}`}
                  onPress={() => {
                    const newSet = new Set(removedRequirementIds);
                    if (newSet.has(req.id)) newSet.delete(req.id);
                    else newSet.add(req.id);
                    setRemovedRequirementIds(newSet);
                  }}
                >
                  <View className="flex-1">
                    <Text className="text-base font-black" style={{ color: colors.text }}>{req.samagri_item_details?.name}</Text>
                    <Text className="text-xs font-bold opacity-50" style={{ color: colors.text }}>{req.quantity} {req.unit}</Text>
                  </View>
                  <View className={`w-6 h-6 rounded-lg items-center justify-center ${!removedRequirementIds.has(req.id) ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View className="mb-8">
              <View className="flex-row items-center gap-2 mb-4">
                <View className="bg-primary/10 px-3 py-1 rounded-full flex-row items-center gap-1">
                  <Ionicons name="sparkles" size={12} color={colors.primary} />
                  <Text className="text-[10px] font-black text-primary uppercase">AI Recommendations</Text>
                </View>
              </View>

              {recommendations.map((rec, idx) => (
                <View
                  key={idx}
                  className={`p-1 rounded-[28px] border-2 mb-4 ${rec.id && selectedSamagriIds.has(rec.id) ? 'border-primary bg-primary/5' : 'border-gray-50 dark:border-zinc-900 bg-white dark:bg-zinc-950'}`}
                >
                  <View className="flex-row items-center p-3">
                    <View className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-zinc-800 items-center justify-center overflow-hidden">
                      {rec.image ? (
                        <Image source={{ uri: getImageUrl(rec.image) || undefined }} className="w-full h-full" />
                      ) : (
                        <Ionicons name="basket-outline" size={24} color="#9CA3AF" />
                      )}
                    </View>
                    <View className="flex-1 ml-4">
                      <Text className="text-base font-black" style={{ color: colors.text }}>{rec.name}</Text>
                      <Text className="text-sm font-black text-emerald-600">NPR {rec.price}</Text>
                      {rec.reason && (
                        <Text className="text-[10px] opacity-60 mt-1 italic" style={{ color: colors.text }}>
                          "{rec.reason}"
                        </Text>
                      )}
                    </View>
                    {rec.id && (
                      <TouchableOpacity
                        className={`w-10 h-10 rounded-2xl items-center justify-center ${selectedSamagriIds.has(rec.id) ? 'bg-red-500' : 'bg-primary'}`}
                        onPress={() => {
                          if (rec.id) {
                            const newSet = new Set(selectedSamagriIds);
                            if (newSet.has(rec.id)) newSet.delete(rec.id);
                            else newSet.add(rec.id);
                            setSelectedSamagriIds(newSet);
                          }
                        }}
                      >
                        <Ionicons name={selectedSamagriIds.has(rec.id) ? "remove" : "add"} size={24} color="#FFF" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {currentStep === 4 && (
          <View key="step4">
            <Text className="text-2xl font-black mb-1" style={{ color: colors.text }}>Final Summary</Text>
            <Text className="text-sm opacity-50 mb-8" style={{ color: colors.text }}>Please review all details before confirming</Text>

            <View
              className="rounded-[40px] p-8 shadow-2xl shadow-black/5 border-2 mb-8"
              style={{ backgroundColor: colors.card, borderColor: isDark ? '#111' : '#F9FAFB' }}
            >
              <View className="items-center mb-8">
                <Image source={{ uri: getImageUrl(selectedService?.puja_details?.image) || undefined }} className="w-24 h-24 rounded-3xl mb-4" />
                <Text className="text-xl font-black text-center" style={{ color: colors.text }}>{selectedService?.puja_details?.name}</Text>
                <Text className="text-sm font-bold opacity-50" style={{ color: colors.text }}>with {pandit?.user_details?.full_name}</Text>
              </View>

              <View className="gap-6">
                <SummaryRow icon="calendar-outline" label="Date & Time" value={`${dayjs(selectedDate).format('MMM DD, YYYY')} at ${selectedTime}`} />
                <SummaryRow icon="location-outline" label="Location" value={locationType === 'ONLINE' ? 'Online Session' : (address || 'To be shared')} />
                <SummaryRow icon="cash-outline" label="Ritual Fee" value={`NPR ${selectedService?.custom_price}`} isPrice />
                {totalSamagriPrice > 0 && (
                  <SummaryRow icon="cart-outline" label="Samagri Total" value={`NPR ${totalSamagriPrice}`} isPrice />
                )}
              </View>

              <View className="h-[2px] bg-gray-50 dark:bg-zinc-900 my-8" />

              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-black opacity-60" style={{ color: colors.text }}>Total Pay</Text>
                <Text className="text-3xl font-black text-primary">NPR {finalTotal}</Text>
              </View>
            </View>

            <View className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-[32px] flex-row gap-4 border border-blue-100 dark:border-blue-900/50">
              <Ionicons name="shield-checkmark" size={24} color="#3B82F6" />
              <View className="flex-1">
                <Text className="font-black text-blue-800 dark:text-blue-400">Payment Security</Text>
                <Text className="text-xs text-blue-700 dark:text-blue-500 leading-tight mt-1">
                  Your payment is held securely and only released to the pandit after successful completion of the ritual.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View
        className="px-8 pt-4 border-t border-gray-50 dark:border-zinc-900"
        style={{
          backgroundColor: colors.card,
          paddingBottom: Math.max(insets.bottom, 24)
        }}
      >
        <TouchableOpacity
          className={`w-full h-16 rounded-[24px] flex-row items-center justify-center gap-3 shadow-2xl shadow-primary/40 active:opacity-90 ${(isSubmitting || (currentStep === 1 && !selectedTime)) ? 'opacity-50' : ''}`}
          style={{ backgroundColor: colors.primary }}
          onPress={handleNext}
          disabled={isSubmitting || (currentStep === 1 && !selectedTime)}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text className="text-white text-xl font-black tracking-tighter">
                {currentStep === STEPS.length - 1 ? 'CONFIRM & BOOK' : 'CONTINUE'}
              </Text>
              {currentStep < STEPS.length - 1 && (
                <View className="bg-white/20 p-1 rounded-full">
                  <Ionicons name="chevron-forward" size={18} color="#FFF" />
                </View>
              )}
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const SummaryRow = ({ icon, label, value, isPrice }: any) => {
  const { colors } = useTheme();
  return (
    <View className="flex-row items-center gap-4">
      <View className="w-10 h-10 rounded-2xl items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <Ionicons name={icon} size={20} color={isPrice ? '#10B981' : colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</Text>
        <Text className="text-sm font-black mt-0.5" style={{ color: colors.text }} numberOfLines={2}>{value}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
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
});
