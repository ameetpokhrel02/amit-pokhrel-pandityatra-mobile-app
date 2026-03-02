import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { registerPandit } from '@/services/pandit.service';
import { useTheme } from '@/store/ThemeContext';

const EXPERTISE_OPTIONS = [
    'Vedic Rituals', 'Astrology & Kundali',
    'Marriage Ceremonies', 'Griha Pravesh',
    'Naming Ceremony', 'Funeral Rites',
    'Satyanarayan Puja', 'Lakshmi Puja',
    'Ganesh Puja', 'Navgraha Puja',
    'Rudrabhishek', 'Thread Ceremony',
];

export default function PanditProfileSetupScreen() {
    const router = useRouter();
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';
    const [form, setForm] = useState({
        experience: '',
        bio: '',
        language: '',
    });

    const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const toggleExpertise = (item: string) => {
        if (selectedExpertise.includes(item)) {
            setSelectedExpertise(selectedExpertise.filter(i => i !== item));
        } else {
            setSelectedExpertise([...selectedExpertise, item]);
        }
    };

    const handleSubmit = async () => {
        if (!form.experience || !form.language || selectedExpertise.length === 0) {
            Alert.alert('Required', 'Please fill in experience, language, and at least one expertise.');
            return;
        }

        try {
            setLoading(true);
            await registerPandit({
                experience_years: parseInt(form.experience),
                expertise: selectedExpertise.join(', '),
                language: form.language,
                bio: form.bio,
            });

            setIsSuccess(true);
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', error.message || 'Failed to save profile');
        } finally {
            setLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <View style={[styles.successContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="checkmark-circle" size={100} color={colors.primary} />
                <Text style={[styles.successTitle, { color: colors.text }]}>Profile Submitted!</Text>
                <Text style={[styles.successSubtitle, { color: colors.icon }]}>
                    Your profile is now under review. Our team will verify your details and approve your account shortly.
                </Text>
                <Button
                    title="Back to Login"
                    onPress={() => router.replace('/auth/login')}
                    style={[styles.successButton, { backgroundColor: colors.primary }] as any}
                />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Professional Details</Text>
                <Text style={[styles.headerSubtitle, { color: colors.icon }]}>Tell us more about your sacred expertise</Text>

                <View style={styles.form}>
                    {/* Years of Experience */}
                    <Input
                        label="Years of Experience *"
                        placeholder="e.g., 10"
                        keyboardType="numeric"
                        value={form.experience}
                        onChangeText={(t) => setForm({ ...form, experience: t })}
                        leftIcon={<Ionicons name="calendar-outline" size={20} color={colors.icon} />}
                    />

                    {/* Primary Language */}
                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: colors.text }]}>Primary Language *</Text>
                        <View style={styles.languageContainer}>
                            {['Nepali', 'English', 'Hindi', 'Sanskrit', 'Maithili'].map((lang) => (
                                <TouchableOpacity
                                    key={lang}
                                    style={[
                                        styles.languageOption,
                                        { backgroundColor: colors.card, borderColor: colors.border },
                                        form.language === lang && { backgroundColor: colors.primary, borderColor: colors.primary }
                                    ]}
                                    onPress={() => setForm({ ...form, language: lang })}
                                >
                                    <Text style={[
                                        styles.languageText,
                                        { color: colors.text },
                                        form.language === lang && styles.languageTextSelected
                                    ]}>{lang}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Areas of Expertise */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionLabel, { color: colors.text }]}>Areas of Expertise * (Select all that apply)</Text>
                        <View style={[styles.expertiseGrid, { backgroundColor: isDark ? colors.card : '#F3E8D6', borderColor: colors.border }]}>
                            {EXPERTISE_OPTIONS.map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    style={styles.checkboxRow}
                                    onPress={() => toggleExpertise(item)}
                                >
                                    <View style={[styles.checkbox, { backgroundColor: colors.background, borderColor: colors.border }, selectedExpertise.includes(item) && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                                        {selectedExpertise.includes(item) && <Ionicons name="checkmark" size={14} color="#FFF" />}
                                    </View>
                                    <Text style={[styles.checkboxLabel, { color: colors.text }]}>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Brief Bio */}
                    <Input
                        label="Brief Bio"
                        placeholder="Tell seekers about your background..."
                        multiline
                        numberOfLines={4}
                        style={styles.textArea}
                        value={form.bio}
                        onChangeText={(t) => setForm({ ...form, bio: t })}
                    />

                    <Button
                        title={loading ? "Saving..." : "Submit for Verification"}
                        onPress={handleSubmit}
                        isLoading={loading}
                        disabled={loading}
                        style={[styles.submitButton, { backgroundColor: colors.primary }] as any}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FDF8F6',
    },
    scrollContent: {
        padding: 24,
        paddingTop: 60,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 32,
    },
    form: {
        gap: 16,
    },
    section: {
        marginBottom: 8,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 12,
    },
    expertiseGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: '#F3E8D6',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '50%',
        marginBottom: 12,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#9CA3AF',
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    checkboxChecked: {
        backgroundColor: Colors.light.primary,
        borderColor: Colors.light.primary,
    },
    checkboxLabel: {
        fontSize: 13,
        color: '#4B5563',
    },
    languageContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    languageOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFF',
    },
    languageOptionSelected: {
        backgroundColor: Colors.light.primary,
        borderColor: Colors.light.primary,
    },
    languageText: {
        fontSize: 14,
        color: '#4B5563',
    },
    languageTextSelected: {
        color: '#FFF',
        fontWeight: '600',
    },
    inputContainer: {
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 6,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    submitButton: {
        marginTop: 8,
        backgroundColor: '#D97706',
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#FFF',
    },
    successTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F2937',
        marginTop: 20,
        marginBottom: 12,
    },
    successSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    successButton: {
        width: '100%',
    },
});
