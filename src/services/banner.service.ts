import apiClient, { publicApi } from './api-client';

export interface Banner {
    id: number;
    title: string;
    description: string;
    image_url: string;
    mobile_image_url?: string;
    link_url?: string;
    link_text?: string;
    banner_type: string;
    status: string;
    priority_order: number;
    background_color?: string;
    text_color?: string;
    created_at: string;
}

/**
 * Fetch active banners from the backend
 */
export async function fetchBanners(): Promise<Banner[]> {
    try {
        // Using publicApi as banners should be visible to non-logged in users too
        const response = await publicApi.get('banners/');
        // The backend uses a ViewSet with DefaultRouter, so it might be at banners/ or banners/reports/
        // Based on reference urls.py: router.register(r"", BannerViewSet, basename="banner")
        // So the list endpoint is api/banners/
        return response.data;
    } catch (error) {
        console.error('[BannerService] Failed to fetch banners:', error);
        throw error;
    }
}
