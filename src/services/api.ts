import apiClient from './api-client';

// ----------------------
// Payments APIs
// ----------------------
export interface Payment {
    id: number;
    payment_method: string;
    amount_npr: string;
    amount_usd: string;
    amount: string;
    currency: string;
    transaction_id: string;
    status: string;
    created_at: string;
    booking: number;
    booking_details?: {
        id: number;
        pandit_name: string;
    };
    user_details?: {
        full_name: string;
        email: string;
    };
}

export async function fetchAdminPayments(): Promise<Payment[]> {
    const response = await apiClient.get('/payments/admin/');
    return response.data;
}

export async function refundPayment(id: number) {
    const response = await apiClient.post(`/payments/${id}/refund/`);
    return response.data;
}

// ----------------------
// Pandit APIs
// ----------------------
export interface Pandit {
    id: number;
    user: number;
    // 🚨 Nested user details from serializer
    user_details: {
        id: number;
        full_name: string;
        phone_number: string;
        email: string;
        profile_pic_url?: string;
    };
    expertise: string;
    experience_years: number;
    language: string;
    rating: number; // Decimal in backend, number here
    bio: string;
    is_available: boolean;
    is_verified: boolean;
    verification_status: string;
    certification_file?: string;
    date_joined: string;
    // New Aggregated Fields
    services?: PanditService[];
    reviews?: PanditReview[];
    review_count?: number;
    bookings_count?: number;
}

export interface PanditService {
    id: number;
    pandit: number;
    puja_details: Puja;
    custom_price: string; // Decimal string from backend
    duration_minutes: number;
    is_active: boolean;
    is_online: boolean;
    is_offline: boolean;
}

export interface PanditReview {
    id: number;
    customer_name: string;
    customer_avatar: string | null;
    rating: number;
    comment: string;
    created_at: string;
}

export async function fetchPandits(): Promise<Pandit[]> {
    const response = await apiClient.get('/pandits/');
    return response.data;
}

export async function fetchPandit(id: number): Promise<Pandit> {
    const response = await apiClient.get(`/pandits/${id}/`);
    return response.data;
}

export interface Puja {
    id: number;
    name: string; // Changed from title to name to match common convention, or use title if backend sends title
    description?: string;
    base_price: number;
    base_duration_minutes?: number;
    image?: string;
}

export async function fetchPanditServices(panditId: number): Promise<Puja[]> {
    const response = await apiClient.get(`/pandits/${panditId}/services/`);
    return response.data;
}

// ----------------------
// Pandit Verification APIs (Admin)
// ----------------------
export async function fetchPendingPandits(): Promise<Pandit[]> {
    const response = await apiClient.get('/pandits/admin/pending/');
    return response.data;
}

export async function verifyPandit(id: number, notes?: string) {
    const response = await apiClient.post(`/pandits/admin/verify/${id}/`, { notes });
    return response.data;
}

export async function rejectPandit(id: number, reason?: string) {
    const response = await apiClient.post(`/pandits/admin/reject/${id}/`, { reason });
    return response.data;
}

// ----------------------
// Recommender APIs
// ----------------------
export interface RecommendedPandit extends Pandit {
    recommendation_score: number;
}

export async function fetchRecommendations(): Promise<RecommendedPandit[]> {
    // TODO: Backend endpoint /recommender/pandits/ does not exist yet.
    // The current recommender app only supports Samagri recommendations.
    // Returning empty array for now to prevent 404 errors.
    console.warn('fetchRecommendations: Backend endpoint missing. Returning empty array.');
    return [];
    // const response = await apiClient.get('/recommender/pandits/');
    // return response.data;
}

// ----------------------
// Booking APIs
// ----------------------
// Fetches ALL available pujas (catalog)
export async function fetchAllPujas(): Promise<Puja[]> {
    const response = await apiClient.get('/services/');
    return response.data;
}

export interface Booking {
    id: number;
    user: number; // or object depending on serializer
    user_full_name?: string; // from serializer
    pandit: number; // or object
    pandit_name?: string; // helper for UI
    pandit_full_name?: string; // from serializer
    status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';
    booking_date: string;
    booking_time?: string;
    notes?: string;
    total_fee?: number;
    payment_status?: boolean;
    payment_method?: string;
    service_name?: string;
}

export async function fetchBookings(): Promise<Booking[]> {
    const response = await apiClient.get('/bookings/');
    return response.data;
}

export async function createBooking(payload: Partial<Booking>) {
    const response = await apiClient.post('/bookings/', payload);
    return response.data;
}

