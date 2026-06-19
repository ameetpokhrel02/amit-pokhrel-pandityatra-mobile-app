import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

export const FlashSale = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 23, minutes: 43, seconds: 5 });
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;

        if (seconds > 0) {
          seconds -= 1;
        } else if (minutes > 0) {
          minutes -= 1;
          seconds = 59;
        } else if (hours > 0) {
          hours -= 1;
          minutes = 59;
          seconds = 59;
        } else {
          hours = 23;
          minutes = 59;
          seconds = 59;
        }

        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (num: number) => String(num).padStart(2, '0');

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
      >
        {/* First Card - Original Flash Sale */}
        <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 20 }}>
          <TouchableOpacity
            activeOpacity={0.95}
            style={[styles.flashSaleCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/(customer)/shop')}
          >
        {/* Left Content Section */}
        <View style={styles.contentSection}>
          <View style={styles.specialOfferBadge}>
            <Ionicons name="flame" size={14} color="#FF6B00" />
            <Text style={styles.specialOfferText}>Special Offer</Text>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            Pandit Yatra{'\n'}
            Flash <Text style={styles.saleText}>SALE</Text>
          </Text>

          <Text style={[styles.description, { color: colors.text + '80' }]}>
            Discover authentic puja essentials and sacred items. Limited time offers on premium quality spiritual products for your divine ceremonies.
          </Text>

          <View style={styles.bottomRow}>
            <TouchableOpacity
              style={[styles.shopButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(customer)/shop')}
            >
              <Ionicons name="bag-handle-outline" size={16} color="#FFF" />
              <Text style={styles.shopButtonText}>Shop Now</Text>
            </TouchableOpacity>

            <View style={[styles.timerContainer, { backgroundColor: colors.background }]}>
              <Ionicons name="time-outline" size={16} color={colors.text} />
              <Text style={[styles.timerText, { color: colors.text }]}>
                {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
              </Text>
            </View>
          </View>

          <View style={styles.trendingBadge}>
            <Ionicons name="sparkles" size={12} color="#FFA500" />
            <Text style={styles.trendingText}>2026 Trending Sales</Text>
          </View>
        </View>

        {/* Right Image Section */}
        <View style={styles.imageSection}>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>30%</Text>
            <Text style={styles.offText}>OFF</Text>
          </View>

          <View style={styles.flashSaleBadge}>
            <Text style={styles.flashText}>FLASH</Text>
            <Text style={styles.saleTextBadge}>SALE</Text>
            <Text style={styles.upToText}>UP TO</Text>
            <Text style={styles.percentText}>50%</Text>
            <Text style={styles.offTextSmall}>OFF</Text>
          </View>

          <Image
            source={require('@/assets/images/pandit-logo.png')}
            style={styles.panditImage}
            contentFit="contain"
          />
        </View>
      </TouchableOpacity>
        </View>

        {/* Second Card - Nepali Promotional Sale */}
        <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 20 }}>
          <TouchableOpacity
            activeOpacity={0.95}
            style={[styles.nepaliPromoCard, { backgroundColor: '#FF6347' }]}
            onPress={() => router.push('/(customer)/shop')}
          >
            <View style={styles.nepaliPromoContent}>
              <Text style={styles.nepaliPromoTitle}>साथी छुट्टललान,</Text>
              <Text style={styles.nepaliPromoSubtitle}>चिया र खजुरिखपफ छुट्देनुन्</Text>
              <Text style={styles.nepaliPromoDescription}>हरेक घुटकासँग मिठो स्वाद</Text>

              <View style={styles.nepaliPromoActions}>
                <TouchableOpacity
                  style={styles.nepaliPromoButton}
                  onPress={() => router.push('/(customer)/shop')}
                >
                  <Ionicons name="bag-handle" size={16} color="#FF6347" />
                  <Text style={styles.nepaliPromoButtonText}>Shop Now</Text>
                </TouchableOpacity>

                <View style={styles.socialBadges}>
                  <Ionicons name="logo-instagram" size={20} color="#FFF" />
                  <Ionicons name="share-social" size={18} color="#FFF" style={{ marginLeft: 8 }} />
                  <Ionicons name="thumbs-up" size={18} color="#FFF" style={{ marginLeft: 8 }} />
                </View>
              </View>
            </View>

            <View style={styles.nepaliPromoImageSection}>
              <Image
                source={require('@/assets/images/pandit-logo.png')}
                style={styles.nepaliPromoImage}
                contentFit="contain"
              />
            </View>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>

      {/* Pagination Dots */}
      <View style={styles.paginationContainer}>
        {[0, 1].map((_, index) => {
          const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.paginationDot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    position: 'relative',
  },
  flashSaleCard: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    minHeight: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  contentSection: {
    flex: 1,
    paddingRight: 12,
    justifyContent: 'space-between',
  },
  specialOfferBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    marginBottom: 12,
  },
  specialOfferText: {
    color: '#FF6B00',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
    lineHeight: 28,
  },
  saleText: {
    color: '#FF6B00',
  },
  description: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  shopButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  trendingText: {
    color: '#FFA500',
    fontSize: 10,
    fontWeight: '700',
  },
  imageSection: {
    width: 140,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: -10,
    right: 10,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFC107',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  discountText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
  },
  offText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
  },
  flashSaleBadge: {
    position: 'absolute',
    top: 30,
    right: -5,
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 9,
    transform: [{ rotate: '5deg' }],
  },
  flashText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  saleTextBadge: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  upToText: {
    color: '#FFF',
    fontSize: 7,
    fontWeight: '600',
    marginTop: 2,
  },
  percentText: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: '900',
  },
  offTextSmall: {
    color: '#FFD700',
    fontSize: 9,
    fontWeight: '800',
  },
  panditImage: {
    width: 120,
    height: 120,
    marginTop: 20,
  },
  // Nepali Promo Card Styles
  nepaliPromoCard: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    minHeight: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  nepaliPromoContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: 12,
  },
  nepaliPromoTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 4,
  },
  nepaliPromoSubtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  nepaliPromoDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  nepaliPromoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  nepaliPromoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  nepaliPromoButtonText: {
    color: '#FF6347',
    fontSize: 12,
    fontWeight: '900',
  },
  socialBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nepaliPromoImageSection: {
    width: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nepaliPromoImage: {
    width: 120,
    height: 120,
  },
  // Pagination Dots
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
});
