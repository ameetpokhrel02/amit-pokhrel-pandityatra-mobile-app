import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import { Button } from './Button';

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  icon?: string;
  isLoading?: boolean;
}

const { width } = Dimensions.get('window');

export const ConfirmationModal = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  icon,
  isLoading = false,
}: ConfirmationModalProps) => {
  if (!visible) return null;

  const getIconColor = () => {
    switch (type) {
      case 'danger': return '#FF3B30';
      case 'warning': return '#F59E0B';
      default: return '#3B82F6';
    }
  };

  const getConfirmColor = () => {
    switch (type) {
      case 'danger': return '#FF3B30';
      default: return Colors.light.primary;
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Pandit Mascot Header */}
          <View style={styles.headerMascotContainer}>
            <View style={styles.avatarCircle}>
              <Image
                source={require('@/assets/images/pandit-logo.png')}
                style={styles.avatar}
                contentFit="contain"
              />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getIconColor() }]}>
              <Ionicons name={(icon as any) || (type === 'danger' ? 'trash' : 'warning')} size={18} color="#FFF" />
            </View>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            <Button
              title={cancelText}
              onPress={onClose}
              variant="outline"
              style={styles.cancelButton}
              textStyle={{ color: '#666' }}
              disabled={isLoading}
            />
            <Button
              title={confirmText}
              onPress={onConfirm}
              style={[styles.confirmButton, { backgroundColor: getConfirmColor() }]}
              isLoading={isLoading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: width - 40,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerMascotContainer: {
    position: 'relative',
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    borderColor: '#E5E7EB',
  },
  confirmButton: {
    flex: 1,
  },
});
