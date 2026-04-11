import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl, 
  StatusBar,
  ScrollView,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/store/ThemeContext';
import { fetchVideoRecordings } from '@/services/video.service';
import { getImageUrl } from '@/utils/image';
import dayjs from 'dayjs';

export default function MyRecordingsScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { isAuthenticated } = useAuthStore();

  const loadRecordings = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await fetchVideoRecordings();
      setRecordings(data.results || data || []);
    } catch (error) {
      console.error('Error fetching recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    if (!isAuthenticated) return;
    setRefreshing(true);
    await loadRecordings();
    setRefreshing(false);
  };

  useEffect(() => {
    loadRecordings();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: isDark ? '#333' : '#EEE' }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Recordings</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: colors.primary + '10' }]}>
            <Ionicons name="lock-closed-outline" size={60} color={colors.primary + '40'} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>View Your Sessions</Text>
          <Text style={[styles.emptySubtitle, { color: colors.text + '60' }]}>
            Join as a Customer to access your recordings, watch sacred sessions again, and download them.
          </Text>
          
          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(public)/role-selection' as any)}
          >
            <Text style={styles.loginBtnText}>Join as Customer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderRecordingItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.recordingCard, { backgroundColor: colors.card, borderColor: isDark ? '#333' : '#EEE' }]}
      onPress={() => router.push({ 
        pathname: '/(customer)/video-player' as any, 
        params: { 
          videoUrl: item.recording, 
          title: item.booking_details?.service_name || 'Puja Recording' 
        } 
      })}
    >
      <View style={styles.thumbnailContainer}>
        <Image 
          source={{ uri: item.thumbnail || 'https://images.unsplash.com/photo-1544158404-585ff67ece33?q=80&w=400' }} 
          style={styles.thumbnail}
          contentFit="cover"
        />
        <View style={styles.playOverlay}>
          <Ionicons name="play-circle" size={48} color="white" />
        </View>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{item.duration || '00:00'}</Text>
        </View>
      </View>
      
      <View style={styles.recordingInfo}>
        <Text style={[styles.pujaName, { color: colors.text }]} numberOfLines={1}>
          {item.booking_details?.service_name || 'Sacred Puja Session'}
        </Text>
        <Text style={[styles.panditName, { color: colors.text + '80' }]}>
          with {item.booking_details?.pandit_full_name || 'Pandit Ji'}
        </Text>
        <View style={styles.footerRow}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.primary} />
            <Text style={[styles.dateText, { color: colors.text + '60' }]}>
              {dayjs(item.created_at).format('DD MMM, YYYY')}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.downloadBtn, { backgroundColor: colors.primary + '15' }]}
            onPress={() => {/* Handle download logic */}}
          >
            <Ionicons name="download-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <View style={[styles.header, { borderBottomColor: isDark ? '#333' : '#EEE' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Recordings</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loaderText, { color: colors.text + '80' }]}>Retrieving your sacred sessions...</Text>
        </View>
      ) : (
        <FlatList
          data={recordings}
          renderItem={renderRecordingItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.primary + '10' }]}>
                <Ionicons name="videocam-off-outline" size={60} color={colors.primary + '40'} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Recordings Yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.text + '60' }]}>
                Once your pujas are completed and the Pandit uploads the recording, they will appear here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
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
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  recordingCard: {
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  thumbnailContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  recordingInfo: {
    padding: 16,
  },
  pujaName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  panditName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  downloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loaderText: {
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  loginBtn: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  loginBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
