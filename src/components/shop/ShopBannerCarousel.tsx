import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Linking,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/store/ThemeContext";
import {
  Banner,
  trackBannerClick,
  trackBannerView,
} from "@/services/banner.service";
import { getImageUrl } from "@/utils/image";

interface Slide {
  key: string;
  bannerId?: number;
  image: any;
  title: string;
  subtitle?: string;
  cta?: string;
  discount?: number;
  link?: string;
}

// Shown only when the backend has no active banners (or is unreachable)
const FALLBACK_SLIDES: Slide[] = [
  {
    key: "f1",
    image: require("@/assets/images/hero_3.jpg"),
    title: "Sacred Rituals",
    subtitle: "Complete samagri for every occasion",
  },
  {
    key: "f2",
    image: require("@/assets/images/oils_products.jpg"),
    title: "Authentic Oils",
    subtitle: "Pure & energised spiritual oils",
  },
  {
    key: "f3",
    image: require("@/assets/images/hero_2.jpg"),
    title: "Divine Shanti",
    subtitle: "Spiritual essentials & holistic goods",
  },
];

const GUTTER = 20;
const AUTO_SLIDE_MS = 5000;

export function ShopBannerCarousel({ banners }: { banners: Banner[] }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  // One full-width page per slide keeps the card centred with equal side margins on
  // every screen size; the height scales with width and is capped for tablets.
  const cardHeight = Math.min(Math.round((width - GUTTER * 2) * 0.46), 240);

  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const tracked = useRef(new Set<number>());

  const slides = useMemo<Slide[]>(() => {
    const live = banners
      .map((b) => ({
        key: `b${b.id}`,
        bannerId: b.id,
        image: getImageUrl(b.mobile_image_url || b.image_url),
        title: b.title,
        subtitle: b.description,
        cta: b.link_text,
        discount: b.discount_percentage,
        link: b.link_url,
      }))
      .filter((s) => !!s.image)
      .map((s) => ({ ...s, image: { uri: s.image } }));
    return live.length ? live : FALLBACK_SLIDES;
  }, [banners]);

  // Slides can shrink when live banners replace the fallbacks
  const active = Math.min(index, slides.length - 1);

  // Count each real banner's impression once per mount
  useEffect(() => {
    const id = slides[active]?.bannerId;
    if (id && !tracked.current.has(id)) {
      tracked.current.add(id);
      trackBannerView(id);
    }
  }, [active, slides]);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => {
      const next = (active + 1) % slides.length;
      listRef.current?.scrollToOffset({ offset: next * width, animated: true });
      setIndex(next);
    }, AUTO_SLIDE_MS);
    return () => clearInterval(timer);
  }, [active, slides.length, width]);

  const onPressSlide = (slide: Slide) => {
    if (slide.bannerId) trackBannerClick(slide.bannerId);
    // link_url is usually a web-app path; only absolute links can be opened from the app
    if (slide.link?.startsWith("http"))
      Linking.openURL(slide.link).catch(() => {});
  };

  return (
    <View>
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        keyExtractor={(s) => s.key}
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(Math.max(0, Math.min(i, slides.length - 1)));
        }}
        renderItem={({ item }) => (
          <View style={{ width, paddingHorizontal: GUTTER }}>
            <Pressable
              onPress={() => onPressSlide(item)}
              style={[styles.card, { height: cardHeight }]}
            >
              <Image
                source={item.image}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={250}
              />
              <LinearGradient
                colors={["rgba(0,0,0,0.65)", "rgba(0,0,0,0.15)", "transparent"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.content}>
                {!!item.discount && (
                  <View
                    style={[
                      styles.discount,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text style={styles.discountText}>
                      {item.discount}% OFF
                    </Text>
                  </View>
                )}
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>
                {!!item.subtitle && (
                  <Text style={styles.subtitle} numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                )}
                {!!item.cta && (
                  <View style={styles.cta}>
                    <Text style={[styles.ctaText, { color: colors.primary }]}>
                      {item.cta}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          </View>
        )}
      />

      {slides.length > 1 && (
        <View style={styles.dots}>
          {slides.map((s, i) => (
            <View
              key={s.key}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === active ? colors.primary : colors.border,
                },
                i === active && styles.dotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, overflow: "hidden", backgroundColor: "#E5E7EB" },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    maxWidth: "72%",
  },
  discount: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  discountText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  title: { color: "#FFF", fontSize: 22, fontWeight: "800", lineHeight: 26 },
  subtitle: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
    lineHeight: 16,
  },
  cta: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 12,
  },
  ctaText: { fontSize: 12, fontWeight: "700" },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { width: 18 },
});
