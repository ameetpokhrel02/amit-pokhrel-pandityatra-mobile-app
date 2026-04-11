import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useTheme } from '@/store/ThemeContext';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { AuthButtons } from './AuthButtons';
import { useSegments, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface AuthCardProps {
  role: 'customer' | 'pandit' | 'vendor';
  mode: 'login' | 'register';
  onToggleMode?: () => void;
  onChangeRole?: () => void;
  children?: React.ReactNode;
  titleOverride?: string;
  hideFooter?: boolean;
}

export const AuthCard = ({
  role,
  mode,
  onToggleMode,
  onChangeRole,
  children,
  titleOverride,
  hideFooter,
}: AuthCardProps) => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const getTitle = () => {
    const roleName = role === 'customer' ? 'Devotee' : role.charAt(0).toUpperCase() + role.slice(1);
    const welcome = mode === 'login' ? 'Welcome back' : 'Join us';
    return `${welcome}${role === 'pandit' ? ', Pandit Ji' : `, ${roleName}`}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <BrandLogo size={100} />
      
      <Text style={[styles.title, { color: colors.text }]}>{titleOverride || getTitle()}</Text>
      
      {children}
      
      {!hideFooter && (
        <View style={styles.footer}>
          {onToggleMode && (
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <Text 
                style={[styles.link, { color: colors.primary }]} 
                onPress={onToggleMode}
              >
                {mode === 'login' ? `Register as ${role === 'customer' ? 'Devotee' : role.charAt(0).toUpperCase() + role.slice(1)}` : 'Login'}
              </Text>
            </Text>
          )}
          
          {onChangeRole && (
            <TouchableOpacity onPress={onChangeRole} style={styles.changeRoleBtn}>
              <Text style={[styles.changeRoleText, { color: colors.textSecondary }]}>
                ← Change Role
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    alignSelf: 'center',
    marginVertical: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 32,
    marginTop: -8,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    gap: 16,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  link: {
    fontWeight: '700',
  },
  changeRoleBtn: {
    padding: 8,
  },
  changeRoleText: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
  },
});
