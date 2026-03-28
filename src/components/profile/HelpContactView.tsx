import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { Button } from '@/components/ui/Button';
import { contactSupport } from '@/services/auth.service';

export const HelpContactView = () => {
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSendMessage = async () => {
        if (!formData.name || !formData.email || !formData.subject || !formData.message) {
            Alert.alert('Required', 'Please fill in all fields');
            return;
        }

        try {
            setLoading(true);
            await contactSupport(formData);
            Alert.alert('Message Sent', 'Thank you for reaching out! We will get back to you soon.');
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error: any) {
            console.error('Contact error:', error);
            Alert.alert('Error', error?.message || 'Failed to send message. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const openLink = (url: string) => {
        Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open link'));
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Get in Touch</Text>
                <Text style={[styles.subText, { color: isDark ? '#AAA' : '#666' }]}>
                    If you have any inquiries get in touch with us. We&apos;ll be happy to help you.
                </Text>

                <TouchableOpacity 
                    style={[styles.contactCard, { backgroundColor: colors.card, borderColor: isDark ? '#333' : '#F0F0F0' }]}
                    onPress={() => Linking.openURL('tel:9847226995')}
                >
                    <Ionicons name="call-outline" size={24} color={colors.primary} />
                    <Text style={[styles.contactText, { color: colors.text }]}>+977 9847226995</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.contactCard, { backgroundColor: colors.card, borderColor: isDark ? '#333' : '#F0F0F0' }]}
                    onPress={() => Linking.openURL('mailto:pandityatra9@gmail.com')}
                >
                    <Ionicons name="mail-outline" size={24} color={colors.primary} />
                    <Text style={[styles.contactText, { color: colors.text }]}>pandityatra9@gmail.com</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Us</Text>
                <View style={styles.form}>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: isDark ? '#444' : '#E5E7EB' }]}>
                        <Ionicons name="person-outline" size={20} color={isDark ? '#AAA' : '#666'} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Full Name"
                            placeholderTextColor={isDark ? '#777' : '#AAA'}
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                        />
                    </View>

                    <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: isDark ? '#444' : '#E5E7EB' }]}>
                        <Ionicons name="mail-outline" size={20} color={isDark ? '#AAA' : '#666'} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Email Address"
                            placeholderTextColor={isDark ? '#777' : '#AAA'}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={formData.email}
                            onChangeText={(text) => setFormData({ ...formData, email: text })}
                        />
                    </View>

                    <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: isDark ? '#444' : '#E5E7EB' }]}>
                        <Ionicons name="bookmark-outline" size={20} color={isDark ? '#AAA' : '#666'} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Subject"
                            placeholderTextColor={isDark ? '#777' : '#AAA'}
                            value={formData.subject}
                            onChangeText={(text) => setFormData({ ...formData, subject: text })}
                        />
                    </View>

                    <View style={[styles.inputWrapper, styles.textAreaWrapper, { backgroundColor: colors.card, borderColor: isDark ? '#444' : '#E5E7EB' }]}>
                        <Ionicons name="chatbubble-outline" size={20} color={isDark ? '#AAA' : '#666'} style={{ marginTop: 12 }} />
                        <TextInput
                            style={[styles.input, styles.textArea, { color: colors.text }]}
                            placeholder="How can we help?"
                            placeholderTextColor={isDark ? '#777' : '#AAA'}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            value={formData.message}
                            onChangeText={(text) => setFormData({ ...formData, message: text })}
                        />
                    </View>

                    <Button 
                        title="Send Message" 
                        onPress={handleSendMessage}
                        isLoading={loading}
                        rightIcon={<Ionicons name="send" size={18} color="#FFF" />}
                        style={{ marginTop: 8 }}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Social Media</Text>
                
                <TouchableOpacity 
                    style={[styles.socialItem, { backgroundColor: colors.card }]}
                    onPress={() => openLink('https://facebook.com')}
                >
                    <View style={[styles.socialIcon, { backgroundColor: '#1877F2' }]}>
                        <Ionicons name="logo-facebook" size={20} color="#FFF" />
                    </View>
                    <View style={styles.socialTextContainer}>
                        <Text style={[styles.socialLabel, { color: colors.text }]}>Facebook</Text>
                        <Text style={[styles.socialSub, { color: isDark ? '#AAA' : '#666' }]}>Stay updated, connect, and engage with us on Facebook.</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.socialItem, { backgroundColor: colors.card }]}
                    onPress={() => openLink('https://instagram.com')}
                >
                    <View style={[styles.socialIcon, { backgroundColor: '#E4405F' }]}>
                        <Ionicons name="logo-instagram" size={20} color="#FFF" />
                    </View>
                    <View style={styles.socialTextContainer}>
                        <Text style={[styles.socialLabel, { color: colors.text }]}>Instagram</Text>
                        <Text style={[styles.socialSub, { color: isDark ? '#AAA' : '#666' }]}>Explore our visual world and discover beauty of our brand.</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.socialItem, { backgroundColor: colors.card }]}
                    onPress={() => openLink('https://github.com/ameetpokhrel02')}
                >
                    <View style={[styles.socialIcon, { backgroundColor: '#333' }]}>
                        <Ionicons name="logo-github" size={20} color="#FFF" />
                    </View>
                    <View style={styles.socialTextContainer}>
                        <Text style={[styles.socialLabel, { color: colors.text }]}>Github</Text>
                        <Text style={[styles.socialSub, { color: isDark ? '#AAA' : '#666' }]}>Follow us for real-time updates and lively discussions.</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    subText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        gap: 16,
    },
    contactText: {
        fontSize: 16,
        fontWeight: '500',
    },
    form: {
        gap: 16,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        height: 56,
        gap: 12,
    },
    textAreaWrapper: {
        height: 120,
        alignItems: 'flex-start',
    },
    input: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    textArea: {
        height: '100%',
        paddingTop: 16,
    },
    socialItem: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        gap: 16,
    },
    socialIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    socialTextContainer: {
        flex: 1,
    },
    socialLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    socialSub: {
        fontSize: 12,
        lineHeight: 18,
    },
});