export async function updateBookingStatus(id: number, status: string) {
    const response = await apiClient.patch(`/bookings/${id}/update_status/`, { status });
    return response.data;
}

export async function adminCancelBooking(id: number) {
    // Calls the specialized admin view that handles refunds
    const response = await apiClient.post(`/bookings/${id}/admin_cancel/`);
    return response.data;
}

// ----------------------
// Auth APIs
// ----------------------

export interface RegisterPayload {
    full_name: string;
    phone_number: string;
    email?: string;
    password?: string;
    role?: 'user' | 'pandit';
}

export async function registerUser(payload: RegisterPayload) {
    try {
        const response = await apiClient.post('/users/register/', payload);
        return response.data;
    } catch (error: any) {
        throw handleApiError(error);
    }
}

// Updated Payload to support email or phone
export async function requestLoginOtp(payload: { phone_number?: string; email?: string }) {
    try {
        const response = await apiClient.post('/users/request-otp/', payload);
        return response.data;
    } catch (error: any) {
        throw handleApiError(error);
    }
}

export async function verifyOtpAndGetToken(payload: { phone_number?: string; email?: string; otp_code: string }) {
    try {
        const response = await apiClient.post('/users/login-otp/', payload);
        return response.data;
    } catch (error: any) {
        throw handleApiError(error);
    }
}

export async function passwordLogin(payload: { phone_number?: string; email?: string; username?: string; password: string }) {
    try {
        const response = await apiClient.post('/users/login-password/', payload);
        return response.data;
    } catch (error: any) {
        throw handleApiError(error);
    }
}

export async function googleLogin(idToken: string) {
    try {
        const response = await apiClient.post('/users/google-login/', { id_token: idToken });
        return response.data;
    } catch (error: any) {
        throw handleApiError(error);
    }
}

export async function fetchProfile() {
    // Interceptor handles the token, argument removed as it was unused
    const response = await apiClient.get('/users/profile/');
    return response.data;
}

// ----------------------
// Admin APIs
// ----------------------
export interface AdminStats {
    total_users: number;
    total_pandits: number;
    pending_verifications: number;
    system_status: string;
}

export async function fetchAdminStats(): Promise<AdminStats> {
    const response = await apiClient.get('/users/admin/stats/');
    return response.data;
}

// ----------------------
// Profile APIs
// ----------------------
export async function updateUserProfile(data: any) {
    const response = await apiClient.patch('/users/profile/', data);
    return response.data;
}

export async function updatePanditProfile(id: number, data: any) {
    const response = await apiClient.patch(`/pandits/${id}/`, data);
    return response.data;
}

// ----------------------
// Contact API
// ----------------------
export async function submitContactForm(payload: { name: string; email: string; subject?: string; message: string }) {
    const response = await apiClient.post('/users/contact/', payload);
    return response.data;
}

// ----------------------
// Kundali APIs
// ----------------------
export async function generateKundali(payload: {
    dob: string;
    time: string;
    latitude: number;
    longitude: number;
    timezone: string
}) {
    const response = await apiClient.post('/kundali/generate/', payload);
    return response.data;
}

export async function getSavedKundalis() {
    const response = await apiClient.get('/kundali/list/');
    return response.data;
}

// ----------------------
// Samagri/Shop APIs
// ----------------------
export interface SamagriItem {
    id: number;
    name: string;
    description: string;
    price: number;
    category?: number; // category ID
    stock_quantity: number;
    image?: string;
    is_available: boolean;
    unit?: string;
}

export interface SamagriCategory {
    id: number;
    name: string;
    description?: string;
}

export async function fetchSamagriItems(params?: any): Promise<SamagriItem[]> {
    const response = await apiClient.get('/samagri/items/', { params });
    // Handle pagination result if it exists (Django Rest Framework default)
    return response.data.results || response.data;
}

export async function fetchSamagriCategories(): Promise<SamagriCategory[]> {
    const response = await apiClient.get('/samagri/categories/');
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

// Helper to standardize error messages
function handleApiError(error: any) {
    if (error.response) {
        const data = error.response.data;
        if (data.detail) return new Error(data.detail);
        if (data.message) return new Error(data.message);
        // Flatten object errors
        if (typeof data === 'object') {
            const fieldErrors = Object.entries(data)
                .map(([field, errors]: [string, any]) => {
                    const errorList = Array.isArray(errors) ? errors : [errors];
                    return `${field}: ${errorList.join(', ')}`;
                })
                .join('; ');
            return new Error(fieldErrors);
        }
    }
    return error;
}