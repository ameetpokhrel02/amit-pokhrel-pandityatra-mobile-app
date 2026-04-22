import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, Platform, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

// Dynamically import MapView to prevent crash if not available
let MapView: any;
let Marker: any;
try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
} catch (e) {
    console.warn('[MapPicker] react-native-maps not available');
}

interface MapLocationPickerProps {
  value: string;
  onSelect: (location: { address: string; latitude: number; longitude: number }) => void;
  placeholder?: string;
  colors: any;
  isDark: boolean;
  label?: string;
}

const DEFAULT_REGION = {
  latitude: 27.7172,
  longitude: 85.3240,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export default function MapLocationPicker({ value, onSelect, placeholder = 'Select location on map', colors, isDark, label }: MapLocationPickerProps) {
  const [visible, setVisible] = useState(false);
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [markerCoord, setMarkerCoord] = useState({ latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude });
  const [addressText, setAddressText] = useState(value || '');
  const [mapError, setMapError] = useState(false);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (value) setAddressText(value);
  }, [value]);

  const handleOpenMap = async () => {
    setVisible(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const newRegion = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(newRegion);
        setMarkerCoord({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    } catch (e) {
      console.warn('[MapPicker] Location fetch failed', e);
    }
  };

  const handleMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarkerCoord({ latitude, longitude });
  };

  const handleConfirm = async () => {
    let address = addressText;
    
    try {
      const results = await Location.reverseGeocodeAsync(markerCoord);
      if (results && results.length > 0) {
        const r = results[0];
        const parts = [r.name, r.street, r.city, r.region, r.country].filter(Boolean);
        if (parts.length > 0 && !addressText.trim()) {
          address = parts.join(', ');
        }
      }
    } catch (e) {
        // Fallback to coordinates
    }

    if (!address.trim()) {
      address = `${markerCoord.latitude.toFixed(4)}, ${markerCoord.longitude.toFixed(4)}`;
    }

    setAddressText(address);
    onSelect({
      address,
      latitude: markerCoord.latitude,
      longitude: markerCoord.longitude,
    });
    setVisible(false);
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.trigger, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB', borderColor: isDark ? '#374151' : '#E5E7EB' }]}
        onPress={handleOpenMap}
        activeOpacity={0.7}
      >
        <Ionicons name="location-outline" size={20} color={colors.primary} />
        <Text style={[styles.triggerText, { color: addressText ? colors.text : (isDark ? '#9CA3AF' : '#999') }]} numberOfLines={1}>
          {addressText || placeholder}
        </Text>
        <Ionicons name="map-outline" size={18} color={isDark ? '#9CA3AF' : '#999'} />
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setVisible(false)} style={styles.modalClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{label || 'Select Location'}</Text>
            <TouchableOpacity onPress={handleConfirm} style={[styles.confirmBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.confirmBtnText}>Confirm</Text>
            </TouchableOpacity>
          </View>

          {/* Map Section with Error Fallback */}
          <View style={styles.mapContainer}>
            {MapView && !mapError ? (
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    initialRegion={region}
                    region={region}
                    onPress={handleMapPress}
                    showsUserLocation
                    showsMyLocationButton
                    onError={(e: any) => {
                        console.error('[MapPicker] MapView Error:', e);
                        setMapError(true);
                    }}
                >
                    <Marker
                        coordinate={markerCoord}
                        draggable
                        onDragEnd={(e: any) => {
                            const { latitude, longitude } = e.nativeEvent.coordinate;
                            setMarkerCoord({ latitude, longitude });
                        }}
                    />
                </MapView>
            ) : (
                <View style={styles.fallbackContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color={colors.primary} />
                    <Text style={[styles.fallbackTitle, { color: colors.text }]}>Map Unavailable</Text>
                    <Text style={[styles.fallbackText, { color: colors.text + '80' }]}>
                        We encountered an error loading the map. Please enter your birth location manually in the box below.
                    </Text>
                </View>
            )}
          </View>

          {/* Address Input Overlay */}
          <View style={[styles.addressOverlay, { backgroundColor: colors.card }]}>
            <View style={[styles.addressInputWrap, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6', borderColor: isDark ? '#374151' : '#E5E7EB' }]}>
              <Ionicons name="search-outline" size={18} color={isDark ? '#9CA3AF' : '#999'} />
              <TextInput
                style={[styles.addressInput, { color: colors.text }]}
                placeholder="Enter address manually..."
                placeholderTextColor={isDark ? '#9CA3AF' : '#999'}
                value={addressText}
                onChangeText={setAddressText}
                autoFocus={mapError || !MapView}
              />
            </View>
            <Text style={[styles.hintText, { color: colors.text + '60' }]}>
              {mapError ? "Manual entry is required for birth calculations." : "Tap on the map to drop a pin, or drag the marker."}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  triggerText: {
    flex: 1,
    fontSize: 15,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalClose: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  confirmBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  confirmBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16
  },
  fallbackTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  fallbackText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20
  },
  addressOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  addressInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  addressInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
  },
  hintText: {
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
});
