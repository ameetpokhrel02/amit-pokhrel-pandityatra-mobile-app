import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useCart } from '@/store/CartContext';
import { useTheme } from '@/store/ThemeContext';
import { checkoutSamagri } from '@/services/api';

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState({
      full_name: '',
      phone_number: '',
      shipping_address: '',
      city: '',
      payment_method: 'STRIPE' as 'STRIPE' | 'KHALTI'
  });
  const [loading, setLoading] = useState(false);

  const deliveryFee = 100;
  const total = totalPrice + deliveryFee;

  const handleCheckout = async () => {
      if (!formData.full_name || !formData.phone_number || !formData.shipping_address || !formData.city) {
          Alert.alert('Error', 'Please fill all fields');
          return;
      }
      
      try {
          setLoading(true);
          const payload = {
              ...formData,
              items: items.map(item => ({
                  id: Number(item.id),
                  qty: item.quantity
              }))
          };
          
          const response = await checkoutSamagri(payload);
          
          // API returns order_id, total_amount, payment_url
          if (response.payment_url) {
              await Linking.openURL(response.payment_url);
          }
          
          Alert.alert('Success', `Order placed successfully! Order ID: ${response.order_id}`, [
              { text: 'OK', onPress: () => {
                  clearCart();
                  router.replace('/(customer)/shop');
              }}
          ]);
      } catch (error: any) {
          Alert.alert('Error', error.message || 'Checkout failed');
      } finally {
          setLoading(false);
      }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: isDark ? '#333' : '#F3F4F6' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Checkout</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Shipping Details</Text>
            
            <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
            <TextInput 
                style={[styles.input, { color: colors.text, borderColor: isDark ? '#555' : '#DDD', backgroundColor: isDark ? '#333' : '#FFF' }]}
                value={formData.full_name}
                onChangeText={t => setFormData({...formData, full_name: t})}
                placeholder="Enter full name"
                placeholderTextColor={isDark ? '#AAA' : '#999'}
            />

            <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
            <TextInput 
                style={[styles.input, { color: colors.text, borderColor: isDark ? '#555' : '#DDD', backgroundColor: isDark ? '#333' : '#FFF' }]}
                value={formData.phone_number}
                onChangeText={t => setFormData({...formData, phone_number: t})}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                placeholderTextColor={isDark ? '#AAA' : '#999'}
            />

            <Text style={[styles.label, { color: colors.text }]}>City</Text>
            <TextInput 
                style={[styles.input, { color: colors.text, borderColor: isDark ? '#555' : '#DDD', backgroundColor: isDark ? '#333' : '#FFF' }]}
                value={formData.city}
                onChangeText={t => setFormData({...formData, city: t})}
                placeholder="Enter city"
                placeholderTextColor={isDark ? '#AAA' : '#999'}
            />

            <Text style={[styles.label, { color: colors.text }]}>Shipping Address</Text>
            <TextInput 
                style={[styles.input, { color: colors.text, borderColor: isDark ? '#555' : '#DDD', backgroundColor: isDark ? '#333' : '#FFF', height: 80 }]}
                value={formData.shipping_address}
                onChangeText={t => setFormData({...formData, shipping_address: t})}
                placeholder="Enter full address"
                multiline
                placeholderTextColor={isDark ? '#AAA' : '#999'}
            />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Method</Text>
            <View style={styles.paymentOptions}>
                <TouchableOpacity 
                    style={[styles.paymentOption, formData.payment_method === 'STRIPE' && styles.paymentOptionSelected, { borderColor: isDark ? '#555' : '#DDD' }]}
                    onPress={() => setFormData({...formData, payment_method: 'STRIPE'})}
                >
                    <Ionicons name="card-outline" size={24} color={formData.payment_method === 'STRIPE' ? Colors.light.primary : (isDark ? '#AAA' : '#666')} />
                    <Text style={[styles.paymentText, { color: colors.text }]}>Stripe / Card</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.paymentOption, formData.payment_method === 'KHALTI' && styles.paymentOptionSelected, { borderColor: isDark ? '#555' : '#DDD' }]}
                    onPress={() => setFormData({...formData, payment_method: 'KHALTI'})}
                >
                    <Ionicons name="wallet-outline" size={24} color={formData.payment_method === 'KHALTI' ? '#5C2D91' : (isDark ? '#AAA' : '#666')} /> 
                    <Text style={[styles.paymentText, { color: colors.text }]}>Khalti</Text>
                </TouchableOpacity>
            </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Summary</Text>
             <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: isDark ? '#AAA' : '#666' }]}>Items ({items.length})</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>NPR {totalPrice}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: isDark ? '#AAA' : '#666' }]}>Delivery Fee</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>NPR {deliveryFee}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: isDark ? '#333' : '#F3F4F6' }]}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>NPR {total}</Text>
              </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: isDark ? '#333' : '#F3F4F6' }]}>
        <TouchableOpacity 
            style={[styles.checkoutButton, { backgroundColor: colors.primary }]}
            onPress={handleCheckout}
            disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.checkoutButtonText}>Place Order (NPR {total})</Text>}
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
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
      fontSize: 14,
      marginBottom: 8,
      fontWeight: '500',
  },
  input: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      fontSize: 16,
  },
  paymentOptions: {
      flexDirection: 'row',
      gap: 12,
  },
  paymentOption: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
  },
  paymentOptionSelected: {
      borderColor: Colors.light.primary,
      backgroundColor: '#FEF3C7', // light primary
  },
  paymentText: {
      fontWeight: '500',
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
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
  },
  checkoutButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
