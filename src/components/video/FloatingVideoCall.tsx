import React, { useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  PanResponder, 
  Animated, 
  Dimensions, 
  TouchableOpacity 
} from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useVideoCall } from '@/store/VideoCallContext';
import { Ionicons } from '@expo/vector-icons';

// Late require for WebRTC
let WebRTC: any = {};
try {
  WebRTC = require('react-native-webrtc');
} catch (e) {
  WebRTC = { RTCView: ({ children }: any) => <View style={{ flex: 1, backgroundColor: '#333' }}>{children}</View> };
}
const { RTCView } = WebRTC;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PIP_WIDTH = 120;
const PIP_HEIGHT = 180;

export const FloatingVideoCall = () => {
  const { isCallActive, remoteStream, endCall, activeBookingId } = useVideoCall();
  const segments = useSegments();
  const router = useRouter();
  
  // Only show PiP if we are NOT on the video call screen
  const isOnVideoScreen = segments[0] === 'video';
  if (!isCallActive || isOnVideoScreen) return null;

  const pan = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH - PIP_WIDTH - 20, y: SCREEN_HEIGHT - PIP_HEIGHT - 100 })).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.extractOffset();
      },
    })
  ).current;

  const goToCall = () => {
    if (activeBookingId) {
      router.push(`/video/${activeBookingId}`);
    }
  };

  return (
    <Animated.View
      style={[
        styles.pipContainer,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={goToCall} style={styles.videoWrapper}>
        {remoteStream ? (
          <RTCView
            streamURL={(remoteStream as any).toURL()}
            style={styles.video}
            objectFit="cover"
          />
        ) : (
          <View style={styles.placeholder}>
             <Ionicons name="person" size={40} color="#666" />
          </View>
        )}
        
        <TouchableOpacity style={styles.closeBtn} onPress={endCall}>
          <Ionicons name="close-circle" size={24} color="#EF4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pipContainer: {
    position: 'absolute',
    width: PIP_WIDTH,
    height: PIP_HEIGHT,
    borderRadius: 16,
    backgroundColor: '#000',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    overflow: 'hidden',
    zIndex: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  videoWrapper: {
    flex: 1,
  },
  video: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
});
