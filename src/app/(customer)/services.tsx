import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  ScrollView 
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { fetchCategories, fetchServices } from '@/services/puja.service';
import { getImageUrl } from '@/utils/image';
import { Category, Service } from '@/services/api';

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
        <View style={styles.priceBadge}>
            <Text style={styles.priceText}>Starting NPR {item.base_price}</Text>
        </View>
      </View>
      <View style={styles.serviceInfo}>
        <View style={styles.nameRow}>
            <Text style={[styles.serviceName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
            <View style={[styles.featuredTag, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.featuredTagText, { color: colors.primary }]}>Best Value</Text>
            </View>
        </View>
        <Text style={[styles.serviceDesc, { color: colors.text + '90' }]} numberOfLines={2}>
          {item.description || 'Traditional ritual performed with full devotion and sacred mantras by verified Pandits.'}
        </Text>
        <View style={styles.cardFooter}>
            <View style={styles.durationWrap}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <Text style={[styles.durationText, { color: colors.text }]}>{item.base_duration_minutes || 60} mins</Text>
            </View>
            <TouchableOpacity 
                style={[styles.bookBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push({ pathname: '/(customer)/pandits', params: { searchQuery: item.name } })}
            >
                <Text style={styles.bookBtnText}>Find Pandit</Text>
                <Ionicons name="chevron-forward" size={14} color="#FFF" />
            </TouchableOpacity>
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
            placeholder="Search Rituals (Satyanarayan, Havan...)"
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

      <View style={{ height: 50, marginBottom: 20 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
          <TouchableOpacity 
            style={[
              styles.categoryBtn, 
              !selectedCategoryId && { backgroundColor: Number(colors.primary) ? colors.primary : '#FF6F00', borderColor: colors.primary },
              { borderColor: isDark ? '#2A2A2E' : '#E5E7EB' }
            ]}
            onPress={() => setSelectedCategoryId(null)}
          >
            <Text style={[styles.categoryText, !selectedCategoryId ? { color: '#FFF' } : { color: colors.text }]}>All Rituals</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat.id}
              style={[
                styles.categoryBtn, 
                selectedCategoryId === cat.id && { backgroundColor: Number(colors.primary) ? colors.primary : '#FF6F00', borderColor: colors.primary },
                { borderColor: isDark ? '#2A2A2E' : '#E5E7EB' }
              ]}
              onPress={() => setSelectedCategoryId(cat.id)}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.categoryText, selectedCategoryId === cat.id ? { color: '#FFF' } : { color: colors.text }]}>{cat.name}</Text>
                </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: isDark ? '#AAA' : '#666' }]}>Preparing Sacred Rituals...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredServices}
          renderItem={renderServiceItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
              <View style={styles.listHeader}>
                  <Text style={[styles.listSubtitle, { color: isDark ? '#AAA' : '#666' }]}>
                      Available {filteredServices.length} Ritual Services
                  </Text>
              </View>
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? '#2A2A2E' : '#F9FAFB' }]}>
                <Ionicons name="search-outline" size={48} color={isDark ? '#444' : '#DDD'} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Rituals Found</Text>
              <Text style={[styles.emptyText, { color: isDark ? '#AAA' : '#666' }]}>Try searching for a different ritual or clear filters.</Text>
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
    paddingVertical: 16,
  },
  backBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  searchWrap: { paddingHorizontal: 20, marginBottom: 20 },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    height: 60, 
    borderRadius: 20, 
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '600' },
  categoryList: { paddingHorizontal: 20, gap: 10, alignItems: 'center' },
  categoryBtn: { 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 16, 
    borderWidth: 1, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: { fontSize: 13, fontWeight: '800' },
  listContent: { paddingHorizontal: 20, paddingBottom: 60 },
  listHeader: { marginBottom: 16 },
  listSubtitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  serviceCard: { 
    borderRadius: 32, 
    overflow: 'hidden', 
    marginBottom: 24, 
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  serviceImageWrap: { width: '100%', height: 220, position: 'relative' },
  serviceImage: { width: '100%', height: '100%' },
  priceBadge: { 
    position: 'absolute', 
    bottom: 16, 
    left: 16, 
    backgroundColor: 'rgba(255,255,255,0.95)', 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  priceText: { color: '#000', fontWeight: '900', fontSize: 13 },
  serviceInfo: { padding: 24 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  serviceName: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, flex: 1 },
  featuredTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  featuredTagText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  serviceDesc: { fontSize: 14, lineHeight: 22, marginBottom: 24, fontWeight: '500' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  durationWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  durationText: { fontSize: 14, fontWeight: '900' },
  bookBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 14, 
    borderRadius: 18,
    gap: 8,
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  bookBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 },
  loadingText: { marginTop: 16, fontSize: 14, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '900', marginBottom: 8 },
  emptyText: { textAlign: 'center', width: '80%', lineHeight: 20, fontWeight: '500' },
});
