import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { getImageUrl } from '@/utils/image';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export interface ReviewItem {
  id: number;
  userName: string;
  userAvatar: string | null;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewBreakdown {
  [key: string]: number;
}

export interface ReviewLayoutProps {
  title: string;
  averageRating: number;
  totalReviews: number;
  breakdown: ReviewBreakdown; // keys: '5', '4', '3', '2', '1'
  reviews: ReviewItem[];
  onBack: () => void;
  onWriteReview: () => void;
  isLoading: boolean;
}

export function ReviewListLayout({
  title,
  averageRating,
  totalReviews,
  breakdown,
  reviews,
  onBack,
  onWriteReview,
  isLoading
}: ReviewLayoutProps) {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();

  const PRIMARY_PINK = '#FB3A5F';

  // Calculate percentages for progress bars
  const calculateWidth = (count: number) => {
    if (totalReviews === 0) return '0%';
    return `${(count / totalReviews) * 100}%`;
  };

  const getBreakdownVal = (key: string) => breakdown[key] || 0;

  const barData = [
    { label: 'Excellent', val: getBreakdownVal('5') + getBreakdownVal('4') }, 
  ];
  
  // Mapping standard 5 rating to the 4 categories from the image
  const excellentCount = getBreakdownVal('5');
  const goodCount = getBreakdownVal('4');
  const averageCount = getBreakdownVal('3');
  const poorCount = getBreakdownVal('2') + getBreakdownVal('1');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtn, { borderColor: isDark ? '#333' : '#E5E7EB' }]}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryContainer}>
          <Text style={[styles.overallText, { color: colors.text }]}>Overall Rating</Text>
          <Text style={[styles.ratingNumber, { color: colors.text }]}>
            {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
          </Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <Ionicons 
                key={star} 
                name={star <= Math.round(averageRating) ? "star" : "star-outline"} 
                size={22} 
                color={star <= Math.round(averageRating) ? "#FBBF24" : "#D1D5DB"} 
              />
            ))}
          </View>
          <Text style={[styles.basedOnText, { color: isDark ? '#888' : '#6B7280' }]}>
            Based on {totalReviews} reviews
          </Text>
        </View>

        <View style={styles.barsContainer}>
          <ProgressBarRow label="Excellent" count={excellentCount} total={totalReviews} color={colors.primary} isDark={isDark} />
          <ProgressBarRow label="Good" count={goodCount} total={totalReviews} color={colors.primary} isDark={isDark} />
          <ProgressBarRow label="Average" count={averageCount} total={totalReviews} color={colors.primary} isDark={isDark} />
          <ProgressBarRow label="Poor" count={poorCount} total={totalReviews} color={colors.primary} isDark={isDark} />
        </View>

        <View style={styles.reviewsList}>
          {reviews.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ color: isDark ? '#666' : '#9ca3af' }}>No reviews found.</Text>
            </View>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={[styles.reviewItem, { borderBottomColor: isDark ? '#2A2A2E' : '#F3F4F6' }]}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerInfo}>
                    <View style={styles.avatarWrap}>
                      {review.userAvatar ? (
                        <Image source={{ uri: getImageUrl(review.userAvatar) || undefined }} style={styles.avatar} contentFit="cover" />
                      ) : (
                        <Text style={styles.avatarInitial}>{review.userName?.[0]?.toUpperCase() || 'U'}</Text>
                      )}
                    </View>
                    <View>
                      <Text style={[styles.reviewerName, { color: colors.text }]}>{review.userName || 'Anonymous'}</Text>
                      <View style={styles.reviewStarsRow}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Ionicons 
                            key={star} 
                            name={star <= Math.round(review.rating) ? "star" : "star-outline"} 
                            size={12} 
                            color={star <= Math.round(review.rating) ? "#FBBF24" : "#D1D5DB"} 
                          />
                        ))}
                        <Text style={[styles.reviewRatingNumber, { color: isDark ? '#AAA' : '#6B7280' }]}>
                          ({review.rating.toFixed(1)})
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.timeAgo, { color: isDark ? '#888' : '#9CA3AF' }]}>
                    {dayjs(review.createdAt).fromNow()}
                  </Text>
                </View>
                <Text style={[styles.reviewComment, { color: isDark ? '#CCC' : '#4B5563' }]}>
                  {review.comment}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity 
          style={[styles.writeBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
          onPress={onWriteReview}
        >
          <Ionicons name="create-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.writeBtnText}>Write a review</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ProgressBarRow({ label, count, total, color, isDark }: any) {
  const widthPercentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={styles.barRow}>
      <Text style={[styles.barLabel, { color: isDark ? '#E5E7EB' : '#374151' }]}>{label}</Text>
      <View style={[styles.barTrack, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
        <View style={[styles.barFill, { width: `${widthPercentage}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  summaryContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  overallText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  ratingNumber: {
    fontSize: 64,
    fontWeight: '800',
    lineHeight: 72,
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  basedOnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  barsContainer: {
    paddingHorizontal: 32,
    marginBottom: 32,
    gap: 16,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barLabel: {
    width: 70,
    fontSize: 14,
    fontWeight: '500',
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  reviewsList: {
    paddingHorizontal: 24,
  },
  reviewItem: {
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3B82F6',
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  reviewStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewRatingNumber: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  timeAgo: {
    fontSize: 12,
    fontWeight: '500',
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 22,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  writeBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  writeBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
