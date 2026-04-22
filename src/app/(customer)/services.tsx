import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  ScrollView,
  Dimensions
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { fetchCategories, fetchServices } from '@/services/puja.service';
import { getImageUrl } from '@/utils/image';
import { Category, Service } from '@/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = (SCREEN_WIDTH - 52) / 2; // (Width - paddingHorizontal*2 - gap) / 2

export default function ServicesListingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const { categoryId } = useLocalSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(categoryId ? Number(categoryId) : null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [cats, servs] = await Promise.all([
          fetchCategories(),
          fetchServices()
        ]);
        setCategories(cats);
        setServices(servs || []);
        setFilteredServices(servs || []);
      } catch (error) {
        console.error('Failed to load services:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    let filtered = services;
    if (selectedCategoryId) {
      filtered = filtered.filter(s => s.category === selectedCategoryId);
    }
    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredServices(filtered || []);
  }, [searchQuery, selectedCategoryId, services]);

  const renderServiceItem = ({ item }: { item: Service }) => (
    <TouchableOpacity 
      style={[styles.serviceCard, { backgroundColor: colors.card, borderColor: isDark ? '#2A2A2E' : '#F0F0F0' }]}
      onPress={() => router.push({ pathname: '/(customer)/pandits', params: { searchQuery: item.name } })}
    >
      <View style={styles.serviceImageWrap}>
        <Image 
          source={{ uri: getImageUrl(item.image) || 'https://images.unsplash.com/photo-1544158404-585ff67ece33?q=80&w=400' }} 
          style={styles.serviceImage}
          contentFit="cover"
        />
        <View style={[styles.priceBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.priceText}>NPR {item.base_price}</Text>
        </View>
      </View>
      <View style={styles.serviceInfo}>
        <Text style={[styles.serviceName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
        <View style={styles.cardFooter}>
            <View style={styles.durationWrap}>
                <Ionicons name="time-outline" size={12} color={colors.primary} />
                <Text style={[styles.durationText, { color: colors.text + '80' }]}>{item.base_duration_minutes || 60} mins</Text>
            </View>
            <View style={[styles.arrowBtn, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDark ? '#2A2A2E' : '#F4F4F5' }]}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ritual Selection</Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: isDark ? '#2A2A2E' : '#F4F4F5' }]}>
            <Ionicons name="heart-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: isDark ? '#2A2A2E' : '#F3F4F6' }]}>
          <Ionicons name="search" size={20} color={colors.primary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search Rituals..."
            placeholderTextColor={isDark ? '#555' : '#999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={isDark ? '#444' : '#CCC'} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={{ height: 44, marginBottom: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
          <TouchableOpacity 
            style={[
              styles.categoryBtn, 
              !selectedCategoryId && { backgroundColor: colors.primary, borderColor: colors.primary },
              { borderColor: isDark ? '#2A2A2E' : '#E5E7EB' }
            ]}
            onPress={() => setSelectedCategoryId(null)}
          >
            <Text style={[styles.categoryText, !selectedCategoryId ? { color: '#FFF' } : { color: colors.text }]}>All</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat.id}
              style={[
                styles.categoryBtn, 
                selectedCategoryId === cat.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                { borderColor: isDark ? '#2A2A2E' : '#E5E7EB' }
              ]}
              onPress={() => setSelectedCategoryId(cat.id)}
            >
                <Text style={[styles.categoryText, selectedCategoryId === cat.id ? { color: '#FFF' } : { color: colors.text }]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredServices}
          renderItem={renderServiceItem}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
              <View style={styles.listHeader}>
                  <Text style={[styles.listSubtitle, { color: isDark ? '#AAA' : '#666' }]}>
                      Available {filteredServices.length} Rituals
                  </Text>
              </View>
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="search-outline" size={48} color={isDark ? '#444' : '#DDD'} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Rituals Found</Text>
            </View>
          }
        />
      )}
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
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  searchWrap: { paddingHorizontal: 20, marginBottom: 16 },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    height: 52, 
    borderRadius: 16, 
    borderWidth: 1,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600' },
  categoryList: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  categoryBtn: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 12, 
    borderWidth: 1, 
  },
  categoryText: { fontSize: 12, fontWeight: '800' },
  listContent: { paddingHorizontal: 20, paddingBottom: 60 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 16 },
  listHeader: { marginBottom: 12 },
  listSubtitle: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  serviceCard: { 
    width: COLUMN_WIDTH,
    borderRadius: 24, 
    overflow: 'hidden', 
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  serviceImageWrap: { width: '100%', height: 140, position: 'relative' },
  serviceImage: { width: '100%', height: '100%' },
  priceBadge: { 
    position: 'absolute', 
    bottom: 8, 
    left: 8, 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8,
  },
  priceText: { color: '#FFF', fontWeight: '900', fontSize: 10 },
  serviceInfo: { padding: 12 },
  serviceName: { fontSize: 15, fontWeight: '900', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  durationWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  durationText: { fontSize: 11, fontWeight: '700' },
  arrowBtn: { width: 28, height: 28, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 },
  emptyTitle: { fontSize: 16, fontWeight: '900', marginTop: 12 },
});
