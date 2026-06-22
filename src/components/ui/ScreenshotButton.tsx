import React from 'react';
import {
  TouchableOpacity,
  TouchableNativeFeedback,
  View,
  Text,
  ActivityIndicator,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/store/ThemeContext';
import { useScreenshot } from '@/hooks/useScreenshot';

export interface ScreenshotButtonProps {
  /** A React ref attached to the View you want to capture */
  captureRef: React.RefObject<any>;
  /** Primary label shown next to the icon */
  label?: string;
  /** Label shown during capture+save */
  loadingLabel?: string;
  /** Label shown after a successful save */
  successLabel?: string;
  /** Visual variant */
  variant?: 'solid' | 'outline' | 'ghost';
  /** Size preset (not used for styling but accepted for compatibility) */
  size?: string;
  /** Whether to capture silently without native alerts (handled in hook options) */
  silent?: boolean;
  /** Externally controlled disabled state */
  disabled?: boolean;
  /** Callback fired when save succeeds, with the file URI */
  onSuccess?: (uri: string) => void;
  /** Callback fired when save fails */
  onError?: (error: string) => void;
  /** Extra container style */
  style?: StyleProp<ViewStyle>;
}

export const ScreenshotButton: React.FC<ScreenshotButtonProps> = ({
  captureRef,
  label = 'Save Screenshot',
  loadingLabel = 'Saving...',
  successLabel,
  variant = 'solid',
  size,
  silent = false,
  disabled = false,
  onSuccess,
  onError,
  style,
}) => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const { captureAndSave, loading } = useScreenshot();
  const [isSuccess, setIsSuccess] = React.useState(false);

  const isDisabled = disabled || loading;

  const handlePress = async () => {
    if (isDisabled) return;

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }

    const savedUri = await captureAndSave(captureRef, { silent });
    if (savedUri) {
      if (successLabel) {
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 2500);
      }
      if (onSuccess) onSuccess(savedUri);
    } else {
      if (onError) onError('Screenshot capture or save failed.');
    }
  };

  // Determine button styles based on variant
  const getButtonBgStyle = () => {
    if (isDisabled) {
      return isDark ? 'bg-zinc-800 border border-zinc-700' : 'bg-gray-200';
    }
    switch (variant) {
      case 'outline':
        return 'bg-transparent border border-orange-500';
      case 'ghost':
        return 'bg-orange-50/10';
      case 'solid':
      default:
        return 'bg-orange-500';
    }
  };

  const getTextColorStyle = () => {
    if (isDisabled) {
      return isDark ? 'text-zinc-500' : 'text-gray-400';
    }
    switch (variant) {
      case 'outline':
      case 'ghost':
        return 'text-orange-500';
      case 'solid':
      default:
        return 'text-white';
    }
  };

  const hasLabel = !!label && label !== '';
  const buttonClass = `flex-row items-center justify-center ${hasLabel ? 'px-4 py-3 gap-2' : 'p-3'} rounded-xl ${getButtonBgStyle()}`;
  const textClass = `text-sm font-bold ${getTextColorStyle()}`;

  const renderContent = () => (
    <View className={buttonClass} style={variant === 'solid' && !isDisabled ? { backgroundColor: colors.primary } : undefined}>
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'solid' ? 'white' : colors.primary} />
      ) : (
        <Ionicons
          name={isSuccess ? "checkmark-circle-outline" : "camera-outline"}
          size={18}
          color={isDisabled ? (isDark ? '#52525b' : '#9ca3af') : (variant === 'solid' ? 'white' : colors.primary)}
        />
      )}
      {hasLabel && (
        <Text className={textClass}>
          {loading ? loadingLabel : (isSuccess && successLabel ? successLabel : label)}
        </Text>
      )}
    </View>
  );

  if (Platform.OS === 'android') {
    return (
      <View className="overflow-hidden rounded-xl" style={style}>
        <TouchableNativeFeedback
          onPress={handlePress}
          disabled={isDisabled}
          background={TouchableNativeFeedback.Ripple(isDark ? '#FFFFFF1A' : '#0000001A', false)}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ disabled: isDisabled, busy: loading }}
        >
          {renderContent()}
        </TouchableNativeFeedback>
      </View>
    );
  }

  return (
    <TouchableOpacity
      className="rounded-xl"
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={style}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};
