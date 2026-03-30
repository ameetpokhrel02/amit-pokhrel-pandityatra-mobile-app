import React from 'react';
import { View, Image, StyleSheet, ViewStyle, StyleProp } from 'react-native';

interface BrandLogoProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export const BrandLogo = ({ size = 120, style }: BrandLogoProps) => {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={require('@/assets/images/pandit-logo.png')}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
