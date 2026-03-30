import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';

interface AuthButtonsProps {
  onPhonePress: () => void;
  onEmailPress: () => void;
  onGooglePress: () => void;
}

export const AuthButtons = ({
  onPhonePress,
  onEmailPress,
  onGooglePress,
}: AuthButtonsProps) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Button
        variant="phone"
        title="Continue with Phone"
        onPress={onPhonePress}
        leftIcon={<Ionicons name="call" size={22} color="#FFFFFF" />}
        style={styles.button}
      />

      <Button
        variant="email"
        title="Continue with Email"
        onPress={onEmailPress}
        leftIcon={<Ionicons name="mail-outline" size={22} color={colors.primary} />}
        style={styles.button}
      />

      <View style={styles.dividerContainer}>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
      </View>

      <Button
        variant="google"
        title="Continue with Google"
        onPress={onGooglePress}
        leftIcon={<FontAwesome name="google" size={22} color="#EA4335" />}
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 16,
  },
  button: {
    marginBottom: 0,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
  },
});
