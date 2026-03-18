import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import { Button } from './Button';
import { useTheme } from '@/store/ThemeContext';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const { width } = Dimensions.get('window');

export const DeleteAccountModal = ({ visible, onClose, onConfirm }: DeleteAccountModalProps) => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[styles.container, { backgroundColor: isDark ? '#1F2937' : 'white' }]}
        >
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/pandit-logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
            <View style={[styles.warningIconBadge, { borderColor: isDark ? '#1F2937' : 'white' }]}>
              <Ionicons name="trash" size={20} color="#FFF" />
            </View>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Delete Account?</Text>
          <Text style={[styles.message, { color: colors.text + '99' }]}>
            Are you sure you want to delete your account? This action is irreversible and all your data will be permanently removed.
          </Text>

          <View style={styles.buttonContainer}>
            <Button
              title="Cancel"
              onPress={onClose}
              variant="outline"
              style={[styles.cancelButton, { borderColor: colors.border }]}
              textStyle={{ color: colors.text + '80' }}
            />
            <Button
              title="Yes, Delete"
              onPress={onConfirm}
              style={styles.confirmButton}
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
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
  },
  warningIconBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#EF4444', // Red for deletion
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
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
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#EF4444',
  },
});
