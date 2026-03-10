import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useTheme } from '@/store/ThemeContext';
import { generateKundali } from '@/services/kundali.service';

export default function KundaliScreen() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        dob: '',
        tob: '',
        place: '',
        gender: ''
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any | null>(null);
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';

    const handleGenerate = async () => {
        if (!formData.dob || !formData.tob || !formData.place) {
            Alert.alert('Missing details', 'Please fill date, time and place of birth.');
            return;
        }

        try {
            setLoading(true);
            setResult(null);

            // For now we assume place lookup is handled elsewhere; latitude/longitude/timezone
            // would normally come from a geocoding step. Here we send placeholder values that
            // match the web flow expectations.
            const payload = {
                dob: formData.dob,
                time: formData.tob,
                lat: 27.7172,  // Kathmandu as default
                lon: 85.324,
                timezone: 'Asia/Kathmandu',
            };

            const res = await generateKundali(payload);
            setResult(res);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Unable to generate Kundali. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#fff7ed' }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: isDark ? colors.background : '#fff7ed' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Offline Kundali</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* 1. Hero Section */}
                <View style={styles.heroSection}>
                    <MotiView
                        from={{ rotate: '0deg' }}
                        animate={{ rotate: '360deg' }}
                        transition={{
                            type: 'timing',
                            duration: 20000,
                            loop: true,
                            repeatReverse: false,
                        }}
                        style={[styles.heroIconContainer, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#000' }]}
                    >
                        <Ionicons name="planet-outline" size={64} color="#f97316" />
                    </MotiView>
                    <Text style={[styles.heroTitle, { color: colors.text }]}>Offline Kundali – Your Birth Chart, Private & Secure</Text>
                    <Text style={[styles.heroSubtitle, { color: isDark ? '#AAA' : '#666' }]}>Generate your Kundali without internet. Your data stays on your device.</Text>
                    <MotiView
                        from={{ scale: 1 }}
                        animate={{ scale: 1.05 }}
                        transition={{
                            type: 'timing',
                            duration: 1500,
                            loop: true,
                        }}
                    >
                        <TouchableOpacity style={styles.heroButton} onPress={handleGenerate} disabled={loading}>
                            <Text style={styles.heroButtonText}>Generate Kundali</Text>
                        </TouchableOpacity>
                    </MotiView>
                </View>

                {/* 2. What Is Offline Kundali? */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.text }]}>What Is Offline Kundali?</Text>
                    <Text style={[styles.sectionText, { color: isDark ? '#AAA' : '#555' }]}>
                        Offline Kundali generates your birth chart using Vedic astrology algorithms directly on your device. No internet required. No data sent to servers.
                    </Text>
                    <View style={styles.featureRow}>
                        <View style={[styles.featureItem, { backgroundColor: colors.card }]}>
                            <Ionicons name="cloud-offline-outline" size={24} color="#f97316" />
                            <Text style={[styles.featureText, { color: colors.text }]}>Works Offline</Text>
                        </View>
                        <View style={[styles.featureItem, { backgroundColor: colors.card }]}>
                            <Ionicons name="lock-closed-outline" size={24} color="#f97316" />
                            <Text style={[styles.featureText, { color: colors.text }]}>100% Private</Text>
                        </View>
                        <View style={[styles.featureItem, { backgroundColor: colors.card }]}>
                            <Ionicons name="document-text-outline" size={24} color="#f97316" />
                            <Text style={[styles.featureText, { color: colors.text }]}>PDF Download</Text>
                        </View>
                        <View style={[styles.featureItem, { backgroundColor: colors.card }]}>
                            <Ionicons name="planet-outline" size={24} color="#f97316" />
                            <Text style={[styles.featureText, { color: colors.text }]}>Vedic Astrology</Text>
                        </View>
                    </View>
                </View>

                {/* 3. Kundali Input Form */}
                <View style={[styles.formCard, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#000' }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Enter Birth Details</Text>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDark ? '#AAA' : '#666' }]}>Full Name</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: isDark ? '#333' : '#f9fafb', borderColor: isDark ? '#444' : '#e5e7eb', color: colors.text }]}
                            placeholder="Enter your full name"
                            placeholderTextColor={isDark ? '#AAA' : '#999'}
                            value={formData.name}
                            onChangeText={(t) => setFormData({ ...formData, name: t })}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={[styles.label, { color: isDark ? '#AAA' : '#666' }]}>Date of Birth</Text>
                            <View style={[styles.dateInputContainer, { backgroundColor: isDark ? '#333' : '#f9fafb', borderColor: isDark ? '#444' : '#e5e7eb' }]}>
                                <TextInput
                                    style={[styles.dateInput, { color: colors.text }]}
                                    placeholder="DD/MM/YYYY"
                                    placeholderTextColor={isDark ? '#AAA' : '#999'}
                                    value={formData.dob}
                                    onChangeText={(t) => setFormData({ ...formData, dob: t })}
                                />
                                <Ionicons name="calendar-outline" size={20} color={isDark ? '#AAA' : '#666'} />
                            </View>
                        </View>
                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                            <Text style={[styles.label, { color: isDark ? '#AAA' : '#666' }]}>Time of Birth</Text>
                            <View style={[styles.dateInputContainer, { backgroundColor: isDark ? '#333' : '#f9fafb', borderColor: isDark ? '#444' : '#e5e7eb' }]}>
                                <TextInput
                                    style={[styles.dateInput, { color: colors.text }]}
                                    placeholder="HH:MM"
                                    placeholderTextColor={isDark ? '#AAA' : '#999'}
                                    value={formData.tob}
                                    onChangeText={(t) => setFormData({ ...formData, tob: t })}
                                />
                                <Ionicons name="time-outline" size={20} color={isDark ? '#AAA' : '#666'} />
                            </View>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDark ? '#AAA' : '#666' }]}>Place of Birth</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: isDark ? '#333' : '#f9fafb', borderColor: isDark ? '#444' : '#e5e7eb', color: colors.text }]}
                            placeholder="City, Country"
                            placeholderTextColor={isDark ? '#AAA' : '#999'}
                            value={formData.place}
                            onChangeText={(t) => setFormData({ ...formData, place: t })}
                        />
                    </View>

                    <TouchableOpacity style={styles.generateButton} onPress={handleGenerate} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.generateButtonText}>Generate Kundali</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* 4. Generated Kundali (basic view) */}
                {result && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionHeader, { color: colors.text }]}>Your Kundali Summary</Text>
                        <View style={[styles.previewCard, { backgroundColor: colors.card }]}>
                            <Text style={[styles.previewList, { color: isDark ? '#AAA' : '#666' }]}>
                                Lagna: {result.lagna || result.ascendant || '—'}
                            </Text>
                            <Text style={[styles.previewList, { color: isDark ? '#AAA' : '#666' }]}>
                                Rashi: {result.rashi || result.sign || '—'}
                            </Text>
                            <Text style={[styles.previewList, { color: isDark ? '#AAA' : '#666' }]}>
                                Moon Sign: {result.moon_sign || '—'}
                            </Text>
                            {result.summary && (
                                <Text style={[styles.previewList, { color: isDark ? '#AAA' : '#666' }]}>
                                    Summary: {result.summary}
                                </Text>
                            )}
                        </View>
                    </View>
                )}

                {/* 5. What You Will Get (static info) */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.text }]}>What You Will Get</Text>
                    <View style={[styles.previewCard, { backgroundColor: colors.card }]}>
                        <View style={styles.previewHeader}>
                            <Ionicons name="pie-chart-outline" size={20} color="#fbbf24" />
                            <Text style={[styles.previewTitle, { color: colors.text }]}>Kundali Components</Text>
                        </View>
                        <Text style={[styles.previewList, { color: isDark ? '#AAA' : '#666' }]}>• Lagna (Ascendant)</Text>
                        <Text style={[styles.previewList, { color: isDark ? '#AAA' : '#666' }]}>• Rashi Chart</Text>
                        <Text style={[styles.previewList, { color: isDark ? '#AAA' : '#666' }]}>• Navamsa Chart</Text>
                        <Text style={[styles.previewList, { color: isDark ? '#AAA' : '#666' }]}>• Planet Positions</Text>
                    </View>
                    <View style={[styles.previewCard, { backgroundColor: colors.card }]}>
                        <View style={styles.previewHeader}>
                            <Ionicons name="sparkles-outline" size={20} color="#fbbf24" />
                            <Text style={[styles.previewTitle, { color: colors.text }]}>Predictions</Text>
                        </View>
                        <Text style={[styles.previewList, { color: isDark ? '#AAA' : '#666' }]}>• Personality Traits</Text>
                        <Text style={[styles.previewList, { color: isDark ? '#AAA' : '#666' }]}>• Career Indications</Text>
                        <Text style={[styles.previewList, { color: isDark ? '#AAA' : '#666' }]}>• Marriage Insights</Text>
                        <Text style={[styles.previewList, { color: isDark ? '#AAA' : '#666' }]}>• Auspicious Timings</Text>
                    </View>
                </View>

                {/* 6. Privacy Assurance */}
                <View style={[styles.privacyCard, { backgroundColor: colors.card, borderColor: isDark ? '#444' : '#fed7aa' }]}>
                    <Ionicons name="lock-closed" size={32} color="#f97316" />
                    <Text style={[styles.privacyTitle, { color: colors.text }]}>Your data never leaves your phone</Text>
                    <Text style={[styles.privacyText, { color: isDark ? '#AAA' : '#666' }]}>Kundali is generated offline using secure algorithms. No upload. No tracking. No ads.</Text>
                </View>

                {/* 7. Optional Add-ons */}
                <View style={styles.addonsContainer}>
                    <TouchableOpacity style={[styles.addonCard, { backgroundColor: colors.card }]}>
                        <Ionicons name="people-outline" size={24} color={colors.text} />
                        <Text style={[styles.addonText, { color: colors.text }]}>Book Pandit for Explanation</Text>
                        <Ionicons name="chevron-forward" size={20} color={isDark ? '#AAA' : '#ccc'} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.addonCard, { backgroundColor: colors.card }]}>
                        <Ionicons name="heart-outline" size={24} color={colors.text} />
                        <Text style={[styles.addonText, { color: colors.text }]}>Match Kundali for Marriage</Text>
                        <Ionicons name="chevron-forward" size={20} color={isDark ? '#AAA' : '#ccc'} />
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    heroSection: {
        alignItems: 'center',
        padding: 24,
    },
    heroIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    },
    heroSubtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    heroButton: {
        backgroundColor: '#f97316', // Saffron
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 25,
        elevation: 3,
    },
    heroButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    section: {
        padding: 20,
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    },
    sectionText: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 20,
    },
    featureRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    featureItem: {
        width: '45%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 1,
    },
    featureText: {
        marginTop: 8,
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
    },
    formCard: {
        margin: 20,
        padding: 20,
        borderRadius: 16,
        elevation: 4,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
    },
    dateInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    dateInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
    },
    generateButton: {
        backgroundColor: '#f97316',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    generateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    previewCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#fbbf24', // Gold
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    previewTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    previewList: {
        fontSize: 14,
        marginLeft: 28,
        marginBottom: 4,
    },
    privacyCard: {
        margin: 20,
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
    },
    privacyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 12,
        marginBottom: 8,
        textAlign: 'center',
    },
    privacyText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    addonsContainer: {
        padding: 20,
        gap: 12,
    },
    addonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        justifyContent: 'space-between',
    },
    addonText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        fontWeight: '500',
    },
});
