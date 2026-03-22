import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/auth.store';
import { Colors } from '@/theme/colors';

export default function SplashScreen() {
    const router = useRouter();
    const { isLoading, isAuthenticated, user, role } = useAuthStore();

    useEffect(() => {
        const checkNavigation = async () => {
            if (isLoading) return; 

            console.log('[Splash] Starting navigation check...', { isAuthenticated, role });
            
            try {
                const onboardingSeen = await AsyncStorage.getItem('onboarding_seen');
                const token = await SecureStore.getItemAsync('access_token');

                // 1. Check Onboarding
                if (onboardingSeen !== 'true') {
                    router.replace('/(public)/onboarding');
                    return;
                }

                // 2. Check Auth
                if (token && isAuthenticated && role) {
                    console.log('[Splash] Navigating to role-specific route:', role);
                    
                    if (role === 'pandit') {
                        router.replace('/(pandit)');
                    } else if (role === 'guest') {
                        router.replace('/(customer)');
                    } else {
                        router.replace('/(customer)');
                    }
                } else {
                    // 3. Not logged in -> Go to Welcome
                    console.log('[Splash] No valid session, going to welcome.');
                    router.replace('/(public)/role-selection');
                }
            } catch (error) {
                console.error('[Splash] Navigation error:', error);
                router.replace('/(public)/role-selection');
            }
        };

        const timeout = setTimeout(checkNavigation, 2000); 
        return () => clearTimeout(timeout);
    }, [isLoading, isAuthenticated, role, router]);

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
        backgroundColor: '#FF6F00',
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
