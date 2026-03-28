import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Typography } from '@/constants/Typography';

// Design system tokens — hardcoded here to match the spec exactly
const DS = {
  primary: '#f97316',
  primaryPressed: '#ea6c0a',
  surface: '#ffffff',
  surfacePressed: '#f5f5f5',
  border: '#e5e5e5',
  textOnPrimary: '#ffffff',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  disabled: '#e5e5e5',
  disabledText: '#666666',
};

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
    if (disabled) return DS.disabled;
    if (variant === 'primary') return pressed ? DS.primaryPressed : DS.primary;
    if (variant === 'secondary') return pressed ? DS.surfacePressed : DS.surface;
    return 'transparent'; // outline & text
  };

  const getTextColor = () => {
    if (disabled) return DS.disabledText;
    if (variant === 'primary') return DS.textOnPrimary;
    return DS.primary; // secondary, outline, text all use primary color
  };

  const getBorder = () => {
    if (variant === 'outline' || variant === 'secondary') {
      return { borderWidth: 1, borderColor: disabled ? DS.border : DS.primary };
    }
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
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  text: {
    ...Typography.buttonPrimary,
  },
});
