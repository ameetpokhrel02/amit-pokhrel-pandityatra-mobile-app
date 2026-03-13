import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { fetchBookingSamagri, fetchBookingSamagriRecommendations, fetchPujaSamagriRecommendations } from '@/services/recommender.service';
import { SamagriItem } from '@/services/api';

export default function SamagriRecommendationsScreen() {
  const { bookingId, pujaId } = useLocalSearchParams();
  const router = useRouter();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [items, setItems] = useState<SamagriItem[]>([]);
  const [recommendations, setRecommendations] = useState<SamagriItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [bookingId, pujaId]);

  const loadData = async () => {
    if (!bookingId && !pujaId) return;
    try {
      setLoading(true);
      if (bookingId) {
        const [currentSamagri, aiRecs] = await Promise.all([
          fetchBookingSamagri(Number(bookingId)),
          fetchBookingSamagriRecommendations(Number(bookingId))
        ]);
        setItems(currentSamagri);
        setRecommendations(aiRecs);
      } else if (pujaId) {
        const aiData = await fetchPujaSamagriRecommendations(Number(pujaId));
        // ai_recommend returns direct recommendations matched with DB
        setRecommendations(aiData.recommendations || []);
        // Items can be essentials
        setItems(aiData.recommendations?.filter((r: any) => r.is_essential) || []);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSamagriItem = ({ item }: { item: any }) => (
    <View style={[styles.itemCard, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#000' }]}>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.itemDetail, { color: isDark ? '#AAA' : '#666' }]}>
          {item.quantity} {item.unit}
        </Text>
      </View>
      {item.price && (
        <Text style={[styles.itemPrice, { color: colors.primary }]}>NPR {item.price}</Text>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: isDark ? '#333' : '#E5E7EB' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Samagri Recommendations</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: isDark ? '#AAA' : '#666' }]}>Analyzing ritual requirements...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Required Items</Text>
          </View>
          {items.length > 0 ? (
            items.map((item, index) => <View key={index}>{renderSamagriItem({ item })}</View>)
          ) : (
            <Text style={[styles.emptyText, { color: isDark ? '#AAA' : '#666' }]}>No items listed yet.</Text>
          )}

          <View style={[styles.aiSection, { backgroundColor: colors.primary + '10' }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Suggestions</Text>
            </View>
            <Text style={[styles.aiDescription, { color: isDark ? '#AAA' : '#666' }]}>
              Based on the ritual, our AI suggests these additional items for a complete experience.
            </Text>
            {recommendations.length > 0 ? (
              recommendations.map((item, index) => <View key={index}>{renderSamagriItem({ item })}</View>)
            ) : (
              <Text style={[styles.emptyText, { color: isDark ? '#AAA' : '#666' }]}>No additional suggestions.</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.shopButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(customer)/shop')}
          >
            <Text style={styles.shopButtonText}>Go to Samagri Shop</Text>
            <Ionicons name="cart" size={20} color="#FFF" />
          </TouchableOpacity>
        </ScrollView>
      )}
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
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemDetail: {
    fontSize: 14,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  aiSection: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.2)',
  },
  aiDescription: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 14,
  },
  shopButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6F00',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
    marginBottom: 20,
  },
  shopButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
