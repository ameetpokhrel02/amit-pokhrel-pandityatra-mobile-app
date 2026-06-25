import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '@/store/cart.store';
import { Banner } from '@/services/banner.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.82;
const CARD_HEIGHT = 160;

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

interface FlashSaleItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  discount: number;
  image: string;
  offersLeft: number;
}

const FLASH_ITEMS: FlashSaleItem[] = [
  {
    id: 'fs_1',
    name: 'Sacred Havan Kit',
    description: 'Complete items for holy fire rituals',
    price: 1250,
    originalPrice: 2500,
    discount: 50,
    image: 'https://res.cloudinary.com/dm0vvpzs9/image/upload/v1781149969/brynr0mrk6pvizenegwu.png',
    offersLeft: 12,
  },
  {
    id: 'fs_2',
    name: 'Premium Brass Diya',
    description: 'Exquisite hand-carved oil lamp',
    price: 840,
    originalPrice: 1400,
    discount: 40,
    image: 'https://res.cloudinary.com/dm0vvpzs9/image/upload/v1780847704/wgdmwhyykoqubldpkavy.png',
    offersLeft: 8,
  },
  {
    id: 'fs_3',
    name: 'Vedic Copper Kalash',
    description: 'Pure copper vessel for holy water',
    price: 630,
    originalPrice: 900,
    discount: 30,
    image: 'https://res.cloudinary.com/dm0vvpzs9/image/upload/v1781150040/rdzkpsnundr3khz0rzth.png',
    offersLeft: 15,
  },
];

export const FlashSale = ({ banners }: { banners?: Banner[] }) => {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const addToCart = useCartStore((state) => state.addToCart);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 4, minutes: 32, seconds: 15 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds -= 1;
        } else if (minutes > 0) {
          minutes = 59;
          seconds = 59;
          hours = hours > 0 ? hours - 1 : 23;
        } else if (hours > 0) {
          hours -= 1;
          minutes = 59;
          seconds = 59;
        } else {
          hours = 4;
          minutes = 32;
          seconds = 15;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (num: number) => String(num).padStart(2, '0');

  const items = React.useMemo(() => {
    const saleBanners = banners?.filter(b => b.banner_type === 'SALE_BANNER') || [];
    if (saleBanners.length > 0) {
      return saleBanners.map((b) => {
        const seed = b.id || 1;
        const originalPrice = 500 + (seed % 10) * 200;
        const discount = b.discount_percentage || 20;
        const price = Math.round(originalPrice * (1 - discount / 100));
        const offersLeft = 5 + (seed % 15);
        return {
          id: `fs_${b.id}`,
          name: b.title,
          description: b.description || 'Exclusive deal from PanditYatra',
          price,
          originalPrice,
          discount,
          image: b.mobile_image_url || b.image_url,
          offersLeft,
        };
      });
    }
    return FLASH_ITEMS;
  }, [banners]);

  const handleAddToCart = (item: FlashSaleItem) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
    } as any);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerIconWrap, { backgroundColor: '#EF444415' }]}>
            <Ionicons name="flame" size={20} color="#EF4444" />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Flash Sale</Text>
        </View>

        {/* Global Countdown Timer */}
        <View style={[styles.timerContainer, { backgroundColor: isDark ? '#27272A' : '#FEE2E2' }]}>
          <Ionicons name="time" size={14} color="#EF4444" />
          <Text style={[styles.timerText, { color: '#EF4444' }]}>
            {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
          </Text>
        </View>
      </View>

      {/* Horizontal Scrollable Flash Items */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 16}
        snapToAlignment="start"
      >
        {items.map((item) => (
          <View
            key={item.id}
            style={[
              styles.cardContainer,
              {
                backgroundColor: colors.card,
                borderColor: colors.border + '50',
                borderWidth: 1,
              },
            ]}
          >
            {/* Left Content Side */}
            <View style={styles.leftSection}>
              {/* Badge: Stock left */}
              <View style={styles.stockBadge}>
                <Text style={styles.stockBadgeText}>ONLY {item.offersLeft} LEFT</Text>
              </View>

              {/* Title & Description */}
              <View style={styles.textWrap}>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.itemDesc, { color: colors.text + '80' }]} numberOfLines={1}>
                  {item.description}
                </Text>
              </View>

              {/* Pricing & Discount */}
              <View style={styles.priceRow}>
                <Text style={[styles.discountPrice, { color: colors.primary }]}>
                  NPR {item.price}
                </Text>
                <Text style={styles.originalPrice}>
                  NPR {item.originalPrice}
                </Text>
              </View>

              {/* Action: Add to Cart */}
              <TouchableOpacity
                style={[styles.buyButton, { backgroundColor: colors.primary }]}
                onPress={() => handleAddToCart(item)}
              >
                <Ionicons name="cart" size={14} color="#FFF" />
                <Text style={styles.buyButtonText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>

            {/* Right Image Side */}
            <View style={styles.rightSection}>
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: item.image }}
                  style={styles.itemImage}
                  contentFit="contain"
                />
                {/* Discount Badge */}
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{item.discount}% OFF</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 16,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  leftSection: {
    flex: 1.2,
    justifyContent: 'space-between',
  },
  stockBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stockBadgeText: {
    color: '#EF4444',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textWrap: {
    marginTop: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '900',
  },
  itemDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 4,
  },
  discountPrice: {
    fontSize: 16,
    fontWeight: '900',
  },
  originalPrice: {
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    marginTop: 6,
  },
  buyButtonText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  rightSection: {
    flex: 0.8,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  itemImage: {
    width: '80%',
    height: '80%',
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
});
