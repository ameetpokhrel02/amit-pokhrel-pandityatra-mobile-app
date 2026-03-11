import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/store/CartContext';
import { useTheme } from '@/store/ThemeContext';
import { checkoutSamagri } from '@/services/shop.service';
import { Button } from '@/components/ui/Button';
import { PaymentWebView } from '@/components/common/PaymentWebView';

export default function ShopCheckoutScreen() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    shipping_address: '',
    city: '',
  });
  const [selectedMethod, setSelectedMethod] = useState<'KHALTI' | 'STRIPE'>('KHALTI');
  const [loading, setLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');

  const deliveryFee = 100;
  const total = totalPrice + deliveryFee;

  const handleCheckout = async () => {
    if (!formData.full_name || !formData.phone_number || !formData.shipping_address || !formData.city) {
      Alert.alert('Required', 'Please fill in all shipping details');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        payment_method: selectedMethod,
        items: items.map(item => ({ id: Number(item.id), quantity: item.quantity })),
      };

      const response = await checkoutSamagri(payload);

      if (response.payment_url) {
        setPaymentUrl(response.payment_url);
        setShowWebView(true);
      } else {
        Alert.alert('Success', 'Order placed successfully!', [
          { text: 'OK', onPress: () => {
            clearCart();
            router.replace('/(customer)/bookings'); // Or shop-specific orders if available
          }}
        ]);
      }
    } catch (error: any) {
      console.error('Checkout failed:', error);
      Alert.alert('Error', error.message || 'Failed to process checkout');
    } finally {
      setLoading(false);
    }
  };

  if (showWebView && paymentUrl) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={() => setShowWebView(false)} style={styles.backButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Complete Payment</Text>
          <View style={{ width: 40 }} />
        </View>
        <PaymentWebView
          url={paymentUrl}
          onSuccess={() => {
            setShowWebView(false);
            Alert.alert('Success', 'Payment successful and order placed!', [
              { text: 'OK', onPress: () => {
                clearCart();
                router.replace('/(customer)/bookings');
              }}
            ]);
          }}
          onFailure={() => {
            setShowWebView(false);
            Alert.alert('Payment Failed', 'The payment process was not successful.');
          }}
          onCancel={() => setShowWebView(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: isDark ? '#333' : '#F3F4F6' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Shipping Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Shipping Details</Text>
          <View style={[styles.inputGroup, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Full Name"
              placeholderTextColor={isDark ? '#AAA' : '#999'}
              value={formData.full_name}
              onChangeText={(text) => setFormData({ ...formData, full_name: text })}
            />
            <TextInput
              style={[styles.input, { color: colors.text, borderTopWidth: 1, borderTopColor: isDark ? '#333' : '#EEE' }]}
              placeholder="Phone Number"
              placeholderTextColor={isDark ? '#AAA' : '#999'}
              keyboardType="phone-pad"
              value={formData.phone_number}
              onChangeText={(text) => setFormData({ ...formData, phone_number: text })}
            />
            <TextInput
              style={[styles.input, { color: colors.text, borderTopWidth: 1, borderTopColor: isDark ? '#333' : '#EEE' }]}
              placeholder="Shipping Address"
              placeholderTextColor={isDark ? '#AAA' : '#999'}
              value={formData.shipping_address}
              onChangeText={(text) => setFormData({ ...formData, shipping_address: text })}
            />
            <TextInput
              style={[styles.input, { color: colors.text, borderTopWidth: 1, borderTopColor: isDark ? '#333' : '#EEE' }]}
              placeholder="City"
              placeholderTextColor={isDark ? '#AAA' : '#999'}
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
            />
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Method</Text>
          <TouchableOpacity
            style={[styles.methodCard, { backgroundColor: colors.card }, selectedMethod === 'KHALTI' && { borderColor: colors.primary, borderWidth: 1 }]}
            onPress={() => setSelectedMethod('KHALTI')}
          >
            <View style={styles.methodInfo}>
              <View style={[styles.methodIcon, { backgroundColor: '#5C2D91' }]}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>K</Text>
              </View>
              <Text style={[styles.methodName, { color: colors.text }]}>Khalti Wallet</Text>
            </View>
            <Ionicons name={selectedMethod === 'KHALTI' ? "radio-button-on" : "radio-button-off"} size={24} color={selectedMethod === 'KHALTI' ? colors.primary : '#AAA'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodCard, { backgroundColor: colors.card, marginTop: 12 }, selectedMethod === 'STRIPE' && { borderColor: colors.primary, borderWidth: 1 }]}
            onPress={() => setSelectedMethod('STRIPE')}
          >
            <View style={styles.methodInfo}>
              <View style={[styles.methodIcon, { backgroundColor: '#6772E5' }]}>
                <Ionicons name="card" size={20} color="white" />
              </View>
              <Text style={[styles.methodName, { color: colors.text }]}>Stripe (Card)</Text>
            </View>
            <Ionicons name={selectedMethod === 'STRIPE' ? "radio-button-on" : "radio-button-off"} size={24} color={selectedMethod === 'STRIPE' ? colors.primary : '#AAA'} />
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

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: isDark ? '#333' : '#EEE' }]}>
        <Button
          title={loading ? "Processing..." : `Pay NPR ${total}`}
          onPress={handleCheckout}
          isLoading={loading}
        />
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
    paddingHorizontal: 16,
    paddingTop: 50,
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
    borderRadius: 12,
    overflow: 'hidden',
  },
  input: {
    padding: 16,
    fontSize: 15,
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
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
  },
});
