import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Pandit } from '@/types/pandit';

interface PanditCardProps {
  pandit: Pandit;
  index: number;
  onPress: () => void;
  onBook: () => void;
}

export const PanditCard: React.FC<PanditCardProps> = ({ pandit, index, onPress, onBook }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.card}>
        {/* Top Section: Image & Basic Info */}
        <View style={styles.topSection}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: pandit.image }} style={styles.image} />
            {pandit.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.light.primary} />
              </View>
            )}
          </View>
          
          <View style={styles.infoContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.name}>{pandit.name}</Text>
              {pandit.isTopRated && (
                <View style={styles.topRatedBadge}>
                  <Ionicons name="star" size={10} color="#FFF" />
                  <Text style={styles.topRatedText}>TOP</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.specialization}>
              {pandit.specialization.slice(0, 2).join(', ')}
              {pandit.specialization.length > 2 && ' +more'}
            </Text>
            
            <View style={styles.statsRow}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.rating}>{pandit.rating}</Text>
                <Text style={styles.reviewCount}>({pandit.reviewCount})</Text>
              </View>
              <View style={styles.dot} />
              <Text style={styles.experience}>{pandit.experience} Yrs Exp.</Text>
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#666" />
              <Text style={styles.location}>{pandit.location}</Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bottom Section: Price & Actions */}
        <View style={styles.bottomSection}>
          <View>
            <Text style={styles.priceLabel}>Starting from</Text>
            <Text style={styles.price}>NPR {pandit.price}</Text>
          </View>

          <View style={styles.actionButtons}>
            <View style={[styles.statusBadge, !pandit.isAvailable && styles.statusBusy]}>
              <View style={[styles.statusDot, !pandit.isAvailable && styles.statusDotBusy]} />
              <Text style={[styles.statusText, !pandit.isAvailable && styles.statusTextBusy]}>
                {pandit.isAvailable ? 'Available' : 'Busy'}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.bookButton, !pandit.isAvailable && styles.bookButtonDisabled]} 
              onPress={onBook}
              disabled={!pandit.isAvailable}
            >
              <Text style={styles.bookButtonText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  topSection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F5F5',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  topRatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  topRatedText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  specialization: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#999',
    marginLeft: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCC',
    marginHorizontal: 8,
  },
  experience: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 12,
    color: '#999',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 12,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#999',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusBusy: {
    backgroundColor: '#FFEBEE',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  statusDotBusy: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  statusTextBusy: {
    color: '#F44336',
  },
  bookButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bookButtonDisabled: {
    backgroundColor: '#CCC',
  },
  bookButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
