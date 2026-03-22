import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import { useTheme } from '@/store/ThemeContext';

export default function PaymentWebViewScreen() {
    const { url, title, successUrl, failureUrl } = useLocalSearchParams<{ 
        url: string; 
        title: string;
        successUrl: string;
        failureUrl: string;
    }>();
    const router = useRouter();
    const { colors } = useTheme();
    const [loading, setLoading] = useState(true);

    const handleNavigationStateChange = (navState: WebViewNavigation) => {
        console.log('[PaymentWebView] Navigating to:', navState.url);

        // Check for success or failure redirects
        if (successUrl && navState.url.includes(successUrl)) {
            console.log('[PaymentWebView] Success redirect detected!');
            // Extracts params and pass back to the caller
            const params = navState.url.split('?')[1] || '';
            router.replace({
                pathname: '/(customer)/bookings',
                params: { payment_status: 'success', query: params }
            });
        } else if (failureUrl && navState.url.includes(failureUrl)) {
            console.log('[PaymentWebView] Failure redirect detected!');
            router.back();
            // You might want to show a toast here
        }
    };

    if (!url) {
        return (
            <View style={styles.errorContainer}>
                <Text>Invalid Payment URL</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={{ color: colors.primary, marginTop: 10 }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{title || 'Payment'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.webviewContainer}>
                <WebView
                    source={{ uri: url }}
                    onNavigationStateChange={handleNavigationStateChange}
                    onLoadEnd={() => setLoading(false)}
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color={Colors.light.primary} />
                        </View>
                    )}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    webviewContainer: {
        flex: 1,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
