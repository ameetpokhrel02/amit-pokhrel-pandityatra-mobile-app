import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { fetchMyReviews, Review } from '@/services/review.service';

export default function ReviewHistoryScreen() {
    const router = useRouter();
    const { colors, theme } = useTheme();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadReviews = async () => {
        try {
            setLoading(true);
            const data = await fetchMyReviews();
            setReviews(data);
        } catch (error) {
            console.error('Error loading review history:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadReviews();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadReviews();
    };

    const renderStars = (rating: number) => {
        return (
            <View style={styles.starContainer}>
                {[1, 2, 3, 4, 5].map(star => (
                    <Ionicons 
                        key={star} 
                        name={star <= rating ? "star" : "star-outline"} 
                        size={16} 
                        color={star <= rating ? "#FFD700" : colors.text + '40'} 
                    />
                ))}
            </View>
        );
    };

    const renderReviewItem = ({ item }: { item: Review }) => (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
                <View style={styles.serviceInfo}>
                    <Text style={[styles.serviceName, { color: colors.text }]}>{item.service_name}</Text>
                    <Text style={[styles.panditName, { color: colors.text, opacity: 0.7 }]}>
                        Pandit: {item.pandit_name}
                    </Text>
                </View>
                <Text style={[styles.dateText, { color: colors.text, opacity: 0.5 }]}>
                    {new Date(item.created_at).toLocaleDateString()}
                </Text>
            </View>

            <View style={styles.ratingRow}>
                {renderStars(item.rating)}
                <Text style={[styles.ratingText, { color: colors.text }]}>{item.rating}/5</Text>
            </View>

            <Text style={[styles.comment, { color: colors.text }]}>
                &quot;{item.comment}&quot;
            </Text>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>My Past Reviews</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={reviews}
                renderItem={renderReviewItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbox-outline" size={64} color={colors.primary} style={{ opacity: 0.5 }} />
                            <Text style={[styles.emptyText, { color: colors.text }]}>No reviews yet</Text>
                            <Text style={[styles.emptySubtext, { color: colors.text, opacity: 0.6 }]}>
                                You haven&apos;t submitted any reviews for your bookings yet.
                            </Text>
                        </View>
                    ) : null
                }
            />
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
        paddingBottom: 16,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    serviceInfo: {
        flex: 1,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    panditName: {
        fontSize: 13,
    },
    dateText: {
        fontSize: 12,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    starContainer: {
        flexDirection: 'row',
        gap: 2,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '600',
    },
    comment: {
        fontSize: 14,
        fontStyle: 'italic',
        lineHeight: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 40,
    },
});
