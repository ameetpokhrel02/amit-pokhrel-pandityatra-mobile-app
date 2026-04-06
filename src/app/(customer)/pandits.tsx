import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/theme/colors';
import { usePanditStore } from '@/store/pandit.store';
import { useAuthStore } from '@/store/auth.store';
import { PanditCard } from '@/components/pandit/PanditCard';
import { PanditFilterSheet } from '@/components/pandit/PanditFilterSheet';
import { Pandit } from '@/types/pandit';
import { useTheme } from '@/store/ThemeContext';

export default function PanditListingPage() {
  const router = useRouter();
  const { searchQuery } = useLocalSearchParams<{ searchQuery?: string }>();
  const { pandits, isLoading, error, fetchPandits, filter, setFilter } = usePanditStore();
  const { isAuthenticated } = useAuthStore();
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (searchQuery) {
      setFilter({ searchQuery });
    } else {
      fetchPandits();
    }
  }, [searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPandits();
    setRefreshing(false);
  }, [fetchPandits]);

  const handleSearch = (text: string) => {
    setFilter({ searchQuery: text });
  };

  const renderItem = useCallback(({ item, index }: { item: Pandit; index: number }) => (
    <PanditCard
      pandit={item}
      index={index}
      onPress={() => router.push(`/(customer)/pandit/${item.id}`)}
      onBook={() => {
        if (!isAuthenticated) {
          Alert.alert('Login Required', 'Please login or register to book a Pandit.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => router.push('/(public)/role-selection' as any) }
          ]);
          return;
        }
        router.push(`/(customer)/booking?panditId=${item.id}`);
      }}
    />
  ), [isAuthenticated, router]);

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
        style={[styles.header, { backgroundColor: '#FF6F00' }]}
      >
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Pandit, Puja..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={filter.searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterVisible(true)}>
          <Ionicons name="options-outline" size={24} color="#FF6F00" />
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
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={8}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
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
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  listContent: {
    paddingTop: 20,
    paddingBottom: 20,
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
