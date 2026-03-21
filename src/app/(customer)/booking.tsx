import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LottieAnimation } from '@/components/ui/LottieAnimation';
import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import { useTheme } from '@/store/ThemeContext';
import { getPanditSummary } from '@/services/pandit.service';
import { createBooking, availableSlots as fetchAvailableSlots } from '@/services/booking.service';
import { initiatePayment, PaymentIntentResponse } from '@/services/payment.service';
import { Booking, PanditService, Pandit, SamagriItem } from '@/services/api';
import { fetchPujaSamagriRecommendations } from '@/services/recommender.service';
import { getSamagriRequirements } from '@/services/samagri.service';
import { Image } from 'expo-image';
import { BookingDateTime } from '@/components/booking/BookingDateTime';
import MapLocationPicker from '@/components/ui/MapLocationPicker';

const STEPS = ['Service', 'Date & Time', 'Address', 'Review'];

export default function BookingScreen() {
  const { panditId, serviceId } = useLocalSearchParams();
  const router = useRouter();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
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
      const response = await fetchAvailableSlots(Number(panditId), dateStr, selectedService?.puja_details?.id as number);
      const slots = response.data;
      setAvailableSlots(slots);
      if (slots.length > 0 && !slots.includes(selectedTime)) {
        setSelectedTime(slots[0]);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setLoadingSlots(false);
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
        <LottieAnimation
          source={require('@/assets/animations/success.json')} // Make sure this file exists or use a placeholder
          autoPlay
          loop={false}
          style={styles.lottie}
        />
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
              <Text style={[styles.stepTitle, { color: colors.text }]}>Select Service</Text>
              <View className="gap-3">
                {pandit?.services?.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    className={`flex-row items-center p-4 rounded-2xl border mb-3 active:opacity-70 ${selectedService?.id === service.id ? 'border-primary bg-primary/5' : 'border-gray-100 dark:border-zinc-800'}`}
                    style={{ backgroundColor: selectedService?.id === service.id ? (isDark ? '#332' : '#FFF7ED') : colors.card }}
                    onPress={() => setSelectedService(service)}
                  >
                    <View 
                      className="w-5 h-5 rounded-full border-2 mr-3 items-center justify-center"
                      style={{ borderColor: selectedService?.id === service.id ? colors.primary : (isDark ? '#666' : '#CCC') }}
                    >
                      {selectedService?.id === service.id && (
                        <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.primary }} />
                      )}
                    </View>
                    <Text 
                      className={`text-base flex-1 ${selectedService?.id === service.id ? 'text-primary font-bold' : ''}`}
                      style={{ color: selectedService?.id === service.id ? colors.primary : colors.text }}
                    >
                      {service.puja_details?.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {currentStep === 1 && (
            <View key="step1">
              <Text style={[styles.stepTitle, { color: colors.text }]}>Select Date & Time</Text>

              <Text style={[styles.subLabel, { color: colors.text }]}>Select Date</Text>
              <View style={[styles.calendarContainer, { backgroundColor: colors.card, borderColor: isDark ? '#333' : '#F0F0F0' }]}>
                <DateTimePicker
                  mode="single"
                  date={selectedDate}
                  onChange={(params) => {
                    const newDate = dayjs(params.date);
                    setSelectedDate(newDate);
                    loadSlots(newDate.format('YYYY-MM-DD'));
                  }}
                  minDate={dayjs().startOf('day')}
                  // @ts-ignore
                  selectedItemColor={colors.primary}
                  headerTextStyle={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}
                  calendarTextStyle={{ color: colors.text }}
                  selectedTextStyle={{ color: '#FFF', fontWeight: 'bold' }}
                  weekDaysTextStyle={{ color: isDark ? '#999' : '#666' }}
                  todayContainerStyle={{ borderWidth: 1, borderColor: colors.primary }}
                  todayTextStyle={{ color: colors.primary }}
                  // @ts-ignore
                  headerButtonColor={colors.primary}
                />
              </View>

              <Text style={[styles.subLabel, { color: colors.text }]}>Time Slot</Text>
              {loadingSlots ? (
                <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
              ) : availableSlots.length > 0 ? (
                <View className="flex-row flex-wrap gap-3">
                  {availableSlots.map((time) => (
                    <TouchableOpacity
                      key={time}
                      className={`flex-row items-center justify-center p-4 rounded-2xl border gap-2 active:opacity-70 ${selectedTime === time ? 'border-primary bg-primary' : 'border-gray-100 dark:border-zinc-800'}`}
                      style={{ 
                        backgroundColor: selectedTime === time ? colors.primary : colors.card,
                        width: '48%'
                      }}
                      onPress={() => setSelectedTime(time)}
                    >
                      <Ionicons
                        name={time.includes('Morning') ? 'sunny-outline' : time.includes('Evening') ? 'moon-outline' : 'time-outline'}
                        size={18}
                        color={selectedTime === time ? '#FFF' : colors.text}
                      />
                      <Text 
                        className={`text-sm font-semibold ${selectedTime === time ? 'text-white' : ''}`}
                        style={{ color: selectedTime === time ? '#FFF' : colors.text }}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View className="p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10">
                  <Text className="text-red-700 dark:text-red-400">No slots available for this date.</Text>
                </View>
              )}
            </View>
          )}

          {currentStep === 2 && (
            <View key="step2">
              <Text style={[styles.stepTitle, { color: colors.text }]}>Location Details</Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? '#AAA' : '#666' }]}>Full Address</Text>
                <MapLocationPicker
                  value={address}
                  onSelect={(loc) => setAddress(loc.address)}
                  placeholder="Select your puja location on map"
                  colors={colors}
                  isDark={isDark}
                  label="Select Puja Location"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? '#AAA' : '#666' }]}>Special Instructions (Optional)</Text>
                <TextInput
                  style={[styles.textInput, { height: 100, backgroundColor: colors.card, color: colors.text, borderColor: isDark ? '#333' : '#F0F0F0' }]}
                  placeholder="Any specific requirements..."
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
              <Text style={[styles.stepTitle, { color: colors.text }]}>Review Booking</Text>

              <View 
                className="rounded-3xl p-5 shadow-sm border mb-6"
                style={{ backgroundColor: colors.card, borderColor: isDark ? '#333' : '#F3F4F6' }}
              >
                {[
                  { label: 'Pandit', value: pandit?.user_details?.full_name },
                  { label: 'Service', value: selectedService?.puja_details?.name },
                  { label: 'Date & Time', value: `${dayjs(selectedDate).format('ddd, MMM D')} | ${selectedTime}` },
                  { label: 'Location', value: address }
                ].map((item, index) => (
                  <View key={index}>
                    <View className="flex-row justify-between py-3">
                      <Text className="text-sm text-gray-500 dark:text-gray-400">{item.label}</Text>
                      <Text className="text-sm font-bold flex-1 text-right ml-4" style={{ color: colors.text }}>{item.value}</Text>
                    </View>
                    {index < 3 && <View className="h-[1px] bg-gray-100 dark:bg-zinc-800" />}
                  </View>
                ))}
                
                <View className="h-[1px] bg-gray-100 dark:bg-zinc-800 my-2" />
                <View className="flex-row justify-between items-center pt-2">
                  <Text className="text-base font-bold" style={{ color: colors.text }}>Total Amount</Text>
                  <Text className="text-xl font-bold text-primary">NPR {selectedService?.custom_price}</Text>
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
                        <Image source={{ uri: item.image }} style={styles.recImage} contentFit="cover" />
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
        className="absolute bottom-0 left-0 right-0 p-5 border-t"
        style={{ backgroundColor: colors.card, borderTopColor: isDark ? '#333' : '#F3F4F6' }}
      >
        <TouchableOpacity
          className={`w-full h-14 bg-primary rounded-2xl flex-row items-center justify-center gap-2 shadow-lg shadow-primary/30 active:opacity-80 ${(isSubmitting || (currentStep === 1 && !selectedTime)) ? 'opacity-50' : ''}`}
          onPress={handleNext}
          disabled={isSubmitting || (currentStep === 1 && !selectedTime)}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text className="text-white text-lg font-bold">
                {currentStep === STEPS.length - 1 ? 'Book Puja' : 'Continue'}
              </Text>
              {currentStep < STEPS.length - 1 && (
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              )}
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
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
