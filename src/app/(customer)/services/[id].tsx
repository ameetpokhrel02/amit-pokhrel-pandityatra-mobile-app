import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchServiceDetail, Service } from '@/services/api';
import { useTheme } from '@/store/ThemeContext';
import { MotiView } from 'moti';

export default function ServiceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (id) {
      loadService();
    }
  }, [id]);

  const loadService = async () => {
    try {
      const data = await fetchServiceDetail(Number(id));
      setService(data);
    } catch (error) {
      console.error("Failed to load service detail", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Service not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <Text style={{ color: colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
         {/* Image Header with Parallax effect could be added here */}
         <Image 
            source={{ uri: service.image }} 
            style={[styles.headerImage, { backgroundColor: isDark ? '#333' : '#e0e0e0' }]} 
         />
         
         <TouchableOpacity 
            style={[styles.backIcon, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
            onPress={() => router.back()}
         >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
         </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerInfo}>
            <Text style={[styles.title, { color: colors.text }]}>{service.name}</Text>
            <Text style={[styles.price, { color: colors.primary }]}>NPR {service.base_price}</Text>
        </View>

        <View style={[styles.metaInfo, { backgroundColor: colors.card }]}>
            <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={20} color={colors.text} />
                <Text style={{ color: colors.text, marginLeft: 8 }}>
                    {service.base_duration || '2-3 hours'} 
                </Text>
            </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
        <Text style={[styles.description, { color: isDark ? '#CCC' : '#666' }]}>
            {service.description || 'No description available.'}
        </Text>

        {service.samagri_list && service.samagri_list.length > 0 && (
            <View style={styles.samagriSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Required Samagri</Text>
                <View style={[styles.samagriList, { backgroundColor: colors.card }]}>
                    {service.samagri_list.map((item, index) => (
                        <View key={index} style={styles.samagriItem}>
                            <Ionicons name="ellipse" size={8} color={colors.primary} />
                            <Text style={[styles.samagriText, { color: colors.text }]}>
                                {typeof item === 'string' ? item : item.name}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: isDark ? '#333' : '#EEE' }]}>
        <TouchableOpacity 
            style={[styles.bookButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push({
                pathname: '/(customer)/booking',
                params: { serviceId: service.id }
            })}
        >
            <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingBottom: 100,
  },
  headerImage: {
    width: '100%',
    height: 250,
  },
  backIcon: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerInfo: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  metaInfo: {
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginHorizontal: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  samagriSection: {
    marginBottom: 24,
  },
  samagriList: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
  },
  samagriItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  samagriText: {
    marginLeft: 10,
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  bookButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 10,
  }
});
