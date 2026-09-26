import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  RefreshControl,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCartStore } from '@/store/cart.store';
import { useTheme } from '@/store/ThemeContext';
import { useShopData, SORT_OPTIONS, ShopItem } from '@/hooks/customer/useShopData';
import { ProductCard } from '@/components/shop/ProductCard';
import { ShopBannerCarousel } from '@/components/shop/ShopBannerCarousel';

const GUTTER = 20;
const COLUMN_GAP = 12;
// Keep cards around phone-card size on tablets / foldables / landscape
const MIN_CARD_WIDTH = 160;
const MAX_COLUMNS = 4;

export default function ShopScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const numColumns = Math.max(2, Math.min(MAX_COLUMNS, Math.floor((width - GUTTER * 2 + COLUMN_GAP) / (MIN_CARD_WIDTH * 1.4 + COLUMN_GAP))));
  const cardWidth = (width - GUTTER * 2 - COLUMN_GAP * (numColumns - 1)) / numColumns;

  const { items: cartItems, totalItems, addToCart, updateQuantity } = useCartStore();
  const {
    loading,
    refreshing,
    error,
    refresh,
    retry,
    products,
    categories,
    banners,
    selectedCategory,
    setSelectedCategory,
    sort,
    setSort,
    wishlist,
    searchQuery,
    setSearchQuery,
    handleToggleWishlist,
    filteredProducts,
  } = useShopData();

  const [sortOpen, setSortOpen] = useState(false);
  const isSearching = searchQuery.trim().length > 0;
  const activeSortLabel = SORT_OPTIONS.find((o) => o.key === sort)?.label;
  const selectedCategoryName = categories.find((c) => c.id === selectedCategory)?.name;

  const quantityOf = (id: number) => cartItems.find((c) => String(c.id) === String(id))?.quantity ?? 0;

  const addItem = (item: ShopItem) =>
    addToCart({
      id: String(item.id),
      name: item.name,
      price: Number(item.price),
      image: item.image,
      category: item.category_name,
      description: item.description,
    });

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background }]}>
      <View style={styles.titleRow}>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            Samagri Shop
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            Authentic puja essentials, delivered
          </Text>
        </View>
        <View style={styles.headerActions}>
          <IconButton icon="heart-outline" count={wishlist.length} onPress={() => router.push('/(customer)/wishlist' as any)} />
          <IconButton icon="bag-handle-outline" count={totalItems} onPress={() => router.push('/(customer)/cart')} />
        </View>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search diyo, mala, incense…"
          placeholderTextColor={colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCorrect={false}
        />
        {isSearching && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const listHeader = (
    <View>
      {!isSearching && (
        <View style={styles.bannerSection}>
          <ShopBannerCarousel banners={banners} />
        </View>
      )}

      {categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {[{ id: null as number | null, name: 'All' }, ...categories].map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={String(cat.id)}
                onPress={() => setSelectedCategory(cat.id)}
                style={[
                  styles.chip,
                  active
                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                    : { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.chipText, { color: active ? '#FFF' : colors.text }]}>{cat.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.sectionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]} numberOfLines={1}>
            {isSearching ? `Results for “${searchQuery.trim()}”` : selectedCategoryName ?? 'All products'}
          </Text>
          <Text style={[styles.count, { color: colors.textSecondary }]}>
            {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.sortBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => setSortOpen(true)}
        >
          <Ionicons name="swap-vertical" size={14} color={colors.text} />
          <Text style={[styles.sortText, { color: colors.text }]}>{sort === 'featured' ? 'Sort' : activeSortLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBody = () => {
    if (loading && products.length === 0) return <ShopSkeleton cardWidth={cardWidth} numColumns={numColumns} />;

    if (error && products.length === 0) {
      return (
        <StateMessage
          icon="cloud-offline-outline"
          title="Shop unavailable"
          message={error}
          actionLabel="Try again"
          onAction={retry}
        />
      );
    }

    return (
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => String(item.id)}
        key={`grid-${numColumns}`}
        numColumns={numColumns}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />}
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            width={cardWidth}
            isWishlisted={wishlist.includes(item.id)}
            quantityInCart={quantityOf(item.id)}
            onPress={() => router.push(`/(customer)/shop/${item.id}`)}
            onToggleWishlist={() => handleToggleWishlist(item.id)}
            onAdd={() => addItem(item)}
            onDecrement={() => updateQuantity(String(item.id), quantityOf(item.id) - 1)}
          />
        )}
        ListEmptyComponent={
          <StateMessage
            icon="search-outline"
            title="Nothing found"
            message={isSearching ? 'Try a different word or clear the filters.' : 'No products in this category yet.'}
            actionLabel={isSearching || selectedCategory !== null ? 'Clear filters' : undefined}
            onAction={() => {
              setSearchQuery('');
              setSelectedCategory(null);
            }}
          />
        }
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {header}
      {renderBody()}

      <Modal visible={sortOpen} transparent animationType="fade" onRequestClose={() => setSortOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSortOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Sort by</Text>
            {SORT_OPTIONS.map((option) => {
              const active = option.key === sort;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={styles.sheetOption}
                  onPress={() => {
                    setSort(option.key);
                    setSortOpen(false);
                  }}
                >
                  <Text style={[styles.sheetOptionText, { color: active ? colors.primary : colors.text }]}>{option.label}</Text>
                  {active && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function IconButton({ icon, count, onPress }: { icon: keyof typeof Ionicons.glyphMap; count: number; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={colors.text} />
      {count > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function StateMessage({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.state}>
      <View style={[styles.stateIcon, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <Text style={[styles.stateTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.stateMessage, { color: colors.textSecondary }]}>{message}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={[styles.stateBtn, { backgroundColor: colors.primary }]} onPress={onAction}>
          <Text style={styles.stateBtnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function ShopSkeleton({ cardWidth, numColumns }: { cardWidth: number; numColumns: number }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const block = { backgroundColor: colors.border + '90' };
  return (
    <View style={styles.skeleton}>
      <View style={[styles.skeletonBanner, block, { height: Math.min(Math.round((width - GUTTER * 2) * 0.46), 240) }]} />
      <View style={styles.skeletonChips}>
        {[56, 72, 88, 64].map((w) => (
          <View key={w} style={[styles.skeletonChip, block, { width: w }]} />
        ))}
      </View>
      <View style={styles.skeletonGrid}>
        {Array.from({ length: numColumns * 2 }, (_, i) => (
          <View key={i} style={{ width: cardWidth }}>
            <View style={[styles.skeletonImage, block]} />
            <View style={[styles.skeletonLine, block, { width: '80%' }]} />
            <View style={[styles.skeletonLine, block, { width: '45%' }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: { paddingHorizontal: GUTTER, paddingBottom: 12 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 },
  titleBlock: { flex: 1, minWidth: 0 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', alignItems: 'center' },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },

  listContent: { paddingBottom: 32 },
  bannerSection: { marginTop: 4, marginBottom: 18 },
  chips: { paddingHorizontal: GUTTER, gap: 8 },
  chip: { paddingHorizontal: 16, height: 36, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center' },
  chipText: { fontSize: 13, fontWeight: '600' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: GUTTER, marginTop: 22, marginBottom: 14, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  count: { fontSize: 12, marginTop: 2 },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sortText: { fontSize: 12, fontWeight: '600' },

  row: { paddingHorizontal: GUTTER, gap: COLUMN_GAP, marginBottom: COLUMN_GAP },

  state: { alignItems: 'center', paddingHorizontal: 40, paddingVertical: 48 },
  stateIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  stateTitle: { fontSize: 17, fontWeight: '700' },
  stateMessage: { fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  stateBtn: { marginTop: 18, paddingHorizontal: 22, height: 42, borderRadius: 21, justifyContent: 'center' },
  stateBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: GUTTER, paddingTop: 10 },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 14 },
  sheetTitle: { fontSize: 17, fontWeight: '800', marginBottom: 6 },
  sheetOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  sheetOptionText: { fontSize: 15, fontWeight: '600' },

  skeleton: { paddingTop: 4 },
  skeletonBanner: { borderRadius: 20, marginHorizontal: GUTTER },
  skeletonChips: { flexDirection: 'row', gap: 8, paddingHorizontal: GUTTER, marginTop: 30 },
  skeletonChip: { height: 36, borderRadius: 18 },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: COLUMN_GAP, paddingHorizontal: GUTTER, marginTop: 64 },
  skeletonImage: { aspectRatio: 1, borderRadius: 18 },
  skeletonLine: { height: 12, borderRadius: 6, marginTop: 10 },
});
