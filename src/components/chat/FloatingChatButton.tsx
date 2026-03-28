import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FloatingChatButtonProps {
    onPress?: () => void;
}

export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ onPress }) => {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            router.push('/(customer)/ai-assistant');
        }
    };

    return (
        <View 
            className="absolute z-[999]"
            style={{ 
                bottom: Math.max(insets.bottom, 20) + 90, // Positioned above the tab bar with generous gap
                right: 20 
            }}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={handlePress}
                className="bg-[#FF6F00] flex-row items-center px-6 py-3.5 rounded-full shadow-2xl elevation-8 border border-white/20"
                style={{
                  shadowColor: '#FF6F00',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.4,
                  shadowRadius: 15,
                }}
            >
                <Ionicons name="sparkles" size={18} color="white" />
                <Text className="text-white font-black text-xs uppercase tracking-widest ml-2">AI Guide</Text>
            </TouchableOpacity>
        </View>
    );
};
