import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView, AnimatePresence } from 'moti';
import { LottieAnimation } from '@/components/ui/LottieAnimation';
import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import { useTheme } from '@/store/ThemeContext';
import { PanditService } from '@/services/pandit.service';
import { Pandit } from '@/types/pandit';
import { createBooking, createPayment, Booking, PaymentIntentResponse } from '@/services/api';

const STEPS = ['Service', 'Date & Time', 'Address', 'Review'];

export default function BookingScreen() {
  const { panditId } = useLocalSearchParams();
  const router = useRouter();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const [currentStep, setCurrentStep] = useState(0);
  const [pandit, setPandit] = useState<Pandit | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentIntentResponse | null>(null);

  // Form State
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedTime, setSelectedTime] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const loadPandit = async () => {
      if (typeof panditId === 'string') {
        const data = await PanditService.getPanditById(panditId);
        setPandit(data || null);
      }
    };
    loadPandit();
  }, [panditId]);

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
      setCurrentStep(currentStep + 1);
    } else {
      handleBooking();
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
    if (!pandit) return;

    try {
      setIsSubmitting(true);

      // 1️⃣ Create booking on backend
      const bookingPayload: Partial<Booking> = {
        pandit: pandit.id as unknown as number,
        booking_date: dayjs(selectedDate).format('YYYY-MM-DD'),
        booking_time: selectedTime,
        notes,
      };

      const booking = await createBooking(bookingPayload);

      // 2️⃣ Create payment intent for this booking (default to Khalti for now)
      const payment = await createPayment({
        booking: booking.id,
        payment_method: 'khalti',
      });

      setPaymentInfo(payment);
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
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 1000 }}
        >
          <Text style={[styles.successTitle, { color: colors.text }]}>Booking Created</Text>
          <Text style={[styles.successMessage, { color: isDark ? '#AAA' : '#666' }]}>
            Your booking with {pandit?.name} for {selectedService} has been created.
          </Text>

          {paymentInfo?.payment_url && (
            <Text style={[styles.successMessage, { color: isDark ? '#A7F3D0' : '#047857' }]}>
              Please complete your payment in the next step.
            </Text>
          )}

          <TouchableOpacity
            style={[styles.homeButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(customer)/bookings')}
          >
            <Text style={styles.homeButtonText}>Go to My Bookings</Text>
          </TouchableOpacity>
        </MotiView>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Book Pandit</Text>
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
        <AnimatePresence exitBeforeEnter>
          {currentStep === 0 && (
            <MotiView 
              key="step0"
              from={{ opacity: 0, translateX: 20 }}
              animate={{ opacity: 1, translateX: 0 }}
              exit={{ opacity: 0, translateX: -20 }}
              transition={{ type: 'timing', duration: 300 }}
            >
              <Text style={[styles.stepTitle, { color: colors.text }]}>Select Service</Text>
              <View style={styles.optionsContainer}>
                {pandit?.specialization.map((spec) => (
                  <TouchableOpacity
                    key={spec}
                    style={[styles.optionCard, { backgroundColor: colors.card, borderColor: isDark ? '#333' : '#F0F0F0' }, selectedService === spec && { borderColor: colors.primary, backgroundColor: isDark ? '#332' : '#FFF7ED' }]}
                    onPress={() => setSelectedService(spec)}
                  >
                    <View style={[styles.radioCircle, { borderColor: isDark ? '#666' : '#CCC' }, selectedService === spec && { borderColor: colors.primary }]}>
                      {selectedService === spec && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                    </View>
                    <Text style={[styles.optionText, { color: colors.text }, selectedService === spec && { color: colors.primary, fontWeight: '600' }]}>
                      {spec}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </MotiView>
          )}

          {currentStep === 1 && (
            <MotiView 
              key="step1"
              from={{ opacity: 0, translateX: 20 }}
              animate={{ opacity: 1, translateX: 0 }}
              exit={{ opacity: 0, translateX: -20 }}
              transition={{ type: 'timing', duration: 300 }}
            >
              <Text style={[styles.stepTitle, { color: colors.text }]}>Select Date & Time</Text>
              
              <Text style={[styles.subLabel, { color: colors.text }]}>Select Date</Text>
              <View style={[styles.calendarContainer, { backgroundColor: colors.card, borderColor: isDark ? '#333' : '#F0F0F0' }]}>
                <DateTimePicker
                  mode="single"
                  date={selectedDate}
                  onChange={(params) => setSelectedDate(dayjs(params.date))}
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
              <View style={styles.timeGrid}>
                {['Morning (6-9 AM)', 'Day (10-2 PM)', 'Evening (4-7 PM)'].map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeCard, 
                      { backgroundColor: colors.card, borderColor: isDark ? '#333' : '#F0F0F0' },
                      selectedTime === time && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Ionicons 
                      name={time.includes('Morning') ? 'sunny-outline' : time.includes('Evening') ? 'moon-outline' : 'time-outline'} 
                      size={20} 
                      color={selectedTime === time ? '#FFF' : colors.text} 
                    />
                    <Text style={[
                      styles.timeText, 
                      { color: colors.text },
                      selectedTime === time && { color: '#FFF', fontWeight: '600' }
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </MotiView>
          )}

          {currentStep === 2 && (
            <MotiView 
              key="step2"
              from={{ opacity: 0, translateX: 20 }}
              animate={{ opacity: 1, translateX: 0 }}
              exit={{ opacity: 0, translateX: -20 }}
              transition={{ type: 'timing', duration: 300 }}
            >
              <Text style={[styles.stepTitle, { color: colors.text }]}>Location Details</Text>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? '#AAA' : '#666' }]}>Full Address</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.card, color: colors.text, borderColor: isDark ? '#333' : '#F0F0F0' }]}
                  placeholder="Street, Area, City"
                  placeholderTextColor={isDark ? '#AAA' : '#999'}
                  value={address}
                  onChangeText={setAddress}
                  multiline
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
            </MotiView>
          )}

          {currentStep === 3 && (
            <MotiView 
              key="step3"
              from={{ opacity: 0, translateX: 20 }}
              animate={{ opacity: 1, translateX: 0 }}
              exit={{ opacity: 0, translateX: -20 }}
              transition={{ type: 'timing', duration: 300 }}
            >
              <Text style={[styles.stepTitle, { color: colors.text }]}>Review Booking</Text>
              
              <View style={[styles.summaryCard, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#000' }]}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: isDark ? '#AAA' : '#666' }]}>Pandit</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>{pandit?.name}</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: isDark ? '#AAA' : '#666' }]}>Service</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>{selectedService}</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: isDark ? '#AAA' : '#666' }]}>Date & Time</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {dayjs(selectedDate).format('ddd, MMM D')} | {selectedTime}
                  </Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: isDark ? '#AAA' : '#666' }]}>Location</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>{address}</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: isDark ? '#AAA' : '#666' }]}>Total Amount</Text>
                  <Text style={[styles.totalPrice, { color: colors.primary }]}>NPR {pandit?.price}</Text>
                </View>
              </View>

              <View style={[styles.paymentNote, { backgroundColor: isDark ? '#1A2E3B' : '#E3F2FD' }]}>
                <Ionicons name="information-circle" size={20} color={colors.primary} />
                <Text style={[styles.paymentNoteText, { color: isDark ? '#64B5F6' : '#1976D2' }]}>
                  Payment will be collected after the service is completed.
                </Text>
              </View>
            </MotiView>
          )}
        </AnimatePresence>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: isDark ? '#333' : '#F0F0F0' }]}>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: colors.primary }, isSubmitting && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {currentStep === STEPS.length - 1 ? 'Confirm & Pay' : 'Continue'}
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
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionText: {
    fontSize: 16,
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
  dateCard: {
    width: 70,
    height: 90,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  dayText: {
    fontSize: 14,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  timeGrid: {
    gap: 12,
  },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  timeText: {
    fontSize: 16,
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
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  summaryDivider: {
    height: 1,
    marginVertical: 8,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  nextButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButtonDisabled: {
    opacity: 0.7,
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
  homeButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  homeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
