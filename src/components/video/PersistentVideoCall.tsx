import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  PanResponder,
  Animated as RNAnimated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useVideoCall } from '@/store/VideoCallContext';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { MotiView } from 'moti';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/services/api-client';
import { Asset } from 'expo-asset';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUBBLE_SIZE = 120;
const BUBBLE_HEIGHT = 160;

export const PersistentVideoCall = () => {
  const {
    isCallActive,
    isConnecting,
    isMinimized,
    setIsMinimized,
    activeBookingId,
    isPandit,
    peerName,
    isMicOn,
    isVideoOn,
    toggleMic,
    toggleVideo,
    endCall,
    handleBridgeMessage,
    setWebViewRef,
  } = useVideoCall();

  const { colors } = useTheme();
  const [bridgeUri, setBridgeUri] = useState<string | null>(null);
  
  // DRAG LOGIC
  const pan = useRef(new RNAnimated.ValueXY({ x: SCREEN_WIDTH - BUBBLE_SIZE - 20, y: 100 })).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => isMinimized,
      onPanResponderMove: RNAnimated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
    })
  ).current;

  useEffect(() => {
    if (isCallActive || isConnecting) {
      loadAsset();
    } else {
      setBridgeUri(null);
    }
  }, [isCallActive, isConnecting]);

  const loadAsset = async () => {
    try {
        // Load the local HTML asset
        const asset = Asset.fromModule(require('@/assets/video_bridge.html'));
        await asset.downloadAsync();
        setBridgeUri(asset.localUri || asset.uri);
    } catch (e) {
        console.error('[PersistentVideo] Failed to load bridge asset:', e);
    }
  };

  const onWebViewLoad = async () => {
    const token = await SecureStore.getItemAsync('access_token');
    const wsBase = API_BASE_URL.replace('http', 'ws').replace(/\/api\/?$/, '');
    
    // Inject the initialization script
    const script = `
        if (window.initCall) {
            window.initCall("${activeBookingId}", "${token}", "${wsBase}", ${isPandit});
        }
    `;
    
    // Use the ref passed into the context
    // The webview ref is handled by the context's setWebViewRef
  };

  if (!isCallActive && !isConnecting) return null;

  const containerStyle = isMinimized 
    ? [styles.bubble, { transform: [{ translateX: pan.x }, { translateY: pan.y }] }]
    : styles.fullScreen;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <RNAnimated.View 
        {...(isMinimized ? panResponder.panHandlers : {})}
        style={containerStyle}
      >
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring' }}
          style={styles.content}
        >
          {/* THE ENGINE */}
          {bridgeUri && (
            <WebView
                ref={(ref) => setWebViewRef(ref)}
                source={{ uri: bridgeUri }}
                style={styles.webview}
                onMessage={handleBridgeMessage}
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback={true}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                onLoadEnd={onWebViewLoad}
            />
          )}

          {/* OVERLAY CONTROLS (Maximized) */}
          {!isMinimized && (
            <SafeAreaView style={styles.overlay} pointerEvents="box-none">
              <View style={styles.header}>
                <TouchableOpacity onPress={() => setIsMinimized(true)} style={styles.iconBtn}>
                  <Ionicons name="chevron-down" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.peerName}>{peerName || 'Video Call'}</Text>
                <View style={{ width: 40 }} />
              </View>

              <View style={styles.bottomActions}>
                <TouchableOpacity onPress={toggleMic} style={[styles.actionBtn, !isMicOn && styles.btnOff]}>
                  <Ionicons name={isMicOn ? "mic" : "mic-off"} size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={endCall} 
                  style={[styles.actionBtn, styles.endBtn]}
                >
                  <Ionicons name="call" size={28} color="white" />
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleVideo} style={[styles.actionBtn, !isVideoOn && styles.btnOff]}>
                  <Ionicons name={isVideoOn ? "videocam" : "videocam-off"} size={24} color="white" />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          )}

          {/* BUBBLE OVERLAY (Minimized) */}
          {isMinimized && (
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => setIsMinimized(false)} 
              style={styles.bubbleOverlay}
            >
               <View style={styles.miniLabel}>
                  <Text style={styles.miniText}>{isConnecting ? 'Connecting...' : 'Active'}</Text>
               </View>
            </TouchableOpacity>
          )}

          {/* LOADING INDICATOR */}
          {isConnecting && !isMinimized && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Connecting sacred session...</Text>
            </View>
          )}
        </MotiView>
      </RNAnimated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 10000,
  },
  bubble: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_HEIGHT,
    borderRadius: 20,
    backgroundColor: '#111',
    overflow: 'hidden',
    zIndex: 10001,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  peerName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
    paddingBottom: 20,
  },
  actionBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnOff: {
    backgroundColor: '#EF4444',
  },
  endBtn: {
    backgroundColor: '#EF4444',
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  bubbleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  miniLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingVertical: 2,
    alignItems: 'center',
  },
  miniText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  loadingText: {
    color: 'white',
    marginTop: 20,
    fontSize: 16,
    opacity: 0.8,
  },
});
