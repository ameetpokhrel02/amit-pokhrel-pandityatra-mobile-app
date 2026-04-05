import React, { Suspense } from 'react';
import { View, ActivityIndicator, StyleSheet, DimensionValue } from 'react-native';
import { useTheme } from '@/store/ThemeContext';

interface LazyLoaderProps {
  children: React.ReactNode;
  fallbackMessage?: string;
  height?: DimensionValue;
}

export function LazyLoader({ children, fallbackMessage, height = '100%' }: LazyLoaderProps) {
  const { colors, theme } = useTheme();

  return (
    <Suspense
      fallback={
        <View style={[styles.fallbackContainer, { height, backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      }
    >
      {children}
    </Suspense>
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
