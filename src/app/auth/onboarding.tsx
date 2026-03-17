import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Book Expert Pandits',
        description: 'Connect with verified Vedic priests for all your sacred rituals and ceremonies with ease.',
        image: require('@/assets/images/splash 1.jpeg'),
        icon: 'person-add-outline',
    },
    {
        id: '2',
        title: 'Live Video Puja',
        description: 'Experience divine blessings from the comfort of your home through high-quality live video sessions.',
        image: require('@/assets/images/splash 3.jpeg'),
        icon: 'videocam-outline',
    },
    {
        id: '3',
        title: 'AI Kundali & Guide',
        description: 'Unlock cosmic insights with our AI Kundali generator and personalized spiritual guidance.',
        image: require('@/assets/images/spash 4.png'), // Keeping original if spash 4.png exists
        icon: 'sparkles-outline',
    },
];

export default function OnboardingScreen() {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const ref = useRef<FlatList>(null);
    const router = useRouter();

    const updateCurrentSlideIndex = (e: any) => {
        const contentOffsetX = e.nativeEvent.contentOffset.x;
        const currentIndex = Math.round(contentOffsetX / width);
        setCurrentSlideIndex(currentIndex);
    };

    const goToNextSlide = () => {
        const nextSlideIndex = currentSlideIndex + 1;
        if (nextSlideIndex < SLIDES.length) {
            const offset = nextSlideIndex * width;
            ref?.current?.scrollToOffset({ offset });
            setCurrentSlideIndex(nextSlideIndex);
        }
    };

    const skip = async () => {
        try {
            await AsyncStorage.setItem('onboarding_seen', 'true');
            router.replace('/auth/login' as any);
        } catch (error) {
            console.error('Error saving onboarding state:', error);
            router.replace('/auth/login' as any);
        }
    };

    const getStarted = async () => {
        try {
            await AsyncStorage.setItem('onboarding_seen', 'true');
            router.replace('/auth/login' as any);
        } catch (error) {
            console.error('Error saving onboarding state:', error);
            router.replace('/auth/login' as any);
        }
    };

    const Slide = ({ item }: { item: typeof SLIDES[0] }) => {
        return (
            <View style={styles.slide}>
                <View style={styles.imageContainer}>
                    <View style={styles.imageOverlay}>
                        <Image
                            source={item.image}
                            style={styles.image}
                            contentFit="cover"
                            transition={500}
                        />
                    </View>
                    <View style={[styles.mandalaIcon, { top: -20, left: -20, opacity: 0.3 }]}>
                        <Ionicons name="sunny-outline" size={80} color={Colors.light.primary} />
                    </View>
                </View>
                <View style={styles.textContainer}>
                    <View style={styles.iconCircle}>
                        <Ionicons name={item.icon as any} size={30} color="#FFF" />
                    </View>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.container}>
                <FlatList
                    ref={ref}
                    onMomentumScrollEnd={updateCurrentSlideIndex}
                    showsHorizontalScrollIndicator={false}
                    horizontal
                    data={SLIDES}
                    pagingEnabled
                    renderItem={({ item }) => <Slide item={item} />}
                    keyExtractor={(item) => item.id}
                    style={{ flex: 1 }}
                    bounces={false}
                />

                <View style={styles.footer}>
                    <View style={styles.indicatorContainer}>
                        {SLIDES.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.indicator,
                                    currentSlideIndex === index && styles.activeIndicator,
                                ]}
                            />
                        ))}
                    </View>

                    <View style={styles.buttonContainer}>
                        {currentSlideIndex >= SLIDES.length - 1 ? (
                            <TouchableOpacity
                                style={styles.getStartedBtn}
                                onPress={getStarted}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.getStartedText}>Get Started</Text>
                                <Ionicons name="arrow-forward" size={22} color="#FFF" />
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.navButtons}>
                                <TouchableOpacity onPress={skip}>
                                    <Text style={styles.skipText}>Skip</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.nextBtn} 
                                    onPress={goToNextSlide} 
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.nextText}>Next</Text>
                                    <Ionicons name="chevron-forward" size={18} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    container: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
    },
    slide: {
        width,
        alignItems: 'center',
        paddingTop: height * 0.05,
    },
    imageContainer: {
        width: width * 0.75,
        height: width * 0.75,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageOverlay: {
        width: '100%',
        height: '100%',
        borderRadius: (width * 0.75) / 2,
        overflow: 'hidden',
        borderWidth: 8,
        borderColor: '#FFF',
        backgroundColor: '#FFF',
        elevation: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    mandalaIcon: {
        position: 'absolute',
        zIndex: -1,
    },
    textContainer: {
        paddingHorizontal: 30,
        marginTop: 40,
        alignItems: 'center',
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.light.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        elevation: 5,
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2C2C2C',
        textAlign: 'center',
        marginBottom: 15,
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        height: height * 0.22,
        justifyContent: 'space-between',
        paddingHorizontal: 30,
        paddingBottom: 30,
    },
    indicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    indicator: {
        height: 8,
        width: 8,
        backgroundColor: '#DDD',
        marginHorizontal: 5,
        borderRadius: 4,
    },
    activeIndicator: {
        backgroundColor: Colors.light.primary,
        width: 24,
    },
    buttonContainer: {
        width: '100%',
    },
    navButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    skipText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#999',
    },
    nextBtn: {
        backgroundColor: Colors.light.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 25,
        paddingVertical: 14,
        borderRadius: 15,
        gap: 5,
    },
    nextText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    getStartedBtn: {
        backgroundColor: Colors.light.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 18,
        gap: 12,
        elevation: 5,
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    getStartedText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
