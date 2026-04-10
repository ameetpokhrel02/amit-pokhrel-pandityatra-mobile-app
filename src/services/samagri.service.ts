import apiClient, { publicApi } from './api-client';
import { SamagriItem, SamagriCategory, SamagriCheckoutPayload } from './api';

// --- Public APIs ---

export async function fetchSamagriItems(params?: any): Promise<SamagriItem[]> {
    const response = await publicApi.get('samagri/items/', { params });
    return response.data.results || response.data;
}

export async function fetchSamagriCategories(): Promise<SamagriCategory[]> {
    const response = await publicApi.get('samagri/categories/');
    return response.data.results || response.data;
}

export const getSamagriCategories = fetchSamagriCategories;
export const getCategoryDetail = (id: number) => publicApi.get(`samagri/categories/${id}/`);
export const getSamagriItems = fetchSamagriItems;
export const getItemDetail = (id: number) => publicApi.get(`samagri/items/${id}/`);

// --- Protected APIs (Customer) ---

export async function fetchWishlist(): Promise<SamagriItem[]> {
    const response = await apiClient.get('samagri/wishlist/');
    return response.data.results || response.data;
}

export async function toggleWishlist(itemId: number) {
    const response = await apiClient.post('samagri/wishlist/toggle/', { item_id: itemId });
    return response.data;
}

export async function checkWishlistStatus(itemId: number): Promise<{ is_favorite: boolean }> {
    const response = await apiClient.get(`samagri/wishlist/check/${itemId}/`);
    return response.data;
}

export async function checkoutSamagri(payload: SamagriCheckoutPayload) {
    const response = await apiClient.post('samagri/checkout/initiate/', payload);
    return response.data;
}

export async function aiRecommendSamagri(payload: { service_id?: number; puja_name?: string }) {
    const response = await apiClient.post('samagri/ai_recommend/', payload);
    return response.data;
}

export async function fetchRequirementMappings(serviceId: number): Promise<any[]> {
  const response = await apiClient.get(`samagri/requirements/`, { params: { puja: serviceId } });
  return response.data.results || response.data;
}

export async function fetchOrderInvoice(orderId: number) {
  const response = await apiClient.get(`samagri/checkout/${orderId}/invoice/`, { responseType: 'blob' });
  return response.data;
}

export const getSamagriRequirements = (params?: any) => apiClient.get('samagri/requirements/', { params });
export const getRequirementDetail = (id: number) => apiClient.get(`samagri/requirements/${id}/`);
export const initiateCheckout = checkoutSamagri;
export const myOrders = () => apiClient.get('samagri/checkout/my-orders/');
export const orderDetail = (id: number) => apiClient.get(`samagri/checkout/${id}/detail/`);
export const orderInvoice = fetchOrderInvoice;
export const getWishlist = fetchWishlist;
export const wishlistDetail = (id: number) => apiClient.get(`samagri/wishlist/${id}/`);
export const addWishlist = (data: any) => apiClient.post('samagri/wishlist/add/', data);
export const removeWishlist = (id: number) => apiClient.delete(`samagri/wishlist/remove/${id}/`);
export const checkWishlist = checkWishlistStatus;

// --- Management APIs (Admin/Staff usage) ---

export async function createSamagriItem(data: FormData | any) {
    const response = await apiClient.post('samagri/items/', data);
    return response.data;
}

export async function updateSamagriItem(id: number, data: FormData | any) {
    const response = await apiClient.patch(`samagri/items/${id}/`, data);
    return response.data;
}

export async function deleteSamagriItem(id: number) {
    const response = await apiClient.delete(`samagri/items/${id}/`);
    return response.data;
}

export async function createSamagriCategory(data: any) {
    const response = await apiClient.post('samagri/categories/', data);
    return response.data;
}

export async function deleteSamagriCategory(id: number) {
    const response = await apiClient.delete(`samagri/categories/${id}/`);
    return response.data;
}

// --- Cart APIs ---

export async function addToCart(itemId: number, quantity: number = 1) {
    const response = await apiClient.post('samagri/cart/', { item_id: itemId, quantity });
    return response.data;
}

export async function updateCartItem(cartItemId: number, quantity: number) {
    const response = await apiClient.patch(`samagri/cart/${cartItemId}/`, { quantity });
    return response.data;
}

export async function removeFromCartServer(cartItemId: number) {
    const response = await apiClient.delete(`samagri/cart/${cartItemId}/`);
    return response.data;
}

export async function clearCartServer() {
    const response = await apiClient.delete('samagri/cart/clear/');
    return response.data;
}

export async function fetchCart() {
    const response = await apiClient.get('samagri/cart/');
    return response.data.results || response.data;
}