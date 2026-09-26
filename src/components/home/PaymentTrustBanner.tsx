import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, NativeSyntheticEvent, NativeScrollEvent, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/store/ThemeContext';

const SLIDE_HEIGHT = 140;

const SLIDES = [
  { id: 'esewa', image: require('@/assets/images/payment-esewa.png') },
  { id: 'khalti', image: require('@/assets/images/payment-khalti.png') },
  { id: 'stripe', image: require('@/assets/images/payment-stripe.png') },
];

export const PaymentTrustBanner = () => {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const SLIDE_WIDTH = screenWidth - 48; // matches the app's 24px section gutters
  const listRef = useRef<FlatList>(null);
  const indexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % SLIDES.length;
      listRef.current?.scrollToIndex({ index: indexRef.current, animated: true });
      setActiveIndex(indexRef.current);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SLIDE_WIDTH);
    indexRef.current = index;
    setActiveIndex(index);
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.slogan, { color: colors.text }]}>
        Fast <Text style={{ color: colors.text + '40' }}>•</Text> Secure <Text style={{ color: colors.text + '40' }}>•</Text> Trusted Payments
      </Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <FlatList
          ref={listRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
          getItemLayout={(_, index) => ({ length: SLIDE_WIDTH, offset: SLIDE_WIDTH * index, index })}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
              <Image source={item.image} style={{ width: '84%', height: '100%' }} contentFit="contain" />
            </View>
          )}
        />
      </View>

      <View style={styles.dots}>
        {SLIDES.map((slide, i) => (
          <View
            key={slide.id}
            style={[
              styles.dot,
              { backgroundColor: i === activeIndex ? colors.primary : colors.border },
              i === activeIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 24, marginTop: 20 },
  slogan: { fontSize: 13, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  card: {
    height: SLIDE_HEIGHT,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { width: 16 },
});
