import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/store/ThemeContext';
import { MotiView } from 'moti';

interface FloatingChatButtonProps {
    onPress: () => void;
    style?: ViewStyle;
}

export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ onPress, style }) => {
    const { colors } = useTheme();

    return (
        <MotiView
            from={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, delay: 500 }}
            style={[styles.container, style]}
        >
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={onPress}
                style={[styles.button, { backgroundColor: colors.primary }]}
            >
                <Ionicons name="chatbubble-ellipses" size={28} color="white" />
            </TouchableOpacity>
        </MotiView>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        zIndex: 999,
    },
    button: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
});
