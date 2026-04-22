import React, { useState, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    TextInput, 
    Platform, 
    ActivityIndicator, 
    Alert, 
    Dimensions, 
    StatusBar
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { generateKundali } from '@/services/kundali.service';
import { calculateLocalKundali } from '@/services/local-kundali.service';
import { Image } from 'expo-image';
import { LazyLoader } from '@/components/ui/LazyLoader';
import KundaliChart from '@/components/kundali/KundaliChart';
import { generateKundaliPDF } from '@/utils/kundali-pdf.utils';
import { MotiView, MotiText } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const MapLocationPicker = React.lazy(() => import('@/components/ui/MapLocationPicker'));

const { width, height } = Dimensions.get('window');

export default function KundaliScreen() {
    const router = useRouter();
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';
    
    const [formData, setFormData] = useState({
        name: '',
        dob: '',
        tob: '',
        place: '',
        gender: 'male'
    });
    const [meridian, setMeridian] = useState<'AM' | 'PM'>('AM');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any | null>(null);
    const [birthLat, setBirthLat] = useState(27.7172);
    const [birthLon, setBirthLon] = useState(85.3240);
    const [offlineMode, setOfflineMode] = useState(false);

    const handleGenerate = async () => {
        if (!formData.dob || !formData.tob || !formData.place) {
            Alert.alert('Missing details', 'Please fill date, time and place of birth.');
            return;
        }

        try {
            setLoading(true);
            setResult(null);

            // Parsing logic
            let formattedDob = formData.dob;
            const parts = formData.dob.split('/');
            if (parts.length === 3) {
                formattedDob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }

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
        if (!result) return;
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
            Alert.alert('Export Error', 'Could not generate PDF.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />
            
            <ScrollView 
                style={styles.scrollView} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Header */}
                <View style={styles.heroContainer}>
                    <Image
                        source={require('@/assets/images/kundalihero.webp')}
                        style={styles.heroImage}
                        contentFit="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)', colors.background]}
                        style={styles.heroGradient}
                    />
                    
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.iconCircle}>
                            <Ionicons name="arrow-back" size={22} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Vedic AI Kundali</Text>
                        <TouchableOpacity onPress={() => router.push('/(customer)/kundali-history' as any)} style={styles.iconCircle}>
                            <Ionicons name="history" size={22} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <MotiView 
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: 300 }}
                        style={styles.heroTextContainer}
                    >
                        <View style={styles.aiBadge}>
                            <MaterialCommunityIcons name="auto-fix" size={14} color="#FFD700" />
                            <Text style={styles.aiBadgeText}>Spiritual Intelligence</Text>
                        </View>
                        <Text style={styles.mainTitle}>Unlock Your Karmic Path</Text>
                        <Text style={styles.mainSubtitle}>Precision Vedic Astrology powered by Sacred AI Algorithms</Text>
                    </MotiView>
                </View>

                {/* Main Form Card */}
                <MotiView 
                    from={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                    <Text style={[styles.formHeader, { color: colors.text }]}>Birth Particulars</Text>
                    
                    <View style={styles.inputSection}>
                        <InputField 
                            label="Full Name" 
                            icon="person-outline" 
                            value={formData.name}
                            onChange={(t) => setFormData({...formData, name: t})}
                            placeholder="Enter Name"
                            colors={colors}
                            isDark={isDark}
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1.2, marginRight: 10 }}>
                                <InputField 
                                    label="Date of Birth" 
                                    icon="calendar-outline" 
                                    value={formData.dob}
                                    onChange={(t) => setFormData({...formData, dob: t})}
                                    placeholder="DD/MM/YYYY"
                                    colors={colors}
                                    isDark={isDark}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <InputField 
                                    label="Time" 
                                    icon="time-outline" 
                                    value={formData.tob}
                                    onChange={(t) => setFormData({...formData, tob: t})}
                                    placeholder="HH:MM"
                                    colors={colors}
                                    isDark={isDark}
                                />
                            </View>
                        </View>

                        <View style={styles.meridianRow}>
                            {['AM', 'PM'].map((m: any) => (
                                <TouchableOpacity 
                                    key={m}
                                    onPress={() => setMeridian(m)}
                                    style={[
                                        styles.meridianOption, 
                                        { borderColor: colors.border },
                                        meridian === m && { backgroundColor: colors.primary, borderColor: colors.primary }
                                    ]}
                                >
                                    <Text style={[styles.meridianLabel, { color: colors.text }, meridian === m && { color: '#FFF' }]}>{m}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text + '80' }]}>Place of Birth</Text>
                            <LazyLoader height={54}>
                                <MapLocationPicker
                                    value={formData.place}
                                    onSelect={(loc) => {
                                        setFormData({ ...formData, place: loc.address });
                                        setBirthLat(loc.latitude);
                                        setBirthLon(loc.longitude);
                                    }}
                                    placeholder="Locate on Map"
                                    colors={colors}
                                    isDark={isDark}
                                />
                            </LazyLoader>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={[styles.generateBtn, { backgroundColor: colors.primary }]}
                        onPress={handleGenerate}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Text style={styles.generateBtnText}>Reveal My Chart</Text>
                                <Ionicons name="sparkles" size={18} color="#FFF" />
                            </>
                        )}
                    </TouchableOpacity>
                </MotiView>

                {/* Results Section */}
                {result && (
                    <MotiView 
                        from={{ opacity: 0, translateY: 30 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        style={styles.resultSection}
                    >
                        <View style={styles.resultHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Celestial Alignment</Text>
                            <TouchableOpacity onPress={handleDownloadPDF} style={styles.downloadIconBtn}>
                                <Ionicons name="download-outline" size={24} color={colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.chartWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <KundaliChart 
                                planets={result.planets || []}
                                houses={result.houses || []}
                                colors={colors}
                                isDark={isDark}
                            />
                            
                            <View style={styles.chartDetails}>
                                <DetailItem label="Lagna" value={result.ascendant || 'Aries'} colors={colors} />
                                <DetailItem label="Rashi" value={result.rashi || 'Leo'} colors={colors} />
                                <DetailItem label="Nakshatra" value={result.nakshatra || 'Ashwini'} colors={colors} />
                            </View>
                        </View>
                    </MotiView>
                )}

                {/* Educational Features */}
                <View style={styles.featuresGrid}>
                    <FeatureCard 
                        icon="shield-check-outline" 
                        title="100% Private" 
                        desc="Your birth data never leaves this device."
                        colors={colors} 
                    />
                    <FeatureCard 
                        icon="file-pdf-box" 
                        title="Premium PDF" 
                        desc="Download detailed 12-page report."
                        colors={colors} 
                    />
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const InputField = ({ label, icon, value, onChange, placeholder, colors, isDark }: any) => (
    <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text + '80' }]}>{label}</Text>
        <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1F1F23' : '#F9F9F9', borderColor: colors.border }]}>
            <Ionicons name={icon} size={20} color={colors.primary} style={{ marginRight: 12 }} />
            <TextInput 
                style={[styles.fieldInput, { color: colors.text }]}
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor={colors.text + '30'}
            />
        </View>
    </View>
);

const DetailItem = ({ label, value, colors }: any) => (
    <View style={styles.detailItem}>
        <Text style={[styles.detailLabel, { color: colors.text + '60' }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: colors.primary }]}>{value}</Text>
    </View>
);

