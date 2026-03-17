import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/auth.store';
import { Colors } from '@/constants/Colors';

export default function SplashScreen() {
    const router = useRouter();
    const { initialize, isAuthenticated, user } = useAuthStore();

    useEffect(() => {
        const checkNavigation = async () => {
            console.log('[Splash] Starting navigation check...');
            try {
                // Minimum delay of 2.5 seconds for branding
                const timer = new Promise(resolve => setTimeout(resolve, 2500));

                // Initialize auth store (loads tokens/user from storage)
                await initialize();

                const onboardingSeen = await AsyncStorage.getItem('onboarding_seen');
                const token = await SecureStore.getItemAsync('access_token');

                console.log('[Splash] Status:', { onboardingSeen, hasToken: !!token, isAuthenticated });

                await timer; // Wait for branding delay

                // 1. Check Onboarding
                if (onboardingSeen !== 'true') {
                    router.replace('/auth/onboarding' as any);
                    return;
                }

                // 2. Check Auth
                if (token && isAuthenticated && user) {
                    if (user.role === 'pandit') {
                        router.replace('/(pandit)' as any);
                    } else if (user.role === 'admin') {
                        router.replace('/admin/dashboard' as any);
                    } else {
                        router.replace('/(customer)' as any);
                    }
                } else {
                    // 3. Not logged in -> Go to Login
                    router.replace('/auth/login' as any);
                }
            } catch (error) {
                console.error('[Splash] Navigation error:', error);
                router.replace('/auth/login' as any);
            }
        };

        checkNavigation();
    }, [initialize, isAuthenticated, user, router]);

    return (
        <View style={styles.container}>
            <View style={styles.overlay}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('@/assets/images/pandit-logo.png')}
                        style={styles.logo}
                        contentFit="contain"
                    />
                    <Text style={styles.title}>PanditYatra</Text>
                    <Text style={styles.subtitle}>Connecting Faith with Excellence</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.primary,
    },
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(255, 111, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
    },
    logo: {
        width: 180,
        height: 180,
        marginBottom: 20,
    },
    title: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#FFD700',
        textAlign: 'center',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 18,
        color: '#FFFFFF',
        marginTop: 10,
        textAlign: 'center',
        fontWeight: '500',
    },
});
