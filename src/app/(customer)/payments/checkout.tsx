import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import { useTheme } from '@/store/ThemeContext';
import { Booking } from '@/services/api';
import { getBooking } from '@/services/booking.service';
import { initiatePayment, verifyKhaltiPayment, verifyEsewaPayment, checkPaymentStatus } from '@/services/payment.service';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button';
import { PaymentWebView } from '@/components/common/PaymentWebView';
import { TextInput } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';

export default function CheckoutScreen() {
    const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
    const router = useRouter();
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<'khalti' | 'stripe' | 'esewa'>('khalti');
    const [showWebView, setShowWebView] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState('');
    const [formHtml, setFormHtml] = useState('');
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    
    const [formData, setFormData] = useState({
        full_name: useAuthStore.getState().user?.name || '',
        email: useAuthStore.getState().user?.email || '',
        phone_number: useAuthStore.getState().user?.phone || '',
    });

    useEffect(() => {
        if (bookingId) {
            loadBooking();
        }
    }, [bookingId]);

    const loadBooking = async () => {
        try {
            setLoading(true);
            const response = await getBooking(parseInt(bookingId));
            setBooking(response.data);
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

            // Universal payment initiation via backend redirect
            const paymentIntent = await initiatePayment({
                booking: booking.id,
                payment_method: selectedMethod.toUpperCase() as any,
                amount: booking.total_fee,
            });

            const urlToOpen = paymentIntent.payment_url || paymentIntent.checkout_url;

            if (selectedMethod === 'stripe') {
                if (!paymentIntent.client_secret) {
                    throw new Error('Stripe client secret missing from response');
                }
                
                const { error: initError } = await initPaymentSheet({
                    paymentIntentClientSecret: paymentIntent.client_secret,
                    merchantDisplayName: 'PanditYatra',
                    defaultBillingDetails: {
                        name: formData.full_name,
                        email: formData.email,
                        phone: formData.phone_number,
                    }
                });

                if (initError) {
                    Alert.alert('Error', initError.message);
                    return;
                }

                const { error: presentError } = await presentPaymentSheet();
                if (presentError) {
                    if (presentError.code === 'Canceled') {
                        // User cancelled
                    } else {
                        Alert.alert('Error', presentError.message);
                    }
                } else {
                    handlePaymentSuccess();
                }
            } else if (urlToOpen) {
                if (selectedMethod === 'esewa' && paymentIntent.form_data) {
                    const formFields = Object.keys(paymentIntent.form_data)
                        .map(key => `<input type="hidden" name="${key}" value="${String(paymentIntent.form_data[key]).replace(/"/g, '&quot;')}" />`)
                        .join('');
                    
                    const htmlContent = `
                        <html>
                            <head>
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            </head>
                            <body onload="document.getElementById('esewaForm').submit();" style="display:flex; justify-content:center; align-items:center; height:100vh; background-color:#f9f9f9; font-family:sans-serif;">
                                <form id="esewaForm" action="${urlToOpen}" method="POST">
                                    ${formFields}
                                </form>
                                <div style="text-align:center;">
                                    <h2 style="color:#60BB46;">Redirecting to eSewa...</h2>
                                    <p>Please wait while we redirect you to the secure payment gateway.</p>
                                </div>
                            </body>
                        </html>
                    `;
                    setFormHtml(htmlContent);
                    setPaymentUrl('');
                } else {
                    setPaymentUrl(urlToOpen);
                    setFormHtml('');
                }
                setShowWebView(true);
            } else {
                Alert.alert('Error', `Failed to get ${selectedMethod} payment URL.`);
            }
        } catch (error: any) {
            console.error('Payment initiation failed:', error);
            Alert.alert('Error', error.message || 'Failed to initiate payment.');
        } finally {
            setPaying(false);
        }
    };

    const handlePaymentSuccess = async (pidx?: string, esewaData?: string) => {
        try {
            // Step 1: Tell backend to verify the redirect token
            if (pidx) {
                await verifyKhaltiPayment({
                    pidx: pidx,
                    amount: booking?.total_fee || 0
                });
            } else if (esewaData) {
                await verifyEsewaPayment({ data: esewaData });
            }
            
            // Step 2: Universally verify the booking was actually marked PAID
            if (booking) {
                const statusRes: any = await checkPaymentStatus(booking.id);
                const paymentStatus = statusRes.status || statusRes.payment_status;
                
                if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED' || paymentStatus === 'PENDING') {
                    // It's possible the webhook hasn't fired yet for Stripe, but we can warn the user.
                    if (selectedMethod !== 'stripe') {
                       Alert.alert('Payment Not Confirmed', 'The payment was not completely verified by our servers.');
                       return;
                    }
                }
            }
            
            Alert.alert('Success', 'Payment successful!', [
                { text: 'OK', onPress: () => router.replace('/(customer)/bookings') }
            ]);
        } catch (e: any) {
            console.error('Verification Error:', e);
            Alert.alert('Verification Failed', e?.message || 'Payment verification failed. Please contact support.');
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

    if (showWebView && (paymentUrl || formHtml)) {
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
                    html={formHtml}
                    onSuccess={(data) => {
                        setShowWebView(false);
                        const pidx = data.url.split('pidx=')[1]?.split('&')[0];
                        const esewaData = data.url.split('data=')[1]?.split('&')[0];
                        handlePaymentSuccess(pidx, esewaData);
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

                {/* Personal Information */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Text>
                    <View style={styles.inputGroup}>
                        <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: isDark ? '#444' : '#E5E7EB' }]}>
                            <Text style={[styles.inputLabel, { color: isDark ? '#AAA' : '#666' }]}>Your Name *</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Full Name"
                                placeholderTextColor={isDark ? '#777' : '#AAA'}
                                value={formData.full_name}
                                onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                            />
                        </View>

                        <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: isDark ? '#444' : '#E5E7EB' }]}>
                            <Text style={[styles.inputLabel, { color: isDark ? '#AAA' : '#666' }]}>Your Email Address</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="email@example.com"
                                placeholderTextColor={isDark ? '#777' : '#AAA'}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={formData.email}
                                onChangeText={(text) => setFormData({ ...formData, email: text })}
                            />
                        </View>

                        <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: isDark ? '#444' : '#E5E7EB' }]}>
                            <Text style={[styles.inputLabel, { color: isDark ? '#AAA' : '#666' }]}>Your Phone Number *</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="+977"
                                placeholderTextColor={isDark ? '#777' : '#AAA'}
                                keyboardType="phone-pad"
                                value={formData.phone_number}
                                onChangeText={(text) => setFormData({ ...formData, phone_number: text })}
                            />
                        </View>
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
                            <View style={[styles.methodIcon, { backgroundColor: '#fff', overflow: 'hidden' }]}>
                                <Image 
                                    source={require('@/assets/images/khalti.png')} 
                                    style={{ width: '100%', height: '100%' }} 
                                    resizeMode="contain" 
                                />
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
                            selectedMethod === 'esewa' && { borderColor: colors.primary, borderWidth: 2 }
                        ]}
                        onPress={() => setSelectedMethod('esewa')}
                    >
                        <View style={styles.methodInfo}>
                            <View style={[styles.methodIcon, { backgroundColor: '#fff', overflow: 'hidden' }]}>
                                <Image 
                                    source={require('@/assets/images/eswa.jpg')} 
                                    style={{ width: '100%', height: '100%' }} 
                                    resizeMode="contain" 
                                />
                            </View>
                            <Text style={[styles.methodName, { color: colors.text }]}>eSewa Wallet</Text>
                        </View>
                        <Ionicons
                            name={selectedMethod === 'esewa' ? "radio-button-on" : "radio-button-off"}
                            size={24}
                            color={selectedMethod === 'esewa' ? colors.primary : '#AAA'}
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
    inputGroup: {
        gap: 16,
        marginBottom: 24,
    },
    inputWrapper: {
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    inputLabel: {
        fontSize: 12,
        marginBottom: 2,
        fontWeight: '500',
    },
    input: {
        paddingVertical: 4,
        fontSize: 16,
        fontWeight: '500',
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
