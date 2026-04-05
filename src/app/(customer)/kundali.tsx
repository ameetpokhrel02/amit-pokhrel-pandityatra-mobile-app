import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, ActivityIndicator, Alert, Dimensions, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { generateKundali } from '@/services/kundali.service';
import { calculateLocalKundali } from '@/services/local-kundali.service';
import { Image } from 'expo-image';
import { LazyLoader } from '@/components/ui/LazyLoader';
import KundaliChart from '@/components/kundali/KundaliChart';
import { generateKundaliPDF } from '@/utils/kundali-pdf.utils';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

const MapLocationPicker = React.lazy(() => import('@/components/ui/MapLocationPicker'));


const { width } = Dimensions.get('window');

export default function KundaliScreen() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        dob: '',
        tob: '',
        place: '',
        gender: ''
    });
    const [meridian, setMeridian] = useState<'AM' | 'PM'>('AM');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any | null>(null);
    const [birthLat, setBirthLat] = useState(27.7172);
    const [birthLon, setBirthLon] = useState(85.3240);
    const [offlineMode, setOfflineMode] = useState(false);
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

            // Convert DD/MM/YYYY to YYYY-MM-DD for the backend
            let formattedDob = formData.dob;
            const parts = formData.dob.split('/');
            if (parts.length === 3) {
                formattedDob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }

            // Ensure time has HH:MM format
            let formattedTime = formData.tob;
            const timeParts = formData.tob.split(':');
            if (timeParts.length >= 2) {
                formattedTime = `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
            }

            const payload = {
                dob: formattedDob,
                time: `${formattedTime} ${meridian}`,
                latitude: birthLat,
                longitude: birthLon,
                timezone: 'Asia/Kathmandu',
            };

            if (offlineMode) {
                const localRes = calculateLocalKundali({
                    dob: formattedDob,
                    time: formattedTime,
                    lat: birthLat,
                    lon: birthLon
                });
                setResult(localRes);
                return;
            }

            try {
                const res = await generateKundali(payload);
                setResult(res);
            } catch (apiErr) {
                console.warn('API Failed, falling back to Local Engine');
                const localRes = calculateLocalKundali({
                    dob: formattedDob,
                    time: formattedTime,
                    lat: birthLat,
                    lon: birthLon
                });
                setResult(localRes);
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Unable to generate Kundali. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!result) {
            Alert.alert('No data', 'Please generate your Kundali first.');
            return;
        }
        try {
            setLoading(true);
            await generateKundaliPDF(
                {
                    name: formData.name || 'Sacred Soul',
                    dob: formData.dob,
                    tob: `${formData.tob} ${meridian}`,
                    place: formData.place
                },
                result
            );
        } catch (err) {
            console.error(err);
            Alert.alert('Export Error', 'Could not generate PDF. Please ensure storage permissions are granted.');
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
                <Text style={[styles.headerTitle, { color: colors.text }]}>AI Kundali</Text>
                <TouchableOpacity onPress={() => router.push('/(customer)/kundali-history' as any)}>
                    <Ionicons name="time-outline" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* ===== HERO BANNER SECTION ===== */}
                <View style={styles.heroBanner}>
                    <Image
                        source={require('@/assets/images/kundalihero.webp')}
                        style={styles.heroImage}
                        contentFit="cover"
                    />
                    {/* Gradient overlay at bottom for text readability */}
                    <View style={styles.heroOverlay}>
                        <View style={styles.heroContent}>
                            <View style={styles.heroBadge}>
                                <Ionicons name="sparkles" size={14} color="#FFF" />
                                <Text style={styles.heroBadgeText}>AI-Powered</Text>
                            </View>
                            <Text style={styles.heroTitle}>Your Divine Birth Chart</Text>
                            <Text style={styles.heroSubtitle}>
                                Generate precise Vedic Kundali using advanced spiritual AI
                            </Text>
                            <TouchableOpacity
                                style={styles.heroCTA}
                                onPress={handleGenerate}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="planet" size={18} color="#FFF" />
                                        <Text style={styles.heroCTAText}>Generate Kundali</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>


                {/* 2. What Is Offline Kundali? */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.text }]}>What Is AI Kundali?</Text>
                    <Text style={[styles.sectionText, { color: isDark ? '#AAA' : '#555' }]}>
                        AI Kundali generates your birth chart using Vedic astrology algorithms powered by our spiritual engine. Get precise insights into your life&apos;s path.
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
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={[styles.dateInputContainer, { flex: 1, backgroundColor: isDark ? '#333' : '#f9fafb', borderColor: isDark ? '#444' : '#e5e7eb' }]}>
                                    <TextInput
                                        style={[styles.dateInput, { color: colors.text }]}
                                        placeholder="HH:MM"
                                        placeholderTextColor={isDark ? '#AAA' : '#999'}
                                        value={formData.tob}
                                        onChangeText={(t) => setFormData({ ...formData, tob: t })}
                                        keyboardType="numeric"
                                    />
                                    <Ionicons name="time-outline" size={20} color={isDark ? '#AAA' : '#666'} />
                                </View>
                                <View style={[styles.meridianContainer, { backgroundColor: isDark ? '#333' : '#f9fafb', borderColor: isDark ? '#444' : '#e5e7eb' }]}>
                                    <TouchableOpacity 
                                        style={[styles.meridianBtn, meridian === 'AM' && { backgroundColor: colors.primary }]} 
                                        onPress={() => setMeridian('AM')}
                                    >
                                        <Text style={[styles.meridianText, { color: meridian === 'AM' ? '#FFF' : colors.text }]}>AM</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.meridianBtn, meridian === 'PM' && { backgroundColor: colors.primary }]} 
                                        onPress={() => setMeridian('PM')}
                                    >
                                        <Text style={[styles.meridianText, { color: meridian === 'PM' ? '#FFF' : colors.text }]}>PM</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDark ? '#AAA' : '#666' }]}>Place of Birth</Text>
                        <LazyLoader height={56}>
                          <MapLocationPicker
                              value={formData.place}
                              onSelect={(loc) => {
                                  setFormData({ ...formData, place: loc.address });
                                  setBirthLat(loc.latitude);
                                  setBirthLon(loc.longitude);
                              }}
                              placeholder="Select birth place on map"
                              colors={colors}
                              isDark={isDark}
                              label="Select Birth Place"
                          />
                        </LazyLoader>
                    </View>

                    {/* Offline Mode Toggle */}
                    <View style={styles.offlineToggleRow}>
                        <View>
                            <Text style={[styles.offlineLabel, { color: colors.text }]}>Private Offline Mode</Text>
                            <Text style={styles.offlineSublabel}>100% On-device WASM Logic</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => setOfflineMode(!offlineMode)}
                            style={[
                                styles.toggleSwitch, 
                                { backgroundColor: offlineMode ? colors.primary : '#E5E7EB' }
                            ]}
                        >
                            <View style={[styles.toggleThumb, { left: offlineMode ? 22 : 2 }]} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={[styles.generateButton, { backgroundColor: colors.primary }]} onPress={handleGenerate} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.generateButtonText}>Generate Kundali</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* 4. Generated Kundali (Premium View) */}
                {result && (
                    <MotiView 
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 500 }}
                        style={styles.section}
                    >
                        <View style={styles.resultHeader}>
                            <Text style={[styles.sectionHeader, { color: colors.text, marginBottom: 0 }]}>Your Birth Chart</Text>
                            <TouchableOpacity style={[styles.pdfButton, { backgroundColor: colors.primary }]} onPress={handleDownloadPDF}>
                                <Ionicons name="download-outline" size={18} color="#FFF" />
                                <Text style={styles.pdfButtonText}>PDF</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <View style={[styles.chartContainer, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#ea580c' }]}>
                            <KundaliChart 
                                planets={result.planets || []}
                                houses={result.houses || []}
                                colors={colors}
                                isDark={isDark}
                            />
                            <View style={styles.chartLegend}>
                                <Text style={[styles.lagnaText, { color: colors.text }]}>
                                    <Text style={{ fontWeight: 'bold', color: colors.primary }}>Ascendant (Lagna):</Text> {result.ascendant || result.lagna || '—'}
                                </Text>
                                {result.isOffline && (
                                    <View style={styles.offlineStatus}>
                                        <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                                        <Text style={styles.offlineStatusText}>Verified On-Device Engine</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </MotiView>
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
    heroBanner: {
        width: width,
        height: 220,
        position: 'relative',
        marginBottom: 20,
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingTop: 40,
        paddingBottom: 16,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    heroContent: {
        alignItems: 'flex-start',
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(249,115,22,0.9)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        marginBottom: 8,
    },
    heroBadgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 4,
        fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    },
    heroSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 12,
        lineHeight: 18,
    },
    heroCTA: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f97316',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 8,
        elevation: 3,
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
    },
    heroCTAText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
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
    offlineToggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        marginTop: 10,
        marginBottom: 5,
    },
    offlineLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    offlineSublabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    toggleSwitch: {
        width: 50,
        height: 28,
        borderRadius: 14,
        padding: 2,
        justifyContent: 'center',
    },
    toggleThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFF',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    meridianContainer: {
        flexDirection: 'row',
        marginLeft: 8,
        borderWidth: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    meridianBtn: {
        paddingHorizontal: 10,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    meridianText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    pdfButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    pdfButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 12,
    },
    chartContainer: {
        borderRadius: 24,
        padding: 10,
        elevation: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        alignItems: 'center',
    },
    chartLegend: {
        width: '100%',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
    },
    lagnaText: {
        fontSize: 16,
    },
    offlineStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 8,
        backgroundColor: 'rgba(16,185,129,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    offlineStatusText: {
        fontSize: 10,
        color: '#10B981',
        fontWeight: 'bold',
    },
});
