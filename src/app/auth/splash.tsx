import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/auth.store';
import { fetchProfile } from '@/services/auth.service';

export default function SplashScreen() {
    const router = useRouter();
    const { isAuthenticated, user: authUser, initialize } = useAuthStore();

    useEffect(() => {
        const checkNavigation = async () => {
            console.log('Splash: Starting navigation check...');
            try {
                // Minimum delay of 3 seconds for branding as requested
                const timer = new Promise(resolve => setTimeout(resolve, 3000));

                // Clear initialization result
                await initialize();

                const onboardingSeen = await AsyncStorage.getItem('onboarding_seen');
                const token = await SecureStore.getItemAsync('access_token');

                console.log('Splash: Status - seen:', onboardingSeen, 'token:', !!token, 'auth:', isAuthenticated);

                // Wait for the minimum 3s branding time
                await timer;

                if (onboardingSeen !== 'true') {
                    console.log('Splash: Navigating to Onboarding');
                    router.replace('/auth/onboarding' as any);
                    return;
                }

                if (isAuthenticated && authUser) {
                    console.log('Splash: Authenticated, role:', authUser.role);
                    if (authUser.role === 'pandit') {
                        // We check for profile completion here
                        // For now assuming if authUser exists we can try to go to dashboard
                        router.replace('/(pandit)' as any);
                    } else if (authUser.role === 'admin') {
                        router.replace('/admin/dashboard' as any);
                    } else {
                        router.replace('/(customer)' as any);
                    }
                } else {
                    console.log('Splash: No auth session, going Login');
                    router.replace('/auth/login' as any);
                }
            } catch (error) {
                console.error('Splash navigation error:', error);
                router.replace('/auth/login' as any);
            }
        };

        checkNavigation();
    }, []);

    return (
        <View style={styles.container}>
            <ImageBackground
                source={require('@/assets/images/spash 4.png')}
                style={styles.background}
                resizeMode="cover"
            >
                <View style={styles.overlay}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('@/assets/images/pandit-logo.png')}
                            style={styles.logo}
                            contentFit="contain"
                        />
                        <Text style={styles.title}>
                            PanditYatra
                        </Text>
                        <Text style={styles.subtitle}>
                            Connecting Faith with Excellence
                        </Text>
                    </View>
                </View>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FF6F00',
    },
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(255, 111, 0, 0.85)', // Saffron with slight transparency
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
    },
    logo: {
        width: 200,
        height: 200,
        marginBottom: 20,
    },
    title: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#FFD700', // Gold
        textAlign: 'center',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 18,
        color: '#FFFFFF', // White for better contrast on saffron
        marginTop: 10,
        textAlign: 'center',
        fontWeight: '500',
    },
});
