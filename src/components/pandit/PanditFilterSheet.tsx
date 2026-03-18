import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import { usePanditStore } from '@/store/pandit.store';

interface PanditFilterSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const PanditFilterSheet: React.FC<PanditFilterSheetProps> = ({ visible, onClose }) => {
  const { filter, setFilter, resetFilter } = usePanditStore();

  const handleApply = () => {
    onClose();
  };

  const handleReset = () => {
    resetFilter();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter Pandits</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Availability */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Availability</Text>
              <View style={styles.chipContainer}>
                {['today', 'week', 'all'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.chip,
                      filter.availability === opt && styles.chipActive,
                    ]}
                    onPress={() => setFilter({ availability: opt as any })}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filter.availability === opt && styles.chipTextActive,
                      ]}
                    >
                      {opt === 'today' ? 'Today' : opt === 'week' ? 'This Week' : 'Anytime'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Location */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.chipContainer}>
                {['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara'].map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    style={[
                      styles.chip,
                      filter.location === loc && styles.chipActive,
                    ]}
                    onPress={() => setFilter({ location: filter.location === loc ? undefined : loc })}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filter.location === loc && styles.chipTextActive,
                      ]}
                    >
                      {loc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Rating */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Minimum Rating</Text>
              <View style={styles.chipContainer}>
                {[4.5, 4.0, 3.5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.chip,
                      filter.minRating === rating && styles.chipActive,
                    ]}
                    onPress={() => setFilter({ minRating: filter.minRating === rating ? undefined : rating })}
                  >
                    <Ionicons name="star" size={14} color={filter.minRating === rating ? '#FFF' : '#FFD700'} />
                    <Text
                      style={[
                        styles.chipText,
                        filter.minRating === rating && styles.chipTextActive,
                      ]}
                    >
                      {rating}+
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Show Results</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '70%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  chipText: {
    fontSize: 14,
    color: '#666',
  },
  chipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
