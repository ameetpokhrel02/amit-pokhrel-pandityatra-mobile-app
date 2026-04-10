import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { fetchCart } from '@/services/samagri.service';
import { Colors } from '@/theme/colors';
import { useCartStore } from '@/store/cart.store';
import { useTheme } from '@/store/ThemeContext';

const { width } = Dimensions.get('window');

export default function CartScreen() {
  const router = useRouter();
  const { items, updateQuantity, addToCart, removeFromCart, totalPrice, syncCart } = useCartStore();
  
  // Sync with server on focus
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const loadCart = async () => {
        try {
          const data = await fetchCart();
          if (isMounted) {
            syncCart(data);
          }
        } catch (err) {
          console.warn('Failed to sync cart with server', err);
        }
      };
      loadCart();
      return () => { isMounted = false; };
    }, [syncCart])
  );
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark';

  const deliveryFee = 100;
  const total = totalPrice + deliveryFee;

  if (items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Cart</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={[styles.emptyContent, { justifyContent: 'center', alignItems: 'center' }]}>
          <View style={[styles.emptyIconBox, { backgroundColor: colors.primary + '10' }]}>
            <Ionicons name="bag-handle-outline" size={80} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Your cart is empty</Text>
          <Text style={[styles.emptySub, { color: colors.text + '60' }]}>Looks like you haven&apos;t added anything to your cart yet.</Text>
          <TouchableOpacity 
            style={[styles.shopBtn, { backgroundColor: colors.primary }]} 
            onPress={() => router.push('/(customer)/shop')}
          >
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Cart</Text>
        <TouchableOpacity 
           onPress={() => router.push('/(customer)/shop')}
           style={[styles.backBtn, { backgroundColor: 'transparent' }]}
        >
          <Ionicons name="add" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Items in Cart ({items.length})</Text>
        {items.map((item) => (
          <View key={item.id} style={[styles.cartItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.itemImageWrapper, { backgroundColor: colors.background }]}>
               {item.image && (item.image.startsWith('http') || item.image.startsWith('file')) ? (
                  <Image source={{ uri: item.image }} style={styles.itemImg} />
               ) : (
                  <Ionicons name={item.image as any || 'cube-outline'} size={32} color={colors.primary + '40'} />
               )}
            </View>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.itemPrice, { color: colors.primary }]}>NPR {item.price}</Text>
              
              <View style={styles.itemFooter}>
                <View style={[styles.qtyRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <TouchableOpacity 
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Ionicons name="remove" size={16} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.qtyVal, { color: colors.text }]}>{item.quantity}</Text>
                  <TouchableOpacity 
                    style={styles.qtyBtn}
                    onPress={() => addToCart(item)}
                  >
                    <Ionicons name="add" size={16} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity 
                  style={[styles.removeBtn, { backgroundColor: colors.secondary + '10' }]}
                  onPress={() => removeFromCart(item.id)}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.secondary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        <View style={[styles.summaryBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Order Summary</Text>
          <View style={styles.summaryLine}>
            <Text style={[styles.summaryLabel, { color: colors.text + '60' }]}>Subtotal</Text>
            <Text style={[styles.summaryValText, { color: colors.text }]}>NPR {totalPrice}</Text>
          </View>
          <View style={styles.summaryLine}>
            <Text style={[styles.summaryLabel, { color: colors.text + '60' }]}>Delivery Fee</Text>
            <Text style={[styles.summaryValText, { color: colors.text }]}>NPR {deliveryFee}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.totalLine}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount</Text>
            <Text style={[styles.totalValText, { color: colors.primary }]}>NPR {total}</Text>
          </View>
        </View>

        {/* Promo Code Mock */}
        <View style={[styles.promoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.promoLeft}>
            <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
            <Text style={[styles.promoText, { color: colors.text }]}>Apply Promo Code</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text + '40'} />
        </View>
      </ScrollView>

      <View style={[
        styles.footer, 
        { 
          backgroundColor: colors.background, 
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 20) 
        }
      ]}>
        <TouchableOpacity 
            style={[styles.checkoutBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(customer)/checkout')}
        >
          <Text style={styles.checkoutBtnText}>Secure Checkout</Text>
          <Ionicons name="lock-closed" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  emptyContent: { flex: 1, paddingHorizontal: 40 },
  emptyIconBox: { width: 160, height: 160, borderRadius: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  emptySub: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  shopBtn: { paddingHorizontal: 40, paddingVertical: 16, borderRadius: 16 },
  shopBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  content: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 20, marginTop: 10 },
  cartItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  itemImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 16,
  },
  itemImg: { width: '100%', height: '100%' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  itemPrice: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 2,
  },
  qtyBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  qtyVal: { paddingHorizontal: 12, fontWeight: 'bold' },
  removeBtn: { width: 34, height: 34, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  summaryBox: { padding: 20, borderRadius: 20, borderWidth: 1, marginTop: 10, marginBottom: 16 },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14 },
  summaryValText: { fontSize: 14, fontWeight: '600' },
  divider: { height: 1, marginVertical: 16 },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalValText: { fontSize: 20, fontWeight: 'bold' },
  promoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 100,
  },
  promoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  promoText: { fontWeight: '500' },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  checkoutBtn: {
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  checkoutBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
