import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchServiceCategories } from '@/services/booking.service';
import { ServiceCategory } from '@/services/api';
import { useTheme } from '@/store/ThemeContext';
import { MotiView } from 'moti';

export default function ServiceCategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await fetchServiceCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCategory = (category: ServiceCategory, index: number) => (
    <MotiView
      key={category.id}
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 100 }}
      style={[styles.categoryCard, { backgroundColor: isDark ? '#1F1F1F' : '#FFF9F4', borderColor: isDark ? '#333' : '#FDE68A' }]}
    >
      <TouchableOpacity
        onPress={() => router.push({
          pathname: '/(customer)/services/list',
          params: { category: category.id, title: category.name }
        })}
        style={styles.cardTouch}
      >
        <Image
          source={{ uri: category.image || 'https://via.placeholder.com/150' }}
          style={styles.categoryImage}
        />
        <View style={styles.cardOverlay}>
          <Text style={styles.categoryName}>{category.name}</Text>
          {category.description && (
            <Text style={styles.categoryDesc} numberOfLines={2}>{category.description}</Text>
          )}
        </View>
        <View style={[styles.arrowBadge, { backgroundColor: colors.primary }]}>
          <Ionicons name="arrow-forward" size={16} color="#FFF" />
        </View>
      </TouchableOpacity>
    </MotiView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: isDark ? '#333' : '#F3F4F6' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Puja Categories</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 12, color: colors.text }}>Loading categories...</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {categories.map((cat, index) => renderCategory(cat, index))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTouch: {
    flex: 1,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  categoryName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  categoryDesc: {
    fontSize: 14,
    color: '#EEE',
  },
  arrowBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  center: {
    padding: 60,
    alignItems: 'center',
  },
});
