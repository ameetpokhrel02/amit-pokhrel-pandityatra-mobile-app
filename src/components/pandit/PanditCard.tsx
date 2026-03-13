import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Pandit } from '@/types/pandit';
import { getImageUrl } from '@/utils/image';

interface PanditCardProps {
  pandit: Pandit;
  index: number;
  onPress: () => void;
  onBook: () => void;
}

export const PanditCard: React.FC<PanditCardProps> = ({ pandit, index, onPress, onBook }) => {
  // Handle both mapped frontend type and raw backend user_details
  const imageUri = getImageUrl(pandit.image || (pandit as any).user_details?.profile_pic_url) || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.card}>
        <View style={styles.topSection}>
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: imageUri }} 
              style={styles.image} 
            />
            {pandit.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#FF6F00" />
              </View>
            )}
          </View>
          
          <View style={styles.infoContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.name} numberOfLines={1}>{pandit.name}</Text>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.ratingText}>{pandit.rating}</Text>
              </View>
            </View>
            
            <Text style={styles.specialization} numberOfLines={1}>
              {pandit.specialization.join(', ') || 'Vedic Astrology, Puja Specialist'}
            </Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={14} color="#9C1C1C" />
                <Text style={styles.statText}>{pandit.experience} Yrs Exp.</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="chatbubble-outline" size={14} color="#9C1C1C" />
                <Text style={styles.statText}>{pandit.reviewCount} Reviews</Text>
              </View>
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#3E2723" />
              <Text style={styles.locationText}>{pandit.location}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Starting from</Text>
            <Text style={styles.priceValue}>NPR {pandit.price}</Text>
          </View>
          
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.chatIconButton}
              onPress={() => {/* Handle chat */}}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FF6F00" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.bookButton, !pandit.isAvailable && styles.bookButtonDisabled]} 
              onPress={onBook}
              disabled={!pandit.isAvailable}
            >
              <Text style={styles.bookButtonText}>
                {pandit.isAvailable ? 'Book Now' : 'Busy'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 111, 0, 0.1)',
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  topSection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F5F5F5',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 1,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#3E2723',
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6F00',
  },
  specialization: {
    fontSize: 13,
    color: '#3E2723' + '80', // Dark brown with opacity
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#3E2723' + '90',
    fontWeight: '500',
  },
  statDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#3E2723' + '60',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 10,
    color: '#3E2723' + '60',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6F00',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chatIconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FF6F00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButton: {
    backgroundColor: '#FF6F00',
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  bookButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
