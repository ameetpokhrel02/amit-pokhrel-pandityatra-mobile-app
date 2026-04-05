import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { fetchSiteReviews } from '@/services/review.service';
import { ReviewListLayout, ReviewItem } from '@/components/reviews/ReviewListLayout';

export default function AppFeedbackListScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any>({
        reviews: [],
        averageRating: 0,
        totalReviews: 0,
        breakdown: {}
    });

    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        try {
            const res = await fetchSiteReviews();
            const formattedReviews: ReviewItem[] = (res.reviews || []).map((r: any) => ({
                id: r.id,
                userName: r.user_name,
                userAvatar: r.user_avatar,
                rating: r.rating,
                comment: r.comment,
                createdAt: r.created_at
            }));

            setData({
                reviews: formattedReviews,
                averageRating: res.average_rating || 0,
                totalReviews: res.total_reviews || 0,
                breakdown: res.breakdown || {}
            });
        } catch (error) {
            console.error('Failed to fetch site reviews:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#FB3A5F" />
            </View>
        );
    }

    return (
        <ReviewListLayout
            title="App Feedback"
            averageRating={data.averageRating}
            totalReviews={data.totalReviews}
            breakdown={data.breakdown}
            reviews={data.reviews}
            onBack={() => router.back()}
            onWriteReview={() => router.push('/(customer)/reviews/platform-feedback')}
            isLoading={isLoading}
        />
    );
}
