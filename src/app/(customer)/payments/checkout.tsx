import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/store/ThemeContext';
import { Booking } from '@/services/api';
import { fetchBookingDetail } from '@/services/booking.service';
import { initiatePayment, verifyKhaltiPayment } from '@/services/payment.service';
import { Button } from '@/components/ui/Button';
import { PaymentWebView } from '@/components/common/PaymentWebView';

// Safely import native module
const KhaltiPaymentSdk = (() => {
    try {
        return require('@bishaldahal/react-native-khalti-checkout').default;
    } catch (e) {
        console.warn('Khalti SDK native module not found');
        return null;
    }
})();

export default function CheckoutScreen() {
    const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
    const router = useRouter();
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<'khalti' | 'stripe'>('khalti');
    const [showWebView, setShowWebView] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState('');

    useEffect(() => {
        if (bookingId) {
            loadBooking();
        }
    }, [bookingId]);

    const loadBooking = async () => {
        try {
            setLoading(true);
            const data = await fetchBookingDetail(parseInt(bookingId));
            setBooking(data);
        } catch (error) {
            console.error('Error loading booking:', error);
            Alert.alert('Error', 'Failed to load booking details.');
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!booking) return;

        try {
            setPaying(true);

            if (selectedMethod === 'khalti') {
                // 1. Initiate payment on backend
                const paymentIntent = await initiatePayment({
                    booking: booking.id,
                    payment_method: 'khalti',
                    amount: booking.total_fee,
                });

                if (paymentIntent.payment_url) {
                    setPaymentUrl(paymentIntent.payment_url);
                    setShowWebView(true);
                    return;
                }

                // 2. Open Khalti SDK
                if (!KhaltiPaymentSdk) {
                    Alert.alert(
                        'Native Module Missing',
                        'Khalti Payment SDK requires a development build. It is not available in Expo Go. Please use a development build to test payments.',
                        [{ text: 'OK' }]
                    );
                    setPaying(false);
                    return;
                }

                KhaltiPaymentSdk.startPayment({
                    publicKey: "test_public_key_77c4a6311a2f4705ba362035985b88f3",
                    pidx: (paymentIntent.pidx || paymentIntent.payment_url?.split('pidx=')[1]) || "", // Fallback to empty string for TS, though check below handles it
                    environment: "TEST",
                }).then((payload: any) => {
                    // Handle success from promise if needed, but the SDK also has event listeners
                    // Based on .d.ts, startPayment returns Promise<PaymentSuccessPayload>
                    handleKhaltiSuccess(payload);
                }).catch((error: any) => {
                    console.error('Khalti Error:', error);
                    Alert.alert('Payment Failed', 'Something went wrong with Khalti.');
                });

                // Alternatively, use event listeners if the promise doesn't fire as expected in some versions
                KhaltiPaymentSdk.onPaymentSuccess((payload: any) => {
                    handleKhaltiSuccess(payload);
                });

                KhaltiPaymentSdk.onPaymentError((payload: any) => {
                    console.error('Khalti Error:', payload);
                    Alert.alert('Payment Failed', payload.error || 'Something went wrong.');
                });
            } else {
                // Handle Stripe or other methods
                Alert.alert('Coming Soon', 'Stripe payment is not yet integrated in this demo.');
            }
        } catch (error: any) {
            console.error('Payment initiation failed:', error);
            Alert.alert('Error', error.message || 'Failed to initiate payment.');
        } finally {
            setPaying(false);
        }
    };

    const handleKhaltiSuccess = async (payload: any) => {
        try {
            // 3. Verify on backend
            // In the new API, we verify using pidx
            await verifyKhaltiPayment({
                token: payload.pidx, // The SDK returns pidx in the payload
                amount: booking?.total_fee || 0
            });
            Alert.alert('Success', 'Payment successful!', [
                { text: 'OK', onPress: () => router.replace('/(customer)/bookings') }
            ]);
        } catch (e) {
            Alert.alert('Verification Failed', 'Payment verification failed. Please contact support.');
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!booking) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.text }}>Booking not found.</Text>
            </View>
        );
    }

    if (showWebView && paymentUrl) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.header, { backgroundColor: colors.card }]}>
                    <TouchableOpacity onPress={() => setShowWebView(false)} style={styles.backButton}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Complete Payment</Text>
                    <View style={{ width: 40 }} />
                </View>
                <PaymentWebView
                    url={paymentUrl}
                    onSuccess={(data) => {
                        setShowWebView(false);
                        // Redirect URLs usually contain pidx for Khalti
                        const pidx = data.url.split('pidx=')[1]?.split('&')[0];
                        handleKhaltiSuccess({ pidx });
                    }}
                    onFailure={() => {
                        setShowWebView(false);
                        Alert.alert('Payment Failed', 'The payment process was not successful.');
                    }}
                    onCancel={() => {
                        setShowWebView(false);
                    }}
                />
            </SafeAreaView>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.card }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Checkout</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View
                    style={[styles.summaryCard, { backgroundColor: colors.card }]}
                >
                    <Text style={[styles.summaryTitle, { color: colors.text }]}>Order Summary</Text>
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: isDark ? '#AAA' : '#666' }]}>Service</Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>{booking.service_name}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: isDark ? '#AAA' : '#666' }]}>Pandit</Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>{booking.pandit_full_name}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: isDark ? '#AAA' : '#666' }]}>Date & Time</Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>{booking.booking_date} at {booking.booking_time}</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#EEE' }]} />
                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount</Text>
                        <Text style={[styles.totalValue, { color: colors.primary }]}>NPR {booking.total_fee}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Payment Method</Text>

                    <TouchableOpacity
                        style={[
                            styles.methodCard,
                            { backgroundColor: colors.card },
                            selectedMethod === 'khalti' && { borderColor: colors.primary, borderWidth: 2 }
                        ]}
                        onPress={() => setSelectedMethod('khalti')}
                    >
                        <View style={styles.methodInfo}>
                            <View style={[styles.methodIcon, { backgroundColor: '#5C2D91' }]}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>K</Text>
                            </View>
                            <Text style={[styles.methodName, { color: colors.text }]}>Khalti Wallet</Text>
                        </View>
                        <Ionicons
                            name={selectedMethod === 'khalti' ? "radio-button-on" : "radio-button-off"}
                            size={24}
                            color={selectedMethod === 'khalti' ? colors.primary : '#AAA'}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.methodCard,
                            { backgroundColor: colors.card },
                            selectedMethod === 'stripe' && { borderColor: colors.primary, borderWidth: 2 }
                        ]}
                        onPress={() => setSelectedMethod('stripe')}
                    >
                        <View style={styles.methodInfo}>
                            <View style={[styles.methodIcon, { backgroundColor: '#6772E5' }]}>
                                <Ionicons name="card" size={20} color="white" />
                            </View>
                            <Text style={[styles.methodName, { color: colors.text }]}>Card Payment (Stripe)</Text>
                        </View>
                        <Ionicons
                            name={selectedMethod === 'stripe' ? "radio-button-on" : "radio-button-off"}
                            size={24}
                            color={selectedMethod === 'stripe' ? colors.primary : '#AAA'}
                        />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: colors.card }]}>
                <Button
                    title={paying ? "Processing..." : `Pay NPR ${booking.total_fee}`}
                    onPress={handlePayment}
                    isLoading={paying}
                    style={styles.payButton}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    summaryCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 14,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginVertical: 16,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    methodCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    methodInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    methodIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    methodName: {
        fontSize: 15,
        fontWeight: '600',
    },
    footer: {
        padding: 20,
        paddingBottom: 34,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
    },
    payButton: {
        width: '100%',
    },
});
