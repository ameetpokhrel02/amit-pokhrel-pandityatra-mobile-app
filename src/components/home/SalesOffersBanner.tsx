import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCartStore } from '@/store/cart.store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.82;
const CARD_HEIGHT = 160;

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

interface SpecialOffer {
  id: string;
  name: string;
  tagline: string;
  price: number;
  originalPrice: number;
  discount: number;
  image: string;
  offersLeft: number;
  points: number;
}

const SPECIAL_OFFERS: SpecialOffer[] = [
  {
    id: 'so_1',
    name: 'Brass Designer Puja Thali',
    tagline: 'Elegant plate for daily prayers',
    price: 975,
    originalPrice: 1500,
    discount: 35,
    image: 'https://res.cloudinary.com/dm0vvpzs9/image/upload/v1777722110/image-Photoroom_5_zl1nug.png',
    offersLeft: 18,
    points: 1200,
  },
  {
    id: 'so_2',
    name: 'Haldi & Kumkum Spoon Set',
    tagline: 'Artisan double-sided ritual spoon',
    price: 495,
    originalPrice: 900,
    discount: 45,
    image: 'https://res.cloudinary.com/dm0vvpzs9/image/upload/v1775157041/media/samagri_images/haldi_b__and_kumkum_spoon_lcsomt.png',
    offersLeft: 22,
    points: 850,
  },
];

export const SalesOffersBanner = () => {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const addToCart = useCartStore((state) => state.addToCart);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 6, minutes: 15, seconds: 40 });

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
          hours = 6;
          minutes = 15;
          seconds = 40;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (num: number) => String(num).padStart(2, '0');

  const handleAddToCart = (item: SpecialOffer) => {
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
          <View style={[styles.headerIconWrap, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="sparkles" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Special Offers</Text>
        </View>

        {/* Countdown Timer */}
        <View style={[styles.timerContainer, { backgroundColor: isDark ? '#27272A' : '#FFF7ED' }]}>
          <Ionicons name="time" size={14} color={colors.primary} />
          <Text style={[styles.timerText, { color: colors.primary }]}>
            {formatTime(timeLeft.hours)}h {formatTime(timeLeft.minutes)}m {formatTime(timeLeft.seconds)}s
          </Text>
        </View>
      </View>

      {/* Horizontal Scrollable Special Items */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 16}
        snapToAlignment="start"
      >
        {SPECIAL_OFFERS.map((item) => (
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
                <Text style={[styles.stockBadgeText, { color: colors.primary }]}>
                  ONLY {item.offersLeft} LEFT
                </Text>
              </View>

              {/* Title & Description */}
              <View style={styles.textWrap}>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.itemDesc, { color: colors.text + '80' }]} numberOfLines={1}>
                  {item.tagline}
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

              {/* Action Button */}
              <TouchableOpacity
                style={[styles.buyButton, { backgroundColor: colors.primary }]}
                onPress={() => handleAddToCart(item)}
              >
                <Ionicons name="bag-handle" size={13} color="#FFF" />
                <Text style={styles.buyButtonText}>Claim Deal</Text>
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
                <View style={[styles.discountBadge, { backgroundColor: colors.primary }]}>
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
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stockBadgeText: {
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
