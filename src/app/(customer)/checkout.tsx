import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/store/ThemeContext';
import { checkoutSamagri } from '@/services/samagri.service';
import { verifyKhaltiPayment, verifyEsewaPayment, checkPaymentStatus } from '@/services/payment.service';
import { Button } from '@/components/ui/Button';
import { LazyLoader } from '@/components/ui/LazyLoader';
import { useStripe } from '@stripe/stripe-react-native';

const PaymentWebView = React.lazy(() =>
  import('@/components/common/PaymentWebView').then(m => ({ default: m.PaymentWebView }))
);

export default function ShopCheckoutScreen() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState({
    full_name: useAuthStore.getState().user?.name || '',
    email: useAuthStore.getState().user?.email || '',
    phone_number: useAuthStore.getState().user?.phone || '',
    shipping_address: '',
    city: '',
  });
  const [selectedMethod, setSelectedMethod] = useState<'khalti' | 'stripe' | 'esewa'>('khalti');
  const [loading, setLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [formHtml, setFormHtml] = useState('');

  const deliveryFee = 100;
  const total = totalPrice + deliveryFee;
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const handleCheckout = async () => {
    if (!formData.full_name || !formData.phone_number || !formData.email || !formData.shipping_address || !formData.city) {
      Alert.alert('Required', 'Please fill in all personal and shipping details.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        payment_method: selectedMethod.toUpperCase() as any,
        items: items.map(item => ({ id: Number(item.id), quantity: item.quantity })),
      };

      const response = await checkoutSamagri(payload);

      const targetUrl = response.payment_url || response.checkout_url;

      if (targetUrl) {
        const esewaData = response.form_data || response.formData;
        if (selectedMethod === 'esewa' && esewaData) {
          const formFields = Object.keys(esewaData)
            .map(key => `<input type="hidden" name="${key}" value="${String(esewaData[key]).replace(/"/g, '&quot;')}" />`)
            .join('');

          const htmlContent = `
                  <html>
                      <head>
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      </head>
                      <body onload="document.getElementById('esewaForm').submit();" style="display:flex; justify-content:center; align-items:center; height:100vh; background-color:#f9f9f9; font-family:sans-serif;">
                          <form id="esewaForm" action="${targetUrl}" method="POST">
                              ${formFields}
                          </form>
                          <div style="text-align:center;">
                              <h2 style="color:#60BB46;">Redirecting to eSewa...</h2>
                              <p>Please wait while we redirect you to the secure payment gateway.</p>
                          </div>
                      </body>
                   </html>
              `;
          setFormHtml(htmlContent);
          setPaymentUrl('');
        } else {
          setPaymentUrl(targetUrl);
          setFormHtml('');
        }
        setShowWebView(true);
      } else if (selectedMethod === 'stripe') {
        if (!response.client_secret) {
          throw new Error('Stripe client secret missing');
        }

        const { error: initError } = await initPaymentSheet({
          paymentIntentClientSecret: response.client_secret,
          merchantDisplayName: 'PanditYatra Shop',
        });

        if (initError) {
          Alert.alert('Error', initError.message);
          return;
        }

        const { error: presentError } = await presentPaymentSheet();
        if (presentError) {
          if (presentError.code !== 'Canceled') {
            Alert.alert('Error', presentError.message);
          }
        } else {
          clearCart();
          router.replace('/(customer)/bookings');
          Alert.alert('Success', 'Order placed successfully!');
        }
      } else {
        // This was previously alerting 'Success' even if URL was missing!
        console.error('[Checkout] Missing payment URL in response:', response);
        Alert.alert('Payment Error', 'Failed to retrieve payment gateway URL. Please try again.');
      }
    } catch (error: any) {
      console.error('Checkout failed:', error);
      Alert.alert('Error', error.message || 'Failed to process checkout');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (pidx?: string, esewaData?: string) => {
    try {
      setLoading(true);
      if (pidx) {
        await verifyKhaltiPayment({ pidx: pidx, amount: total });
      } else if (esewaData) {
        await verifyEsewaPayment({ data: esewaData });
      }

      clearCart();
      router.replace('/(customer)/bookings');
      Alert.alert('Success', 'Payment successful and order placed!');
    } catch (e: any) {
      console.error('Verification Error:', e);
      Alert.alert('Verification Failed', 'Payment succeeded but verification failed. Please check your orders.');
      router.replace('/(customer)/bookings');
    } finally {
      setLoading(false);
    }
  };

  if (showWebView && (paymentUrl || formHtml)) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={() => setShowWebView(false)} style={styles.backButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Complete Payment</Text>
          <View style={{ width: 40 }} />
        </View>
        <LazyLoader>
          <PaymentWebView
            url={paymentUrl}
            html={formHtml}
            onSuccess={(data) => {
              setShowWebView(false);
              const pidx = data.url.split('pidx=')[1]?.split('&')[0];
              const esewaData = data.url.split('data=')[1]?.split('&')[0];
              handlePaymentSuccess(pidx, esewaData);
            }}
            onFailure={() => {
              setShowWebView(false);
              Alert.alert('Payment Failed', 'The payment process was not successful.');
            }}
            onCancel={() => setShowWebView(false)}
          />
        </LazyLoader>
      </SafeAreaView>
    );
  }

  return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: isDark ? '#333' : '#F3F4F6',
            paddingTop: insets.top + (Platform.OS === 'ios' ? 0 : 8)
          }
        ]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

        <ScrollView 
          contentContainerStyle={[
            styles.content, 
            { paddingBottom: insets.bottom + 120 } // Ensure scroll content isn't hidden behind sticky footer
          ]}
          showsVerticalScrollIndicator={false}
        >
        {/* Personal Information Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Text>
          <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: isDark ? '#444' : '#E5E7EB' }]}>
              <Text style={[styles.inputLabel, { color: isDark ? '#AAA' : '#666' }]}>Your Name *</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Full Name"
                placeholderTextColor={isDark ? '#777' : '#AAA'}
                value={formData.full_name}
                onChangeText={(text) => setFormData({ ...formData, full_name: text })}
              />
            </View>

            <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: isDark ? '#444' : '#E5E7EB' }]}>
              <Text style={[styles.inputLabel, { color: isDark ? '#AAA' : '#666' }]}>Your Email Address</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="email@example.com"
                placeholderTextColor={isDark ? '#777' : '#AAA'}
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
              />
            </View>

            <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: isDark ? '#444' : '#E5E7EB' }]}>
              <Text style={[styles.inputLabel, { color: isDark ? '#AAA' : '#666' }]}>Your Phone Number *</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="+977"
                placeholderTextColor={isDark ? '#777' : '#AAA'}
                keyboardType="phone-pad"
                value={formData.phone_number}
                onChangeText={(text) => setFormData({ ...formData, phone_number: text })}
              />
            </View>

            <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: isDark ? '#444' : '#E5E7EB' }]}>
              <Text style={[styles.inputLabel, { color: isDark ? '#AAA' : '#666' }]}>Shipping Address *</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Street Address, Area"
                placeholderTextColor={isDark ? '#777' : '#AAA'}
                value={formData.shipping_address}
                onChangeText={(text) => setFormData({ ...formData, shipping_address: text })}
              />
            </View>

            <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: isDark ? '#444' : '#E5E7EB' }]}>
              <Text style={[styles.inputLabel, { color: isDark ? '#AAA' : '#666' }]}>City *</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g. Kathmandu"
                placeholderTextColor={isDark ? '#777' : '#AAA'}
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
              />
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Method</Text>
          <TouchableOpacity
            style={[styles.methodCard, { backgroundColor: colors.card }, selectedMethod === 'khalti' && { borderColor: colors.primary, borderWidth: 1 }]}
            onPress={() => setSelectedMethod('khalti')}
          >
            <View style={styles.methodInfo}>
              <View style={[styles.methodIcon, { backgroundColor: '#fff', overflow: 'hidden' }]}>
                <Image
                  source={require('@/assets/images/khalti.png')}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.methodName, { color: colors.text }]}>Khalti Wallet</Text>
            </View>
            <Ionicons name={selectedMethod === 'khalti' ? "radio-button-on" : "radio-button-off"} size={24} color={selectedMethod === 'khalti' ? colors.primary : '#AAA'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodCard, { backgroundColor: colors.card, marginTop: 12 }, selectedMethod === 'esewa' && { borderColor: colors.primary, borderWidth: 1 }]}
            onPress={() => setSelectedMethod('esewa')}
          >
            <View style={styles.methodInfo}>
              <View style={[styles.methodIcon, { backgroundColor: '#fff', overflow: 'hidden' }]}>
                <Image
                  source={require('@/assets/images/eswa.jpg')}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.methodName, { color: colors.text }]}>eSewa</Text>
            </View>
            <Ionicons name={selectedMethod === 'esewa' ? "radio-button-on" : "radio-button-off"} size={24} color={selectedMethod === 'esewa' ? colors.primary : '#AAA'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodCard, { backgroundColor: colors.card, marginTop: 12 }, selectedMethod === 'stripe' && { borderColor: colors.primary, borderWidth: 1 }]}
            onPress={() => setSelectedMethod('stripe')}
          >
            <View style={styles.methodInfo}>
              <View style={[styles.methodIcon, { backgroundColor: '#6772E5' }]}>
                <Ionicons name="card" size={20} color="white" />
              </View>
              <Text style={[styles.methodName, { color: colors.text }]}>Stripe (Card)</Text>
            </View>
            <Ionicons name={selectedMethod === 'stripe' ? "radio-button-on" : "radio-button-off"} size={24} color={selectedMethod === 'stripe' ? colors.primary : '#AAA'} />
          </TouchableOpacity>
        </View>

        {/* Order Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: isDark ? '#AAA' : '#666' }]}>Items Subtotal</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>NPR {totalPrice}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: isDark ? '#AAA' : '#666' }]}>Delivery Fee</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>NPR {deliveryFee}</Text>
          </View>
          <View style={[styles.totalRow, { borderTopColor: isDark ? '#333' : '#EEE' }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>NPR {total}</Text>
          </View>
        </View>
      </ScrollView>

        <View style={[
          styles.footer,
          {
            backgroundColor: colors.card,
            borderTopColor: isDark ? '#333' : '#EEE',
            paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 24,
            paddingTop: 16
          }
        ]}>
          <Button
            title={loading ? "Processing..." : `Pay NPR ${total}`}
            onPress={handleCheckout}
            isLoading={loading}
            style={{ height: 56, borderRadius: 16 }}
            textStyle={{ fontSize: 18, fontWeight: '800' }}
          />
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  inputGroup: {
    gap: 16,
  },
  inputWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 2,
    fontWeight: '500',
  },
  input: {
    paddingVertical: 4,
    fontSize: 16,
    fontWeight: '500',
  },
  methodCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodName: {
    fontSize: 15,
    fontWeight: '600',
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
});
