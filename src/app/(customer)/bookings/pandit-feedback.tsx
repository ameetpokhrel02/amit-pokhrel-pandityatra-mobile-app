import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { fetchPanditReviews } from '@/services/review.service';
import { getBooking } from '@/services/booking.service';
import { ReviewListLayout, ReviewItem } from '@/components/reviews/ReviewListLayout';

export default function PanditFeedbackScreen() {
    const router = useRouter();
    const { panditId, bookingId, peerName } = useLocalSearchParams<{ panditId: string, bookingId: string, peerName: string }>();
    const { colors } = useTheme();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any>({
        reviews: [],
        averageRating: 0,
        totalReviews: 0,
        breakdown: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 }
    });

    useEffect(() => {
        if (panditId || bookingId) {
            loadReviews();
        } else {
            setIsLoading(false);
        }
    }, [panditId, bookingId]);

    const loadReviews = async () => {
        try {
            let pid = panditId;
            if (!pid && bookingId) {
                const booking: any = await getBooking(Number(bookingId));
                pid = String(booking?.data?.pandit || booking?.pandit || booking?.pandit_details?.id);
            }
            if (!pid) throw new Error('No Pandit ID resolvable');

            const res = await fetchPanditReviews(Number(pid));
            const reviewList = res.reviews || [];
            
            const formattedReviews: ReviewItem[] = reviewList.map((r: any) => ({
                id: r.id,
                userName: r.customer_name,
                userAvatar: r.customer_avatar,
                rating: r.rating,
                comment: r.comment,
                createdAt: r.created_at
            }));

            // Calculate Dynamic Breakdown for Pandits (Backend lacks breakdown field here)
            const dynamicBreakdown: any = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
            formattedReviews.forEach(r => {
                const rounded = Math.round(r.rating).toString();
                if (dynamicBreakdown[rounded] !== undefined) {
                    dynamicBreakdown[rounded] += 1;
                }
            });

            setData({
                reviews: formattedReviews,
                averageRating: res.average_rating || 0,
                totalReviews: (res.total_reviews || formattedReviews.length) || 0,
                breakdown: dynamicBreakdown
            });
        } catch (error) {
            console.error('Failed to fetch pandit reviews:', error);
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
            title={`Customer Feedback`}
            averageRating={data.averageRating}
            totalReviews={data.totalReviews}
            breakdown={data.breakdown}
            reviews={data.reviews}
            onBack={() => router.push('/(customer)' as any)}
            onWriteReview={() => router.push(`/(customer)/bookings/review?bookingId=${bookingId}` as any)}
            isLoading={isLoading}
        />
    );
}
