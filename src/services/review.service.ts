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
