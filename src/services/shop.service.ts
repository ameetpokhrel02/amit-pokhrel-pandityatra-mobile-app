import apiClient, { publicApi } from './api-client';
import { SamagriItem, SamagriCategory, SamagriCheckoutPayload } from './api';

export async function fetchSamagriItems(params?: any): Promise<SamagriItem[]> {
    const response = await publicApi.get('/samagri/items/', { params });
    return response.data.results || response.data;
}

export async function fetchSamagriCategories(): Promise<SamagriCategory[]> {
    const response = await publicApi.get('/samagri/categories/');
    return response.data.results || response.data;
}

export async function createSamagriItem(data: FormData | any) {
    const response = await apiClient.post('/samagri/items/', data);
    return response.data;
}

export async function updateSamagriItem(id: number, data: FormData | any) {
    const response = await apiClient.patch(`/samagri/items/${id}/`, data);
    return response.data;
}

export async function deleteSamagriItem(id: number) {
    const response = await apiClient.delete(`/samagri/items/${id}/`);
    return response.data;
}

export async function createSamagriCategory(data: any) {
    const response = await apiClient.post('/samagri/categories/', data);
    return response.data;
}

export async function deleteSamagriCategory(id: number) {
    const response = await apiClient.delete(`/samagri/categories/${id}/`);
    return response.data;
}

export async function checkoutSamagri(payload: SamagriCheckoutPayload) {
    const response = await apiClient.post('/samagri/checkout/initiate/', payload);
    return response.data;
}

export async function aiRecommendSamagri(payload: { service_id?: number; puja_name?: string }) {
    const response = await apiClient.post('/samagri/ai_recommend/', payload);
    return response.data;
}

export async function fetchWishlist(): Promise<SamagriItem[]> {
    const response = await apiClient.get('/samagri/wishlist/');
    return response.data.results || response.data;
}

export async function toggleWishlist(itemId: number) {
    const response = await apiClient.post('/samagri/wishlist/toggle/', { item_id: itemId });
    return response.data;
}

export async function checkWishlistStatus(itemId: number): Promise<{ is_favorite: boolean }> {
    const response = await apiClient.get(`/samagri/wishlist/check/${itemId}/`);
    return response.data;
}
