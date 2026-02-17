import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchServices, Service } from '@/services/api';
import { useTheme } from '@/store/ThemeContext';
import { MotiView } from 'moti';

export default function ServicesListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string, search?: string, title?: string }>();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    loadServices();
  }, [params.category, params.search]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await fetchServices({ 
        category: params.category ? Number(params.category) : undefined,
        search: params.search 
      });
      setServices(data);
    } catch (error) {
      console.error("Failed to fetch services", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }: { item: Service, index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * 100 }}
    >
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: colors.card }]}
        onPress={() => router.push(`/(customer)/services/${item.id}`)}
      >
        <Image 
            source={{ uri: item.image || 'https://via.placeholder.com/150' }} 
            style={[styles.image, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]} 
        />
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.price, { color: colors.primary }]}>NPR {item.base_price}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.text} style={{ opacity: 0.5 }} />
      </TouchableOpacity>
    </MotiView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{params.title || 'Services'}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={services}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: colors.text }}>No services found.</Text>
            </View>
          }
        />
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
    padding: 16,
    paddingTop: 60, // Safe area
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
});
