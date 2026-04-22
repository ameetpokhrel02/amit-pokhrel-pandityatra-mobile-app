import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ActivityIndicator, 
  Platform, 
  KeyboardAvoidingView,
  Dimensions
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/store/ThemeContext';
import { checkoutSamagri } from '@/services/samagri.service';
import { verifyKhaltiPayment, verifyEsewaPayment } from '@/services/payment.service';
import { Button } from '@/components/ui/Button';
import { LazyLoader } from '@/components/ui/LazyLoader';
import { useStripe } from '@stripe/stripe-react-native';
import { getImageUrl } from '@/utils/image';
import { MotiView } from 'moti';

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
  const [selectedMethod, setSelectedMethod] = useState<'khalti' | 'stripe' | 'esewa' | 'cod'>('khalti');
  const [loading, setLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [formHtml, setFormHtml] = useState('');

  const deliveryFee = 100;
  const total = totalPrice + deliveryFee;
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const handleCheckout = async () => {
    if (!formData.full_name || !formData.phone_number || !formData.shipping_address || !formData.city) {
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

      // Handle COD directly
      if (selectedMethod === 'cod') {
        clearCart();
        router.replace('/(customer)/shop/orders');
        Alert.alert('Success', 'Order placed successfully! Please pay on delivery.');
        return;
      }

      const targetUrl = response.payment_url || response.checkout_url;

      if (targetUrl) {
        const esewaData = response.form_data || response.formData;
        if (selectedMethod === 'esewa' && esewaData) {
          const formFields = Object.keys(esewaData)
            .map(key => `<input type="hidden" name="${key}" value="${String(esewaData[key]).replace(/"/g, '&quot;')}" />`)
            .join('');

          const htmlContent = `
                   <html>
                       <body onload="document.getElementById('esewaForm').submit();">
                           <form id="esewaForm" action="${targetUrl}" method="POST">${formFields}</form>
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
        if (!response.client_secret) throw new Error('Stripe client secret missing');

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
          if (presentError.code !== 'Canceled') Alert.alert('Error', presentError.message);
        } else {
          clearCart();
          router.replace('/(customer)/shop/orders');
          Alert.alert('Success', 'Order placed successfully!');
        }
      } else {
        Alert.alert('Payment Error', 'Failed to retrieve payment gateway URL.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process checkout');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (khaltiParams?: Record<string, any>, esewaData?: string) => {
    try {
      setLoading(true);
      if (khaltiParams && Object.keys(khaltiParams).length > 0) {
        await verifyKhaltiPayment(khaltiParams);
      } else if (esewaData) {
        // esewa logic
      }
      clearCart();
      router.replace('/(customer)/shop/orders');
      Alert.alert('Success', 'Order placed successfully!');
    } catch (e: any) {
      Alert.alert('Verification Failed', 'Check your order status in dashboard.');
      router.replace('/(customer)/shop/orders');
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Payment Gateway</Text>
          <View style={{ width: 40 }} />
        </View>
        <LazyLoader>
          <PaymentWebView
            url={paymentUrl}
            html={formHtml}
            onSuccess={() => handlePaymentSuccess()}
            onFailure={() => setShowWebView(false)}
            onCancel={() => setShowWebView(false)}
          />
        </LazyLoader>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.topHeader, { paddingTop: insets.top + 10, backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Checkout</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <Step active icon="cart" label="Cart" colors={colors} />
            <View style={[styles.progressLine, { backgroundColor: colors.primary }]} />
            <Step active icon="document-text" label="Details" colors={colors} />
            <View style={[styles.progressLine, { backgroundColor: colors.border }]} />
            <Step active={false} icon="checkmark-circle" label="Done" colors={colors} />
          </View>

          {/* Form Section */}
          <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 100 }}>
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Shipping Details</Text>
              </View>

              <View style={styles.inputGrid}>
                <InputItem 
                  label="Full Name" 
                  value={formData.full_name} 
                  onChange={(t: string) => setFormData({...formData, full_name: t})} 
                  placeholder="Enter Name"
                  colors={colors}
                  isDark={isDark}
                />
                <InputItem 
                  label="Phone Number" 
                  value={formData.phone_number} 
                  onChange={(t: string) => setFormData({...formData, phone_number: t})} 
                  placeholder="+977"
                  keyboardType="phone-pad"
                  colors={colors}
                  isDark={isDark}
                />
                <InputItem 
                  label="Shipping Address" 
                  value={formData.shipping_address} 
                  onChange={(t: string) => setFormData({...formData, shipping_address: t})} 
                  placeholder="Street, Ward, Area"
                  colors={colors}
                  isDark={isDark}
                />
                <InputItem 
                  label="City" 
                  value={formData.city} 
                  onChange={(t: string) => setFormData({...formData, city: t})} 
                  placeholder="e.g. Kathmandu"
                  colors={colors}
                  isDark={isDark}
                />
              </View>
            </View>
          </MotiView>

          {/* Payment Methods */}
          <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 200 }}>
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 20 }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="card" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Method</Text>
              </View>

              <View style={styles.methodGrid}>
                <PaymentMethodItem 
                  id="khalti" 
                  name="Khalti" 
                  image={require('@/assets/images/khalti.png')} 
                  selected={selectedMethod === 'khalti'}
                  onSelect={() => setSelectedMethod('khalti')}
                  colors={colors}
                />
                <PaymentMethodItem 
                  id="esewa" 
                  name="eSewa" 
                  image={require('@/assets/images/eswa.jpg')} 
                  selected={selectedMethod === 'esewa'}
                  onSelect={() => setSelectedMethod('esewa')}
                  colors={colors}
                />
                <PaymentMethodItem 
                  id="stripe" 
                  name="Card" 
                  icon="credit-card-outline"
                  selected={selectedMethod === 'stripe'}
                  onSelect={() => setSelectedMethod('stripe')}
                  colors={colors}
                />
                <PaymentMethodItem 
                  id="cod" 
                  name="Cash" 
                  icon="cash-multiple"
                  selected={selectedMethod === 'cod'}
                  onSelect={() => setSelectedMethod('cod')}
                  colors={colors}
                />
              </View>
            </View>
          </MotiView>

          {/* Order Summary */}
          <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 300 }}>
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16 }]}>Order Summary</Text>
              
              <View style={styles.itemList}>
                {items.map(item => (
                  <View key={item.id} style={styles.itemRow}>
                    <Image source={{ uri: getImageUrl(item.image) || undefined }} style={styles.itemThumb} contentFit="cover" />
                    <View style={styles.itemMeta}>
                      <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={[styles.itemSub, { color: colors.text + '80' }]}>{item.quantity} x NPR {item.price}</Text>
                    </View>
                    <Text style={[styles.itemTotal, { color: colors.text }]}>NPR {item.price * item.quantity}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.priceContainer}>
                <PriceRow label="Subtotal" value={totalPrice} colors={colors} />
                <PriceRow label="Delivery" value={deliveryFee} colors={colors} />
                <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount</Text>
                  <Text style={[styles.totalValue, { color: colors.primary }]}>NPR {total}</Text>
                </View>
              </View>
            </View>
          </MotiView>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Footer Action */}
        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
          <Button 
            title={loading ? "Processing..." : `Place Order • NPR ${total}`}
            onPress={handleCheckout}
            isLoading={loading}
            style={{ height: 60, borderRadius: 20 }}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const Step = ({ active, icon, label, colors }: any) => (
  <View style={styles.stepItem}>
    <View style={[styles.stepCircle, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border }]}>
      <Ionicons name={icon} size={16} color={active ? '#FFF' : colors.text + '40'} />
    </View>
    <Text style={[styles.stepLabel, { color: active ? colors.text : colors.text + '40' }]}>{label}</Text>
  </View>
);

const InputItem = ({ label, value, onChange, placeholder, keyboardType, colors, isDark }: any) => (
  <View style={styles.inputGroup}>
    <Text style={[styles.inputLabel, { color: colors.text + '60' }]}>{label}</Text>
    <TextInput 
      style={[styles.inputField, { backgroundColor: isDark ? '#1A1A1D' : '#F9F9F9', borderColor: colors.border, color: colors.text }]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.text + '30'}
      keyboardType={keyboardType}
    />
  </View>
);

const PaymentMethodItem = ({ name, image, icon, selected, onSelect, colors }: any) => (
  <TouchableOpacity 
    onPress={onSelect}
    style={[styles.methodItem, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary + '08' : 'transparent' }]}
  >
    <View style={styles.methodContent}>
      {image ? (
        <Image source={image} style={styles.methodImg} contentFit="contain" />
      ) : (
        <MaterialCommunityIcons name={icon} size={24} color={selected ? colors.primary : colors.text + '60'} />
      )}
      <Text style={[styles.methodName, { color: selected ? colors.text : colors.text + '80' }]}>{name}</Text>
    </View>
    {selected && (
      <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
        <Ionicons name="checkmark" size={12} color="#FFF" />
      </View>
    )}
  </TouchableOpacity>
);

const PriceRow = ({ label, value, colors }: any) => (
  <View style={styles.priceRow}>
    <Text style={[styles.priceLabel, { color: colors.text + '70' }]}>{label}</Text>
    <Text style={[styles.priceVal, { color: colors.text }]}>NPR {value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  backButton: { padding: 4 },
  scrollContent: { padding: 20 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 30, gap: 10 },
  stepItem: { alignItems: 'center', gap: 6 },
  stepCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontSize: 11, fontWeight: 'bold' },
  progressLine: { flex: 1, height: 2, maxWidth: 40, marginTop: -20 },
  sectionCard: { padding: 20, borderRadius: 24, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold' },
  inputGrid: { gap: 16 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  inputField: { height: 54, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, fontSize: 15, fontWeight: '500' },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  methodItem: { width: '47%', height: 64, borderRadius: 16, borderWidth: 1, position: 'relative', overflow: 'hidden' },
  methodContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 },
  methodImg: { width: 32, height: 32 },
  methodName: { fontSize: 13, fontWeight: 'bold' },
  checkCircle: { position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  summaryCard: { padding: 20, borderRadius: 24, borderWidth: 1, marginTop: 20 },
  itemList: { gap: 16, marginBottom: 20 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemThumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#F3F4F6' },
  itemMeta: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: 'bold' },
  itemSub: { fontSize: 12 },
  itemTotal: { fontSize: 14, fontWeight: 'bold' },
  priceContainer: { gap: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 16 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { fontSize: 14 },
  priceVal: { fontSize: 14, fontWeight: 'bold' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 16, marginTop: 6 },
  totalLabel: { fontSize: 18, fontWeight: 'bold' },
  totalValue: { fontSize: 22, fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1 },
});
