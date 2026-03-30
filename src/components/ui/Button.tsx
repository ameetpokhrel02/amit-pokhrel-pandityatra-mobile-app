import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle, 
  TouchableOpacityProps, 
  View, 
  StyleProp 
} from 'react-native';
import { useTheme } from '@/store/ThemeContext';
import { Typography } from '@/constants/Typography';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'google' | 'phone' | 'email';
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  textClassName?: string;
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
  containerClassName = '',
  textClassName = '',
  ...props
}: ButtonProps) => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          button: { backgroundColor: colors.primary },
          text: { color: '#FFFFFF' }
        };
      case 'secondary':
        return {
          button: { backgroundColor: colors.secondary },
          text: { color: colors.text }
        };
      case 'outline':
        return {
          button: { 
            backgroundColor: 'transparent', 
            borderWidth: 1, 
            borderColor: colors.primary 
          },
          text: { color: colors.primary }
        };
      case 'google':
        return {
          button: { 
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF', 
            borderWidth: 1, 
            borderColor: isDark ? '#374151' : '#E5E7EB' 
          },
          text: { color: colors.text }
        };
      case 'phone':
        return {
          button: { backgroundColor: colors.primary },
          text: { color: '#FFFFFF' }
        };
      case 'email':
        return {
          button: { 
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF', 
            borderWidth: 1, 
            borderColor: colors.primary 
          },
          text: { color: colors.primary }
        };
      case 'text':
        return {
          button: { backgroundColor: 'transparent' },
          text: { color: colors.primary }
        };
      default:
        return {
          button: { backgroundColor: colors.primary },
          text: { color: '#FFFFFF' }
        };
    }
  };

  const variantStyle = getVariantStyles();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variantStyle.button,
        disabled && { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
        style,
      ]}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variantStyle.text.color} size="small" />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text 
            style={[
              styles.text, 
              variantStyle.text, 
              disabled && { color: isDark ? '#9CA3AF' : '#6B7280' },
              textStyle
            ]}
          >
            {title}
          </Text>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...Typography.buttonPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  iconLeft: {
    marginRight: 12,
  },
  iconRight: {
    marginLeft: 12,
  },
});
