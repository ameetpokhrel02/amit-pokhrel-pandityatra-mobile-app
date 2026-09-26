import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { Banner } from '@/services/banner.service';

const CARD_HEIGHT = 160;

interface PromoBannerRowProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  banners: Banner[];
  defaultCta: string;
}

/** Horizontal row of backend promo banners. Renders nothing when the backend has none. */
export const PromoBannerRow = ({ title, icon, accent, banners, defaultCta }: PromoBannerRowProps) => {
  const router = useRouter();
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  // ~82% on phones so the next card peeks in; capped so tablets show several cards
  const CARD_WIDTH = Math.min(screenWidth * 0.82, 380);

  if (banners.length === 0) return null;

  const openBanner = (banner: Banner) => {
    const link = banner.link_url?.trim();
    if (!link) {
      router.push('/(customer)/shop');
    } else if (/^https?:\/\//i.test(link)) {
      Linking.openURL(link);
    } else {
      router.push(link as any);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.headerIconWrap, { backgroundColor: accent + '15' }]}>
          <Ionicons name={icon} size={18} color={accent} />
        </View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 16}
        snapToAlignment="start"
      >
        {banners.map((banner) => (
          <TouchableOpacity
            key={banner.id}
            activeOpacity={0.9}
            onPress={() => openBanner(banner)}
            style={[styles.card, { width: CARD_WIDTH, backgroundColor: colors.card, borderColor: colors.border + '50' }]}
          >
            <View style={styles.leftSection}>
              <View>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
                  {banner.title}
                </Text>
                {!!banner.description && (
                  <Text style={[styles.itemDesc, { color: colors.text + '80' }]} numberOfLines={2}>
                    {banner.description}
                  </Text>
                )}
              </View>

              <View style={[styles.ctaButton, { backgroundColor: accent }]}>
                <Text style={styles.ctaText}>{banner.link_text || defaultCta}</Text>
                <Ionicons name="arrow-forward" size={13} color="#FFF" />
              </View>
            </View>

            <View style={styles.rightSection}>
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: banner.mobile_image_url || banner.image_url }}
                  style={styles.itemImage}
                  contentFit="contain"
                />
                {!!banner.discount_percentage && (
                  <View style={[styles.discountBadge, { backgroundColor: accent }]}>
                    <Text style={styles.discountText}>{banner.discount_percentage}% OFF</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  scrollContent: { paddingHorizontal: 24, gap: 16 },
  card: {
    height: CARD_HEIGHT,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  leftSection: { flex: 1.2, justifyContent: 'space-between', paddingRight: 12 },
  itemName: { fontSize: 16, fontWeight: '900' },
  itemDesc: { fontSize: 11, marginTop: 4, lineHeight: 16 },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  ctaText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  rightSection: { flex: 0.8 },
  imageWrapper: {
    flex: 1,
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: { width: '80%', height: '80%' },
  discountBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
});
