import apiClient from './api-client';
import { Payment } from './api'; // Keep common types in api.ts for now or move them later

export interface CreatePaymentPayload {
    booking: number;
    payment_method: 'stripe' | 'khalti' | 'esewa';
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

export async function initiatePayment(payload: CreatePaymentPayload): Promise<PaymentIntentResponse> {
    try {
        const response = await apiClient.post('payments/initiate/', payload);
        return response.data;
    } catch (e: any) {
        if (e.response && e.response.status === 404) {
            console.warn('[Payments] /initiate/ not found, falling back to /create/ endpoint.');
            const fallbackResponse = await apiClient.post('payments/create/', payload);
            return fallbackResponse.data;
        }
        throw e;
    }
}

export async function checkPaymentStatus(id: number): Promise<Payment> {
    const response = await apiClient.get(`payments/check-status/${id}/`);
    return response.data;
}

export async function verifyKhaltiPayment(payload: { pidx: string; amount: number }) {
    const response = await apiClient.get('payments/khalti/verify/', { params: payload });
    return response.data;
}

export async function verifyEsewaPayment(payload: { data: string; order_id?: string }) {
    const response = await apiClient.get('payments/esewa/verify/', { params: payload });
    return response.data;
}

export async function getExchangeRate(): Promise<{rate: number; base: string; target: string}> {
    const response = await apiClient.get('payments/exchange-rate/');
    return response.data;
}
