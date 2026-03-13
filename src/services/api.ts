import apiClient, { publicApi } from './api-client';

// ----------------------
// Services (Pujas) APIs
// ----------------------

export interface Category {
    id: number;
    name: string;
    image: string; // URL string
    description: string;
}

export type ServiceCategory = Category;
export type SamagriCategory = Category;

export interface Service {
    id: number;
    name: string;
    base_price: string; // Decimal string or number depending on serializer
    image: string;
    description?: string; // Detail only
    base_duration?: string; // Detail only, e.g. "02:00:00" or minutes
    samagri_list?: any[]; // Detail only
}

// Services functions moved to booking.service.ts


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

// Pandit and Verification APIs moved to pandit.service.ts

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

export interface Puja {
    id: number;
    name: string;
    description?: string;
    base_price: number;
    base_duration_minutes?: number;
    image?: string;
}

export interface SamagriItem {
    id: number;
    name: string;
    price: number;
    image: string;
    description?: string;
    category?: number | SamagriCategory;
}

// Recommender APIs (Placeholder) moved or removed

export interface RecommendedPandit extends Pandit {
    recommendation_score: number;
}

// Booking APIs moved to booking.service.ts

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
    location?: string;
    notes?: string;
    service?: number;
    service_name?: string;
    payment_status?: string | boolean;
    total_fee?: number;
    is_reviewed?: boolean;
}



// Auth functions moved to auth.service.ts

// Forgot Password functions moved to auth.service.ts

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

// Samagri/Shop logic moved to shop.service.ts

// Extended Pandit APIs moved to pandit.service.ts


// Booking Detail API moved to booking.service.ts


// Payments logic moved to payment.service.ts


// ----------------------
// Shared Interfaces & Helpers
// ----------------------

export interface ChatRoom {
    id: number;
    booking: number;
    last_message?: string;
    updated_at: string;
    [key: string]: any;
}

export interface ChatMessage {
    id: number;
    room: number;
    sender: number;
    content: string;
    created_at: string;
    [key: string]: any;
}

export interface VideoRoom {
    id: number;
    booking: number;
    room_name: string;
    room_url?: string;
    [key: string]: any;
}

export interface VideoLinkResponse {
    room_url: string;
    token?: string;
    [key: string]: any;
}

export interface PanchangData {
    date: string;
    nepali_date?: string;
    tithi?: string;
    nakshatra?: string;
    yoga?: string;
    sunrise?: string;
    sunset?: string;
    auspicious_time?: string;
    [key: string]: any;
}

export interface SamagriCheckoutPayload {
    full_name: string;
    phone_number: string;
    shipping_address: string;
    city: string;
    payment_method: 'STRIPE' | 'KHALTI' | 'ESEWA';
    items: { id: number; quantity: number }[];
}

// Helper to standardize error messages
export function handleApiError(error: any) {
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