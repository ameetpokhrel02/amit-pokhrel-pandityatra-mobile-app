import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/constants/Colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon
}: ButtonProps) {

  const getBackgroundColor = (pressed: boolean) => {
    if (disabled) return '#BDBDBD';
    if (variant === 'primary') return pressed ? Colors.light.deepRed : Colors.light.primary;
    if (variant === 'secondary') return pressed ? '#E0E0E0' : Colors.light.white;
    if (variant === 'outline') return 'transparent';
    if (variant === 'text') return 'transparent';
    return Colors.light.primary;
  };

  const getTextColor = () => {
    if (disabled) return '#757575';
    if (variant === 'primary') return Colors.light.lightGold;
    if (variant === 'secondary') return Colors.light.primary;
    if (variant === 'outline') return Colors.light.primary;
    if (variant === 'text') return Colors.light.primary;
    return Colors.light.lightGold;
  };

  const getBorder = () => {
    if (variant === 'outline') return { borderWidth: 1, borderColor: Colors.light.primary };
    return {};
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isLoading}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: getBackgroundColor(pressed) },
        getBorder(),
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
          {rightIcon && <View style={{ marginLeft: 8 }}>{rightIcon}</View>}
        </View>
      )}
    </Pressable>
  );

}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter', // Assuming Inter is available or falls back
  },
});
