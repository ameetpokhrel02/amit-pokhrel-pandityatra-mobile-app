import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, TouchableOpacityProps, View, StyleProp } from 'react-native';
import { useTheme } from '@/store/ThemeContext';
import { Typography } from '@/constants/Typography';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = ({
  title,
  variant = 'primary',
  isLoading = false,
  style,
  textStyle,
  disabled,
  leftIcon,
  rightIcon,
  ...props
}: ButtonProps) => {
  const { colors } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return '#e5e5e5'; // Strict rules for disabled bg
    if (variant === 'secondary' || variant === 'outline' || variant === 'text') return 'transparent'; // Strict rule for secondary bg
    return '#f97316'; // Primary bg strict rule
  };

  const getTextColor = () => {
    if (disabled) return '#666666'; // Strict disabled text
    if (variant === 'secondary' || variant === 'outline' || variant === 'text') return '#f97316'; // Strict secondary text
    return '#ffffff'; // Primary text
  };

  const getBorder = () => {
    if ((variant === 'secondary' || variant === 'outline') && !disabled) {
      return { borderWidth: 1, borderColor: '#f97316' };
    }
    return {};
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        getBorder(),
        style,
      ]}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
          {rightIcon && <View style={{ marginLeft: 8 }}>{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    // Height is removed to allow vertical padding to dictate sizing optimally
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    ...Typography.buttonPrimary,
  },
});