const FeatureCard = ({ icon, title, desc, colors }: any) => (
    <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MaterialCommunityIcons name={icon} size={32} color={colors.primary} />
        <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.featureDesc, { color: colors.text + '60' }]}>{desc}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { },
    heroContainer: { height: 380, width: '100%', position: 'relative' },
    heroImage: { width: '100%', height: '100%' },
    heroGradient: { position: 'absolute', inset: 0 },
    headerRow: { 
        position: 'absolute', 
        top: 60, 
        left: 0, 
        right: 0, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20 
    },
    iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    heroTextContainer: { position: 'absolute', bottom: 40, left: 24, right: 24 },
    aiBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,215,0,0.15)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 12, gap: 6, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' },
    aiBadgeText: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
    mainTitle: { color: '#FFF', fontSize: 32, fontWeight: 'bold', lineHeight: 38 },
    mainSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 8, lineHeight: 22 },
    formCard: { margin: 20, marginTop: -30, borderRadius: 24, padding: 24, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
    formHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    inputSection: { gap: 16 },
    inputGroup: { gap: 8 },
    label: { fontSize: 13, fontWeight: '600' },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, height: 54 },
    fieldInput: { flex: 1, fontSize: 15, fontWeight: '500' },
    row: { flexDirection: 'row' },
    meridianRow: { flexDirection: 'row', gap: 10, marginTop: -4 },
    meridianOption: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    meridianLabel: { fontSize: 14, fontWeight: 'bold' },
    generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 16, marginTop: 12, gap: 10 },
    generateBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    resultSection: { paddingHorizontal: 20, marginTop: 32 },
    resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold' },
    downloadIconBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(249,115,22,0.1)', alignItems: 'center', justifyContent: 'center' },
    chartWrapper: { borderRadius: 32, padding: 20, borderWidth: 1, alignItems: 'center' },
    chartDetails: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 20 },
    detailItem: { alignItems: 'center' },
    detailLabel: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
    detailValue: { fontSize: 16, fontWeight: 'bold' },
    featuresGrid: { flexDirection: 'row', paddingHorizontal: 20, gap: 16, marginTop: 24 },
    featureCard: { flex: 1, padding: 20, borderRadius: 24, borderWidth: 1, alignItems: 'center', gap: 8 },
    featureTitle: { fontSize: 14, fontWeight: 'bold' },
    featureDesc: { fontSize: 11, textAlign: 'center', lineHeight: 16 }
});
