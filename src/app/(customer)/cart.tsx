import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useCart } from '@/store/CartContext';
import { useTheme } from '@/store/ThemeContext';

export default function CartScreen() {
  const router = useRouter();
  const { items, updateQuantity, addToCart, totalPrice } = useCart();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const deliveryFee = 100;
  const total = totalPrice + deliveryFee;

  if (items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: isDark ? '#333' : '#F3F4F6' }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Cart</Text>
          <View style={{ width: 24 }} /> 
        </View>
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="cart-outline" size={64} color={isDark ? '#666' : '#CCC'} />
          <Text style={{ marginTop: 16, fontSize: 16, color: isDark ? '#AAA' : '#666' }}>Your cart is empty</Text>
          <TouchableOpacity 
            style={[styles.checkoutButton, { marginTop: 24, width: 200, backgroundColor: colors.primary }]} 
            onPress={() => router.push('/(customer)/shop')}
          >
            <Text style={styles.checkoutButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: isDark ? '#333' : '#F3F4F6' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Cart</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <ScrollView style={styles.content}>
        {items.map((item) => (
          <View key={item.id} style={[styles.cartItem, { backgroundColor: colors.card }]}>
            <View style={[styles.itemImage, { backgroundColor: isDark ? '#333' : '#F3F4F6' }]}>
               {item.image && (item.image.startsWith('http') || item.image.startsWith('file')) ? (
                  <Image source={{ uri: item.image }} style={{ width: 50, height: 50, borderRadius: 8 }} />
               ) : (
                  <Ionicons name={item.image as any || 'cube-outline'} size={32} color={isDark ? '#AAA' : '#9CA3AF'} />
               )}
            </View>
            <View style={styles.itemDetails}>
              <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.itemPrice, { color: colors.primary }]}>NPR {item.price}</Text>
            </View>
            <View style={[styles.quantityControl, { backgroundColor: isDark ? '#333' : '#F3F4F6' }]}>
              <TouchableOpacity 
                style={styles.qtyButton}
                onPress={() => updateQuantity(item.id, item.quantity - 1)}
              >
                <Ionicons name="remove" size={16} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.qtyText, { color: colors.text }]}>{item.quantity}</Text>
              <TouchableOpacity 
                style={styles.qtyButton}
                onPress={() => addToCart(item)}
              >
                <Ionicons name="add" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: isDark ? '#AAA' : '#666' }]}>Subtotal</Text>
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
            onPress={() => router.push('/(customer)/checkout')}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
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
  cartItem: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 4,
  },
  qtyButton: {
    padding: 4,
  },
  qtyText: {
    marginHorizontal: 8,
    fontWeight: 'bold',
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
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
