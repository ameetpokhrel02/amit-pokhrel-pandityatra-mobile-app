import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator,
  Share,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function VideoPlayerScreen() {
  const { videoUrl, title } = useLocalSearchParams<{ videoUrl: string, title: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  
  const player = useVideoPlayer(videoUrl, (playerInstance) => {
    playerInstance.loop = false;
    playerInstance.play();
  });

  const [downloading, setDownloading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  
  // Use player.status safely
  const playerStatus = player.status;

  player.addListener('playingChange', (event) => {
    setIsPlaying(event.isPlaying);
  });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Watch this sacred puja recording from PanditYatra: ${title}`,
        url: videoUrl,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const { status: libStatus } = await MediaLibrary.requestPermissionsAsync();
      if (libStatus !== 'granted') {
        Alert.alert('Permission needed', 'We need storage permission to save the video.');
        return;
      }

      const fileUri = (FileSystem as any).documentDirectory + (title?.replace(/\s+/g, '_') || 'recording') + '.mp4';
      const downloadRes = await FileSystem.downloadAsync(videoUrl, fileUri);
      
      if (downloadRes.status === 200) {
        await MediaLibrary.createAssetAsync(downloadRes.uri);
        Alert.alert('Success', 'Video saved to your gallery!');
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download video.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#000' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title || 'Puja Recording'}</Text>
        <TouchableOpacity onPress={handleShare} style={styles.headerIcon}>
          <Ionicons name="share-social-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.videoContainer}>
        <VideoView
          player={player}
          style={styles.video}
          nativeControls={true}
          contentFit="contain"
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.infoSection}>
          <Text style={styles.footerTitle}>{title}</Text>
          <Text style={styles.footerSubtitle}>Recorded Session • PanditYatra HD</Text>
        </View>

        <TouchableOpacity 
          style={[styles.downloadBtn, { backgroundColor: colors.primary }]}
          onPress={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons name="download" size={20} color="white" />
              <Text style={styles.downloadText}>Save to Gallery</Text>
            </>
          )}
        </TouchableOpacity>
        
        <View style={styles.featuresRow}>
            <FeatureIcon icon="shield-checkmark" label="Private" />
            <FeatureIcon icon="cloud-done" label="Cloud Link" />
            <FeatureIcon icon="infinite" label="Lifetime" />
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureIcon({ icon, label }: { icon: any, label: string }) {
    return (
        <View style={styles.featureItem}>
            <Ionicons name={icon} size={16} color="#666" />
            <Text style={styles.featureLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  headerIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * (9/16),
    maxHeight: '100%',
  },
  footer: {
    padding: 30,
    backgroundColor: '#111',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  infoSection: {
    marginBottom: 24,
  },
  footerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 6,
  },
  footerSubtitle: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 20,
    gap: 10,
  },
  downloadText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureLabel: {
    color: '#666',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});
