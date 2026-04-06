import React from 'react';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { Image } from 'expo-image';

export default function Index() {
  // Navigation is handled by RootLayout's redirection logic
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FF6F00' }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Image 
          source={require('@/assets/images/pandit-logo.png')}
          style={{ width: 150, height: 150, marginBottom: 30 }}
          contentFit="contain"
        />
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    </View>
  );
}