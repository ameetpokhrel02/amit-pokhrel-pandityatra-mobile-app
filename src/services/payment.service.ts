import apiClient from './api-client';
import { Payment } from './api'; // Keep common types in api.ts for now or move them later

export interface CreatePaymentPayload {
    booking: number;
    payment_method: 'stripe' | 'khalti';
    amount?: number;
    currency?: string;
    [key: string]: any;
}

export interface PaymentIntentResponse {
    id: number;
    status: string;
    client_secret?: string; // Stripe
    payment_url?: string;   // Khalti or other redirect URL
    pidx?: string;
    [key: string]: any;
}

export async function createPayment(payload: CreatePaymentPayload): Promise<PaymentIntentResponse> {
    const response = await apiClient.post('/payments/create/', payload);
    return response.data;
}

export async function checkPaymentStatus(id: number): Promise<Payment> {
    const response = await apiClient.get(`/payments/check-status/${id}/`);
    return response.data;
}

export async function verifyKhaltiPayment(payload: { token: string; amount: number }) {
    const response = await apiClient.post('/payments/khalti/verify/', payload);
    return response.data;
}
