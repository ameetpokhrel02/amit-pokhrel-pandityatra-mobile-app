import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { submitSiteReview } from '@/services/review.service';

export default function PlatformFeedbackScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Error', 'Please select a rating');
            return;
        }

        try {
            setSubmitting(true);
            await submitSiteReview({ rating, comment });
            Alert.alert(
                'Thank You!',
                'Your feedback helps us improve the spiritual experience for everyone.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error) {
            console.error('Error submitting site review:', error);
            Alert.alert('Error', 'Failed to submit feedback. Please try again later.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Rate PanditYatra</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.illustrationContainer}>
                    <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="heart" size={60} color={colors.primary} />
                    </View>
                </View>

                <Text style={[styles.title, { color: colors.text }]}>Your Voice Matters</Text>
                <Text style={[styles.subtitle, { color: colors.text, opacity: 0.6 }]}>
                    How do you like your experience with PanditYatra? We're always trying to improve.
                </Text>

                <View style={styles.ratingSection}>
                    <Text style={[styles.sectionLabel, { color: colors.text }]}>Overall Rating</Text>
                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <TouchableOpacity 
                                key={star} 
                                onPress={() => setRating(star)}
                                style={styles.starTouch}
                            >
                                <Ionicons 
                                    name={star <= rating ? "star" : "star-outline"} 
                                    size={40} 
                                    color={star <= rating ? "#FFD700" : colors.text + '20'} 
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.feedbackSection}>
                    <Text style={[styles.sectionLabel, { color: colors.text }]}>Tell us more (Optional)</Text>
                    <TextInput
                        style={[styles.textInput, { 
                            backgroundColor: colors.card, 
                            color: colors.text,
                            borderColor: colors.border
                        }]}
                        multiline
                        numberOfLines={4}
                        placeholder="What can we do better?"
                        placeholderTextColor={colors.text + '40'}
                        value={comment}
                        onChangeText={setComment}
                        textAlignVertical="top"
                    />
                </View>

                <Button
                    title={submitting ? "Submitting..." : "Submit Feedback"}
                    onPress={handleSubmit}
                    isLoading={submitting}
                    disabled={submitting}
                    style={styles.submitButton}
                />
            </ScrollView>
        </KeyboardAvoidingView>
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
        paddingTop: 60,
        paddingBottom: 16,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 24,
        alignItems: 'center',
    },
    illustrationContainer: {
        marginBottom: 32,
        marginTop: 16,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 40,
        paddingHorizontal: 20,
        lineHeight: 22,
    },
    ratingSection: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 32,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    starTouch: {
        padding: 4,
    },
    feedbackSection: {
        width: '100%',
        marginBottom: 40,
    },
    textInput: {
        borderRadius: 12,
        padding: 16,
        height: 120,
        borderWidth: 1,
        fontSize: 16,
    },
    submitButton: {
        width: '100%',
        height: 56,
    },
});
