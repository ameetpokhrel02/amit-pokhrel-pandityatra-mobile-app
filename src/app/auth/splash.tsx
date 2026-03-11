import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchProfile } from '@/services/auth.service';

export default function SplashScreen() {
    const router = useRouter();

    useEffect(() => {
        const checkNavigation = async () => {
            console.log('Splash: Starting navigation check...');
            try {
                // Minimum delay of 3 seconds for branding as requested
                const timer = new Promise(resolve => setTimeout(resolve, 3000));

                // Parallelly check storage
                const [onboardingSeen, token] = await Promise.all([
                    AsyncStorage.getItem('onboarding_seen'),
                    AsyncStorage.getItem('access_token')
                ]);

                console.log('Splash: Status - seen:', onboardingSeen, 'token:', !!token);

                // Wait for the minimum 3s branding time
                await timer;

                if (onboardingSeen !== 'true') {
                    console.log('Splash: Navigating to Onboarding');
                    router.replace('/auth/onboarding' as any);
                    return;
                }

                if (token) {
                    try {
                        console.log('Splash: Verifying token...');
                        const user = await fetchProfile();
                        console.log('Splash: Token valid, role:', user.role);

                        if (user.role === 'pandit') {
                            if (user.is_pandit_profile_complete) {
                                router.replace('/(pandit)' as any);
                            } else {
                                router.replace('/auth/pandit-profile-setup' as any);
                            }
                        } else if (user.role === 'admin') {
                            router.replace('/admin/dashboard' as any);
                        } else {
                            router.replace('/(customer)' as any);
                        }
                    } catch (e) {
                        console.log('Splash: Token invalid, clearing and going Login');
                        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user', 'role']);
                        router.replace('/auth/login' as any);
                    }
                } else {
                    console.log('Splash: No token, going Login');
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
    },
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
    },
    logo: {
        width: 180,
        height: 180,
        marginBottom: 10,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#D97706',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#555',
        marginTop: 8,
        textAlign: 'center',
    },
});
