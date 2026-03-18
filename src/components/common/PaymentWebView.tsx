import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Colors } from '@/theme/colors';

interface PaymentWebViewProps {
    url?: string;
    html?: string;
    onSuccess: (data?: any) => void;
    onFailure: (error?: any) => void;
    onCancel: () => void;
}

export const PaymentWebView: React.FC<PaymentWebViewProps> = ({
    url,
    html,
    onSuccess,
    onFailure,
    onCancel
}) => {
    const handleNavigationStateChange = (navState: WebViewNavigation) => {
        const { url: currentUrl } = navState;

        // Custom logic to handle redirect URLs from payment gateways
        if (
            currentUrl.includes('payment/success') || 
            currentUrl.includes('status=completed') || 
            currentUrl.includes('status=Completed') ||
            currentUrl.includes('/payment/khalti/verify') || 
            currentUrl.includes('/payment/esewa/verify') ||
            currentUrl.includes('pidx=') ||
            currentUrl.includes('q=su') || // eSewa success shorthand often used
            currentUrl.includes('oid=') && currentUrl.includes('amt=') // eSewa legacy success
        ) {
            onSuccess({ url: currentUrl });
        } else if (
            currentUrl.includes('payment/failure') || 
            currentUrl.includes('status=failed') || 
            currentUrl.includes('status=Failed') ||
            currentUrl.includes('/payment/failure') ||
            currentUrl.includes('q=fu') // eSewa failure shorthand
        ) {
            onFailure({ url: currentUrl });
        } else if (
            currentUrl.includes('payment/cancel') || 
            currentUrl.includes('status=user_cancelled') ||
            currentUrl.includes('status=CANCELED')
        ) {
            onCancel();
        }
    };

    return (
        <View style={styles.container}>
            <WebView
                source={html ? { html, baseUrl: 'https://rc-epay.esewa.com.np' } : { uri: url! }}
                onNavigationStateChange={handleNavigationStateChange}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.loader}>
                        <ActivityIndicator size="large" color={Colors.light.primary} />
                    </View>
                )}
                javaScriptEnabled={true}
                domStorageEnabled={true}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
});

export default PaymentWebView;
