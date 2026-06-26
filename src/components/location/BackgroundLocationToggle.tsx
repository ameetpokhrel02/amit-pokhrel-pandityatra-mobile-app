import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '@/store/location.store';
import { useAppPermissions } from '@/hooks/useAppPermissions';
import { useTheme } from '@/store/ThemeContext';

interface BackgroundLocationToggleProps {
  onToggle?: (enabled: boolean) => void;
}

export function BackgroundLocationToggle({ onToggle }: BackgroundLocationToggleProps) {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const {
    isBackgroundTrackingEnabled,
    startBackgroundTracking,
    stopBackgroundTracking,
    lastBackgroundUpdate
  } = useLocationStore();

  const { requestPermission, isGranted } = useAppPermissions();
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    if (isToggling) return;

    setIsToggling(true);

    try {
      if (isBackgroundTrackingEnabled) {
        // Stop tracking
        await stopBackgroundTracking();
        Alert.alert(
          'Background Tracking Stopped',
          'PanditYatra will no longer track your location in the background.'
        );
        onToggle?.(false);
      } else {
        // Check and request background location permission
        const hasBackgroundPermission = isGranted('backgroundLocation');

        if (!hasBackgroundPermission) {
          Alert.alert(
            'Enable Background Location',
            'To help us coordinate deliveries and show nearby pandits, PanditYatra needs permission to access your location in the background.\n\nThis is only used for active bookings and services.',
            [
              { text: 'Not Now', style: 'cancel' },
              {
                text: 'Enable',
                onPress: async () => {
                  const status = await requestPermission('backgroundLocation');
                  if (status === 'granted') {
                    const success = await startBackgroundTracking();
                    if (success) {
                      Alert.alert(
                        'Background Tracking Enabled',
                        'PanditYatra will now track your location for better service coordination.'
                      );
                      onToggle?.(true);
                    } else {
                      Alert.alert(
                        'Failed to Start',
                        'Could not start background location tracking. Please try again.'
                      );
                    }
                  } else {
                    Alert.alert(
                      'Permission Required',
                      'Background location permission is needed for this feature. You can enable it in Settings.'
                    );
                  }
                  setIsToggling(false);
                },
              },
            ]
          );
          setIsToggling(false);
          return;
        }

        // Permission already granted, start tracking
        const success = await startBackgroundTracking();
        if (success) {
          Alert.alert(
            'Background Tracking Enabled',
            'PanditYatra will now track your location for better service coordination.'
          );
          onToggle?.(true);
        } else {
          Alert.alert(
            'Failed to Start',
            'Could not start background location tracking. Please check your location settings.'
          );
        }
      }
    } catch (error) {
      console.error('[BackgroundLocationToggle] Error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsToggling(false);
    }
  };

  const formatLastUpdate = () => {
    if (!lastBackgroundUpdate) return 'Never';
    const date = new Date(lastBackgroundUpdate);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons
            name={isBackgroundTrackingEnabled ? "location" : "location-outline"}
            size={24}
            color={colors.primary}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            Background Location
          </Text>
          <Text style={[styles.description, { color: colors.text + '80' }]}>
            {isBackgroundTrackingEnabled
              ? 'Tracking for nearby pandits & deliveries'
              : 'Enable for better service coordination'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.toggle,
          { backgroundColor: isBackgroundTrackingEnabled ? colors.primary : colors.border },
          isToggling && styles.toggleDisabled,
        ]}
        onPress={handleToggle}
        disabled={isToggling}
      >
        <View
          style={[
            styles.toggleKnob,
            { backgroundColor: '#FFF' },
            isBackgroundTrackingEnabled && styles.toggleKnobActive,
          ]}
        >
          {isToggling ? (
            <Ionicons name="refresh" size={16} color={colors.primary} />
          ) : (
            <Ionicons
              name={isBackgroundTrackingEnabled ? "checkmark" : "close"}
              size={16}
              color={isBackgroundTrackingEnabled ? colors.primary : colors.text + '60'}
            />
          )}
        </View>
      </TouchableOpacity>

      {isBackgroundTrackingEnabled && lastBackgroundUpdate && (
        <View style={styles.statusRow}>
          <Ionicons name="time-outline" size={14} color={colors.text + '60'} />
          <Text style={[styles.statusText, { color: colors.text + '60' }]}>
            Last update: {formatLastUpdate()}
          </Text>
        </View>
      )}

      {Platform.OS === 'android' && isBackgroundTrackingEnabled && (
        <View style={[styles.infoBox, { backgroundColor: colors.primary + '10' }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            You'll see a notification while tracking is active
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  toggle: {
    width: 56,
    height: 32,
    borderRadius: 16,
    padding: 2,
    justifyContent: 'center',
    position: 'absolute',
    right: 16,
    top: 16,
  },
  toggleDisabled: {
    opacity: 0.5,
  },
  toggleKnob: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  toggleKnobActive: {
    transform: [{ translateX: 24 }],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
});
