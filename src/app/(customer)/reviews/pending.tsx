import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { fetchMyBookings } from '@/services/booking.service';
import { Booking } from '@/services/api';
import { Button } from '@/components/ui/Button';

export default function PendingReviewsScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const data = await fetchMyBookings();
            // Filter: status is COMPLETED and not reviewed
            const pending = data.filter(b => b.status === 'COMPLETED' && !b.is_reviewed);
            setBookings(pending);
        } catch (error) {
            console.error('Error loading pending reviews:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadBookings();
    };

    const renderBookingItem = ({ item }: { item: Booking }) => (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={[styles.serviceName, { color: colors.text }]}>{item.service_name}</Text>
                    <Text style={[styles.panditName, { color: colors.text, opacity: 0.7 }]}>
                        with {item.pandit_full_name}
                    </Text>
                </View>
                <View style={[styles.dateBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.dateText, { color: colors.primary }]}>{item.booking_date}</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <Text style={[styles.completedOn, { color: colors.text, opacity: 0.5 }]}>
                    Completed
                </Text>
                <Button
                    title="Rate Now"
                    onPress={() => router.push({
                        pathname: '/bookings/review',
                        params: { bookingId: item.id.toString() }
                    } as any)}
                    style={{ paddingHorizontal: 16, height: 36 }}
                />
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Rate Recent Services</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={bookings}
                renderItem={renderBookingItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="checkmark-circle-outline" size={64} color={colors.primary} style={{ opacity: 0.5 }} />
                            <Text style={[styles.emptyText, { color: colors.text }]}>No pending reviews!</Text>
                            <Text style={[styles.emptySubtext, { color: colors.text, opacity: 0.6 }]}>
                                You've rated all your recent services.
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
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    serviceName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    panditName: {
        fontSize: 14,
    },
    dateBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    dateText: {
        fontSize: 12,
        fontWeight: '600',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    completedOn: {
        fontSize: 12,
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
