import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchCategories as fetchServiceCategories } from '@/services/puja.service';
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

  const renderCategory = (category: ServiceCategory, index: number) => {
    // Determine a fallback icon based on category name if possible
    let categoryIcon = "sparkles";
    if (category.name.toLowerCase().includes('daily')) categoryIcon = "calendar-outline";
    if (category.name.toLowerCase().includes('sanskara')) categoryIcon = "people-outline";
    if (category.name.toLowerCase().includes('festival')) categoryIcon = "flame-outline";

    return (
      <MotiView
        key={category.id}
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: index * 100, type: 'timing', duration: 500 }}
        style={[styles.categoryCard, {
          backgroundColor: isDark ? '#2D2D2D' : '#FFF',
          borderColor: isDark ? '#444' : '#FDE68A',
          borderWidth: isDark ? 0 : 1
        }]}
      >
        <TouchableOpacity
          onPress={() => router.push({
            pathname: '/(customer)/services/list',
            params: { category: category.id, title: category.name }
          })}
          style={styles.cardTouch}
          activeOpacity={0.9}
        >
          <View style={styles.imageWrapper}>
            {category.image ? (
              <Image
                source={{ uri: category.image }}
                style={styles.categoryImage}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.fallbackImageContainer, { backgroundColor: isDark ? '#3D3D3D' : '#FEF3C7' }]}>
                <Ionicons name={categoryIcon as any} size={60} color="#D97706" style={{ opacity: 0.5 }} />
              </View>
            )}
            <View style={styles.cardOverlay}>
              <View style={styles.textColumn}>
                <Text style={styles.categoryName}>{category.name}</Text>
                {category.description && (
                  <Text style={styles.categoryDesc} numberOfLines={2}>{category.description}</Text>
                )}
              </View>
              <View style={[styles.arrowBadge, { backgroundColor: '#D97706' }]}>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </MotiView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FFFBFA' }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: isDark ? '#333' : '#F3F4F6' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Explore Pujas</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introSection}>
          <Text style={[styles.introTitle, { color: colors.text }]}>Sacred Categories</Text>
          <Text style={[styles.introSub, { color: colors.text, opacity: 0.6 }]}>
            Choose a category to find the right puja for your needs
          </Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#D97706" />
            <Text style={{ marginTop: 12, color: colors.text, opacity: 0.7 }}>Loading sacred rituals...</Text>
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
    paddingTop: 60,
    paddingBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  introSection: {
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  introSub: {
    fontSize: 14,
  },
  grid: {
    gap: 20,
  },
  categoryCard: {
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardTouch: {
    flex: 1,
  },
  imageWrapper: {
    flex: 1,
    position: 'relative',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  fallbackImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.45)', // Darker for better text contrast
  },
  textColumn: {
    flex: 1,
    marginRight: 10,
  },
  categoryName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  categoryDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },
  arrowBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  center: {
    padding: 60,
    alignItems: 'center',
  },
});
