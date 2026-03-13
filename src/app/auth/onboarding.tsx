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
        title: 'Authentic Vedic Rituals',
        description: 'Experience sacred traditions with verified Pandits who bring purity and devotion to every ritual.',
        image: require('@/assets/images/splash 1.jpeg'),
        icon: 'heart-outline',
    },
    {
        id: '2',
        title: 'Vibrant Spiritual Community',
        description: 'Join a community of believers and expert priests. Shared faith, connected through excellence.',
        image: require('@/assets/images/splash 3.jpeg'),
        icon: 'people-outline',
    },
    {
        id: '3',
        title: 'Sacred Ease of Use',
        description: 'Booking a puja is now as peaceful as the prayer itself. Seamless, secure, and spiritual.',
        image: require('@/assets/images/spash 4.png'),
        icon: 'leaf-outline',
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

    const Slide = ({ item, index }: { item: typeof SLIDES[0], index: number }) => {
        return (
            <View style={styles.slide}>
                <View
                    style={styles.imageContainer}
                >
                    <View style={styles.imageOverlay}>
                        <Image
                            source={item.image}
                            style={styles.image}
                            contentFit="cover"
                            transition={500}
                        />
                    </View>
                    {/* Decorative Mandala Icons */}
                    <View style={[styles.mandalaIcon, { top: -30, left: -30, opacity: 0.5 }]}>
                        <Ionicons name="sunny-outline" size={60} color="#D97706" />
                    </View>
                    <View style={[styles.mandalaIcon, { bottom: -30, right: -30, opacity: 0.5 }]}>
                        <Ionicons name="sunny-outline" size={60} color="#D97706" />
                    </View>
                </View>
                <View
                    style={styles.textContainer}
                >
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                </View>
            </View>
        );
    };

    return (
        <ImageBackground
            source={require('@/assets/images/spash 4.png')}
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.overlay} />
            <SafeAreaView style={styles.container}>
                <FlatList
                    ref={ref}
                    onMomentumScrollEnd={updateCurrentSlideIndex}
                    showsHorizontalScrollIndicator={false}
                    horizontal
                    data={SLIDES}
                    pagingEnabled
                    renderItem={({ item, index }) => <Slide item={item} index={index} />}
                    keyExtractor={(item) => item.id}
                    style={{ flex: 1 }}
                    bounces={false}
                />

                <View style={styles.footer}>
                    {/* Pagination indicator */}
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

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        {currentSlideIndex >= SLIDES.length - 1 ? (
                            <TouchableOpacity
                                style={[styles.getStartedBtn, { backgroundColor: '#FF6F00' }]}
                                onPress={getStarted}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.getStartedText}>Enter Sanctuary</Text>
                                <Ionicons name="arrow-forward" size={22} color="#FFF" />
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.navButtons}>
                                <TouchableOpacity onPress={skip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <Text style={styles.skipText}>Skip</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.nextBtn, { backgroundColor: '#FF6F00' }]} 
                                    onPress={goToNextSlide} 
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.nextText}>Next</Text>
                                    <Ionicons name="chevron-forward" size={18} color="#FFF" style={{ marginLeft: 4 }} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </SafeAreaView>
        </ImageBackground>
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
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    slide: {
        width,
        alignItems: 'center',
        paddingTop: height * 0.08,
    },
    imageContainer: {
        width: width * 0.8,
        height: width * 0.8,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageOverlay: {
        width: '100%',
        height: '100%',
        borderRadius: width * 0.4,
        overflow: 'hidden',
        borderWidth: 6,
        borderColor: '#FFF',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
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
        paddingHorizontal: 40,
        marginTop: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FF6F00',
        textAlign: 'center',
        lineHeight: 36,
    },
    description: {
        fontSize: 16,
        color: '#3E2723',
        textAlign: 'center',
        marginTop: 15,
        lineHeight: 24,
        paddingHorizontal: 10,
    },
    footer: {
        height: height * 0.2,
        justifyContent: 'space-between',
        paddingHorizontal: 30,
        paddingBottom: 20,
    },
    indicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    indicator: {
        height: 6,
        width: 6,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 4,
        borderRadius: 3,
    },
    activeIndicator: {
        backgroundColor: '#FF6F00',
        width: 24,
    },
    buttonContainer: {
        width: '100%',
        marginBottom: 20,
    },
    navButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    skipText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    nextBtn: {
        backgroundColor: '#D97706',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    nextText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    getStartedBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 10,
        elevation: 5,
        shadowColor: '#D97706',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    getStartedText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

