import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/store/ThemeContext';
import { aiRecommendSamagri } from '@/services/shop.service';
import { SamagriItem } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { MotiView, MotiText } from 'moti';
import { useCart } from '@/store/CartContext';

export default function AIRecommendScreen() {
    const router = useRouter();
    const { colors, theme } = useTheme();
    const { addToCart } = useCart();
    const isDark = theme === 'dark';

    const [pujaName, setPujaName] = useState('');
    const [loading, setLoading] = useState(false);
    const [recommendations, setRecommendations] = useState<SamagriItem[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    const handleRecommend = async () => {
        if (!pujaName.trim()) {
            Alert.alert('Empty Input', 'Please enter a Puja or Ritual name.');
            return;
        }

        try {
            setLoading(true);
            const data = await aiRecommendSamagri({ puja_name: pujaName });
            setRecommendations(data.recommended_items || data);
            setHasSearched(true);
        } catch (error: any) {
            console.error('AI Recommendation failed:', error);
            Alert.alert('Error', 'Failed to get recommendations. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (item: SamagriItem) => {
        addToCart({ ...item, id: String(item.id) } as any);
        Alert.alert('Added', `${item.name} has been added to your cart.`);
    };

    const handleAddAllToCart = () => {
        recommendations.forEach(item => addToCart({ ...item, id: String(item.id) } as any));
        Alert.alert('Success', 'All recommended items added to cart.');
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.card }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>AI Samagri Finder</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={[styles.searchCard, { backgroundColor: colors.card }]}
                >
                    <Ionicons name="sparkles" size={32} color={colors.primary} style={styles.sparkleIcon} />
                    <Text style={[styles.searchTitle, { color: colors.text }]}>What puja are you planning?</Text>
                    <Text style={[styles.searchSubtitle, { color: isDark ? '#AAA' : '#666' }]}>
                        Enter the name of the ritual, and our AI will suggest all required samagri items.
                    </Text>

                    <TextInput
                        style={[styles.input, {
                            backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
                            color: colors.text,
                            borderColor: isDark ? '#333' : '#DDD'
                        }]}
                        placeholder="e.g. Satyanarayan Puja, Ganesh Chaturthi"
                        placeholderTextColor={isDark ? '#666' : '#999'}
                        value={pujaName}
                        onChangeText={setPujaName}
                    />

                    <Button
                        title={loading ? "Analyzing..." : "Find Samagri"}
                        onPress={handleRecommend}
                        isLoading={loading}
                        style={styles.searchButton}
                    />
                </MotiView>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <MotiText
                            from={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ loop: true, duration: 1000 }}
                            style={[styles.loadingText, { color: colors.text }]}
                        >
                            Our AI is consulting the scriptures...
                        </MotiText>
                    </View>
                ) : hasSearched && (
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        style={styles.resultsContainer}
                    >
                        <View style={styles.resultsHeader}>
                            <Text style={[styles.resultsTitle, { color: colors.text }]}>Recommended Items</Text>
                            {recommendations.length > 0 && (
                                <TouchableOpacity onPress={handleAddAllToCart}>
                                    <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Add All</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {recommendations.length > 0 ? (
                            recommendations.map((item, index) => (
                                <MotiView
                                    key={item.id}
                                    from={{ opacity: 0, translateX: -20 }}
                                    animate={{ opacity: 1, translateX: 0 }}
                                    transition={{ delay: index * 100 }}
                                    style={[styles.itemCard, { backgroundColor: colors.card }]}
                                >
                                    <View style={styles.itemInfo}>
                                        <View style={[styles.itemIconContainer, { backgroundColor: isDark ? '#333' : '#F9731615' }]}>
                                            <Ionicons name="leaf-outline" size={24} color={colors.primary} />
                                        </View>
                                        <View style={styles.itemTextContainer}>
                                            <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                                            <Text style={[styles.itemPrice, { color: colors.primary }]}>NPR {item.price}</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleAddToCart(item)}
                                        style={[styles.addButton, { backgroundColor: colors.primary }]}
                                    >
                                        <Ionicons name="add" size={24} color="white" />
                                    </TouchableOpacity>
                                </MotiView>
                            ))
                        ) : (
                            <View style={styles.emptyResults}>
                                <Ionicons name="alert-circle-outline" size={48} color={isDark ? '#444' : '#CCC'} />
                                <Text style={[styles.emptyText, { color: isDark ? '#666' : '#999' }]}>
                                    No specific items found. Try a more common puja name.
                                </Text>
                            </View>
                        )}
                    </MotiView>
                )}
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
        padding: 20,
    },
    searchCard: {
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 30,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    sparkleIcon: {
        marginBottom: 16,
    },
    searchTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    searchSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    input: {
        width: '100%',
        height: 56,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        marginBottom: 20,
        borderWidth: 1,
    },
    searchButton: {
        width: '100%',
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        fontStyle: 'italic',
    },
    resultsContainer: {
        marginBottom: 40,
    },
    resultsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    resultsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    itemCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
        elevation: 1,
    },
    itemInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    itemIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    itemTextContainer: {
        flex: 1,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyResults: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        textAlign: 'center',
        maxWidth: 200,
    },
});
