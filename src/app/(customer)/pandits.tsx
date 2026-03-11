import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { usePanditStore } from '@/store/pandit.store';
import { PanditCard } from '@/components/pandit/PanditCard';
import { PanditFilterSheet } from '@/components/pandit/PanditFilterSheet';
import { Pandit } from '@/types/pandit';
import { useTheme } from '@/store/ThemeContext';

export default function PanditListingPage() {
  const router = useRouter();
  const { pandits, isLoading, error, fetchPandits, filter, setFilter } = usePanditStore();
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    fetchPandits();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPandits();
    setRefreshing(false);
  }, [fetchPandits]);

  const handleSearch = (text: string) => {
    setFilter({ searchQuery: text });
  };

  const renderItem = ({ item, index }: { item: Pandit; index: number }) => (
    <PanditCard
      pandit={item}
      index={index}
      onPress={() => router.push(`/(customer)/pandit/${item.id}`)}
      onBook={() => router.push(`/(customer)/booking?panditId=${item.id}`)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? '#333' : '#F5F5F5' }]}>
        <Ionicons name="search" size={48} color={isDark ? '#666' : '#CCC'} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Pandits Found</Text>
      <Text style={[styles.emptySubtitle, { color: isDark ? '#AAA' : '#999' }]}>Try adjusting your filters or search terms.</Text>
      <TouchableOpacity style={[styles.clearButton, { borderColor: colors.primary }]} onPress={() => setFilter({ searchQuery: '', location: undefined, minRating: undefined, availability: undefined })}>
        <Text style={[styles.clearButtonText, { color: colors.primary }]}>Clear Filters</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sticky Header with Search & Filter */}
      <View
        style={[styles.header, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#000' }]}
      >
        <View style={[styles.searchContainer, { backgroundColor: isDark ? '#333' : '#F5F5F5' }]}>
          <Ionicons name="search-outline" size={20} color={isDark ? '#AAA' : '#999'} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search Pandit, Puja..."
            placeholderTextColor={isDark ? '#AAA' : '#999'}
            value={filter.searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: colors.primary }]} onPress={() => setFilterVisible(true)}>
          <Ionicons name="options-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading && !refreshing && pandits.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: isDark ? '#AAA' : '#666' }]}>Finding the best Pandits...</Text>
        </View>
      ) : (
        <FlatList
          data={pandits}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
          }
          ListEmptyComponent={!isLoading ? renderEmptyState : null}
        />
      )}

      {/* Filter Sheet */}
      <PanditFilterSheet
        visible={isFilterVisible}
        onClose={() => setFilterVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    zIndex: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  clearButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  clearButtonText: {
    fontWeight: '600',
  },
});
