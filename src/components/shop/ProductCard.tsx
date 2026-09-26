import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { getImageUrl } from '@/utils/image';
import type { ShopItem } from '@/hooks/customer/useShopData';

interface ProductCardProps {
  item: ShopItem;
  width: number;
  isWishlisted: boolean;
  quantityInCart: number;
  onPress: () => void;
  onToggleWishlist: () => void;
  onAdd: () => void;
  onDecrement: () => void;
}

const LOW_STOCK = 5;

const UNIT_LABELS: Record<string, string> = { pcs: 'piece', pc: 'piece', ml: 'ml', g: 'g', kg: 'kg', l: 'litre' };

export const formatNPR = (value: number | string) =>
  `Rs ${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export function ProductCard({
  item,
  width,
  isWishlisted,
  quantityInCart,
  onPress,
  onToggleWishlist,
  onAdd,
  onDecrement,
}: ProductCardProps) {
  const { colors } = useTheme();
  const imageUri = getImageUrl(item.image);
  const stock = item.stock_quantity;
  const isOutOfStock = stock === 0;
  const isLowStock = typeof stock === 'number' && stock > 0 && stock <= LOW_STOCK;
  const shopName = item.vendor_details?.shop_name;

  return (
    // Static style (not a Pressable style callback): NativeWind's jsx runtime drops function
    // styles on native, which left the card with no width/radius on device.
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, { width, backgroundColor: colors.card, borderColor: colors.border + '80' }]}
    >
      <View style={[styles.imageWrap, { backgroundColor: colors.background }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" transition={200} />
        ) : (
          <Ionicons name="image-outline" size={32} color={colors.textSecondary + '60'} />
        )}

        {isOutOfStock && (
          <View style={styles.soldOut}>
            <Text style={styles.soldOutText}>Out of stock</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.heart}
          onPress={onToggleWishlist}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Ionicons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={18}
            color={isWishlisted ? colors.primary : '#1A1A1A'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {!!item.category_name && (
          <Text style={[styles.category, { color: colors.primary }]} numberOfLines={1}>
            {item.category_name}
          </Text>
        )}
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
          {item.name}
        </Text>
        {!!shopName && (
          <Text style={[styles.vendor, { color: colors.textSecondary }]} numberOfLines={1}>
            {shopName}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={styles.priceBlock}>
            <Text style={[styles.price, { color: colors.text }]} numberOfLines={1}>
              {formatNPR(item.price)}
            </Text>
            {isLowStock ? (
              <Text style={[styles.meta, { color: colors.danger }]}>Only {stock} left</Text>
            ) : !!item.unit ? (
              <Text style={[styles.meta, { color: colors.textSecondary }]}>per {UNIT_LABELS[item.unit.toLowerCase()] ?? item.unit}</Text>
            ) : null}
          </View>

          {!isOutOfStock &&
            (quantityInCart > 0 ? (
              <View style={[styles.stepper, { backgroundColor: colors.primary }]}>
                <TouchableOpacity onPress={onDecrement} hitSlop={6} accessibilityLabel="Decrease quantity">
                  <Ionicons name="remove" size={16} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.stepperCount}>{quantityInCart}</Text>
                <TouchableOpacity onPress={onAdd} hitSlop={6} accessibilityLabel="Increase quantity">
                  <Ionicons name="add" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: colors.primary }]}
                onPress={onAdd}
                accessibilityLabel={`Add ${item.name} to cart`}
              >
                <Ionicons name="add" size={20} color="#FFF" />
              </TouchableOpacity>
            ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  imageWrap: { aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%' },
  soldOut: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutText: {
    backgroundColor: '#1A1A1A',
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: { padding: 12, paddingTop: 10, flex: 1 },
  category: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 3 },
  name: { fontSize: 14, fontWeight: '600', lineHeight: 19, minHeight: 38 },
  vendor: { fontSize: 11, marginTop: 2 },
  footer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10, gap: 6 },
  priceBlock: { flex: 1 },
  price: { fontSize: 15, fontWeight: '800' },
  meta: { fontSize: 10, fontWeight: '600', marginTop: 1 },
  addBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 9,
    gap: 8,
  },
  stepperCount: { color: '#FFF', fontSize: 13, fontWeight: '800', minWidth: 12, textAlign: 'center' },
});
