import apiClient from './api-client';

export interface Review {
  id: number;
  customer_name: string;
  customer_avatar: string | null;
  pandit_name: string;
  service_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface SiteReview {
  id: number;
  user_name: string;
  user_avatar: string | null;
  role: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface SiteReviewsResponse {
  reviews: SiteReview[];
  average_rating: number;
  total_reviews: number;
  breakdown: Record<string, number>;
}

export interface PanditReviewsResponse {
  reviews: Review[];
  average_rating: number;
  total_reviews: number;
}

/**
 * Fetch reviews given by the current user
 */
export async function fetchMyReviews(): Promise<Review[]> {
  const response = await apiClient.get('reviews/my-reviews/');
  return response.data;
}

/**
 * Submit a review for a completed booking
 */
export async function createReview(payload: { booking: number; rating: number; comment: string }): Promise<Review> {
  const response = await apiClient.post('reviews/create/', payload);
  return response.data;
}

/**
 * Submit or update platform (site) feedback
 */
export async function submitSiteReview(payload: { rating: number; comment: string }): Promise<SiteReview> {
  const response = await apiClient.post('reviews/site-reviews/', payload);
  return response.data;
}

/**
 * Fetch platform (site) feedback
 */
export async function fetchSiteReviews(): Promise<SiteReviewsResponse> {
  const response = await apiClient.get('reviews/site-reviews/');
  return response.data;
}

/**
 * Fetch public reviews for a specific pandit
 */
export async function fetchPanditReviews(panditId: number): Promise<PanditReviewsResponse> {
  const response = await apiClient.get(`reviews/pandit-reviews/`, { params: { pandit_id: panditId } });
  return response.data;
}
