import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { getImageUrl } from '@/utils/image';
import { useCartStore } from '@/store/cart.store';

interface ProductCardProps {
    id: number;
    title: string;
    price: number;
    image?: string;
    description?: string;
    onAddSuccess?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
    id,
    title,
    price,
    image,
    description,
    onAddSuccess
}) => {
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';

    const handleAddToCart = () => {
        try {
            useCartStore.getState().addToCart({
                id: String(id),
                name: title,
                price: price,
                image: image || '',
                description: description || '',
                category: 'Chat Recommendation'
            } as any);
            if (onAddSuccess) onAddSuccess();
        } catch (error) {
            console.error('Failed to add to cart:', error);
        }
    };

    return (
        <View 
            className="w-full max-w-[240px] rounded-2xl border mb-2 overflow-hidden shadow-sm elevation-1"
            style={{ backgroundColor: colors.card, borderColor: isDark ? '#444' : '#E5E7EB' }}
        >
            <Image
                source={{ uri: getImageUrl(image) || '' }}
                className="w-full h-28"
                contentFit="cover"
            />
            <View className="p-3">
                <Text 
                    className="text-base font-bold mb-1" 
                    style={{ color: colors.text }} 
                    numberOfLines={1}
                >
                    {title}
                </Text>
                <Text 
                    className="text-lg font-extrabold mb-1" 
                    style={{ color: colors.primary }}
                >
                    रू {price}
                </Text>
                {description && (
                    <Text 
                        className="text-xs mb-3 leading-4" 
                        style={{ color: isDark ? '#AAA' : '#666' }} 
                        numberOfLines={2}
                    >
                        {description}
                    </Text>
                )}
                
                <TouchableOpacity
                    className="flex-row items-center justify-center py-2 rounded-xl gap-2"
                    style={{ backgroundColor: colors.primary }}
                    onPress={handleAddToCart}
                >
                    <Ionicons name="cart-outline" size={18} color="white" />
                    <Text className="text-white text-sm font-bold">Add to Cart</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};
