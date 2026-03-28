import React from 'react';
import { View, StyleSheet, TouchableOpacity, StyleSheetProperties, ViewStyle, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Design system constants for the container
const BRAND = {
  background: '#fff7ed',
  primary: '#f97316',
  surface: '#ffffff',
  border: '#e5e5e5'
};

interface AppContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  hideFab?: boolean; // Option to hide the AI button on certain screens if necessary
}

export const AppContainer = ({ children, style, hideFab = false }: AppContainerProps) => {
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safeArea]}>
      <View style={[styles.container, style]}>
        {children}
        
        {!hideFab && (
          <TouchableOpacity 
            style={styles.fab}
            activeOpacity={0.8}
            onPress={() => router.push('/(customer)/ai-assistant')}
          >
            <Ionicons name="sparkles" size={24} color={BRAND.surface} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND.background,
  },
  container: {
    flex: 1,
    backgroundColor: BRAND.background,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BRAND.primary,
    justifyContent: 'center',
    alignItems: 'center',
    // Elevation for Android
    elevation: 6,
    // Shadow for iOS
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 999, // Ensure it floats above all other scrollable UI
  }
});
