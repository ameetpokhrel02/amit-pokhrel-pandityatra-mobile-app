import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { fetchServices } from '@/services/booking.service';
import { Service } from '@/services/api';
import { useTheme } from '@/store/ThemeContext';
import { MotiView } from 'moti';

export default function ServicesListScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ category?: string, search?: string, title?: string }>();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(params.search || '');
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
                search: searchQuery || undefined
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
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 50 }}
            style={[styles.productCard, { backgroundColor: isDark ? '#1F1F1F' : '#FFF9F4', borderColor: isDark ? '#333' : '#FDE68A' }]}
        >
            <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => router.push(`/(customer)/services/${item.id}`)}
            >
                <View style={[styles.imageContainer, { backgroundColor: isDark ? '#2a2a2a' : '#FFF' }]}>
                    {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.productImage} contentFit="cover" />
                    ) : (
                        <View style={[styles.placeholderImage, { backgroundColor: isDark ? '#333' : '#F3F4F6' }]}>
                            <Ionicons name="image-outline" size={40} color={isDark ? '#555' : '#CCC'} />
                        </View>
                    )}
                </View>

                <View style={styles.cardContent}>
                    <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.priceRow}>
                        <Text style={[styles.productPrice, { color: colors.text }]}>From NPR {item.base_price}</Text>
                    </View>
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.bookIconBadge, { backgroundColor: colors.primary }]}
                onPress={() => router.push(`/(customer)/services/${item.id}`)}
            >
                <Ionicons name="calendar-outline" size={18} color="#FFF" />
            </TouchableOpacity>
        </MotiView>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: isDark ? '#333' : '#F3F4F6' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back-outline" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{params.title || 'Puja Services'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: isDark ? '#444' : '#E5E7EB' }]}>
                    <Ionicons name="search-outline" size={20} color={isDark ? '#AAA' : '#666'} />
                    <TextInput
                        placeholder="Search for pujas..."
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholderTextColor={isDark ? '#AAA' : '#999'}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={loadServices}
                    />
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
                        numColumns={2}
                        columnWrapperStyle={styles.row}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.center}>
                                <Text style={{ color: colors.text }}>No services found.</Text>
                            </View>
                        }
                    />
                )}
            </View>
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
    content: {
        flex: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        height: 48,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    row: {
        justifyContent: 'space-between',
    },
    productCard: {
        width: '48%',
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        position: 'relative',
    },
    imageContainer: {
        width: '100%',
        height: 120,
        borderRadius: 12,
        marginBottom: 10,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        gap: 4,
    },
    productName: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    priceRow: {
        marginTop: 2,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#D97706',
    },
    bookIconBadge: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
});
