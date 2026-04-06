import apiClient from './api-client';

export interface RecommendationParams {
    puja_id?: number;
    limit?: number;
    min_confidence?: number;
    days?: number;
}

/**
 * Fetch recommendations for a specific puja
 */
export async function fetchRecommendationsByPuja(params: RecommendationParams) {
    const response = await apiClient.get('recommender/recommendations/by_puja/', { params });
    return response.data;
}

/**
 * Fetch personalized recommendations for the current user
 */
export async function fetchPersonalizedRecommendations(params: RecommendationParams) {
    const response = await apiClient.get('recommender/recommendations/personalized/', { params });
    return response.data;
}

/**
 * Fetch seasonal/trending recommendations
 */
export async function fetchSeasonalRecommendations(params: RecommendationParams) {
    const response = await apiClient.get('recommender/recommendations/seasonal/', { params });
    return response.data;
}

/**
 * Fetch recommendation stats (for admin/analytics)
 */
export async function fetchRecommendationStats(params: RecommendationParams) {
    const response = await apiClient.get('recommender/recommendations/stats/', { params });
    return response.data;
}

/**
 * Get samagri recommendations for a specific booking
 */
export async function fetchBookingSamagri(bookingId: number) {
    const response = await apiClient.get(`recommender/bookings/${bookingId}/samagri/`);
    return response.data;
}

export const fetchBookingSamagriRecommendations = fetchBookingSamagri;

/**
 * Trigger AI recommendations for a booking
 */
export async function triggerBookingRecommendations(bookingId: number) {
    const response = await apiClient.post(`recommender/bookings/${bookingId}/samagri/recommendations/`);
    return response.data;
}

/**
 * Auto-add recommended items to a booking's samagri list
 */
export async function autoAddSamagri(bookingId: number) {
    const response = await apiClient.post(`recommender/bookings/${bookingId}/samagri/auto-add/`);
    return response.data;
}

/**
 * Manually add an item to a booking's samagri list via recommender logic
 */
export async function addSamagriItem(bookingId: number, itemId: number) {
    const response = await apiClient.post(`recommender/bookings/${bookingId}/samagri/add-item/`, { item_id: itemId });
    return response.data;
}

/**
 * Remove an item from a booking's samagri list
 */
export async function removeSamagriItem(bookingId: number, itemId: number) {
    const response = await apiClient.delete(`recommender/bookings/${bookingId}/samagri/${itemId}/`);
    return response.data;
}

/**
 * Get user preference insights
 */
export async function fetchUserInsights() {
    const response = await apiClient.get('recommender/user/preferences/insights/');
    return response.data;
}

/**
 * Fetch user preference (alias)
 */
export const fetchUserPreferences = fetchUserInsights;

/**
 * Update user preference
 */
export async function updateUserPreference(id: number, data: any) {
    const response = await apiClient.patch(`recommender/user/preferences/${id}/`, data);
    return response.data;
}

/**
 * Create user preference
 */
export async function createUserPreference(data: any) {
    const response = await apiClient.post('recommender/user/preferences/', data);
    return response.data;
}

/**
 * Fetch recommendations for a specific puja (alias)
 */
export const fetchPujaSamagriRecommendations = async (pujaId: number) => {
    return await fetchRecommendationsByPuja({ puja_id: pujaId });
};
