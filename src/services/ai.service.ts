import apiClient from './api-client';

/**
 * AI Mode: Global Spiritual Chat
 */
export async function sendAiChatMessage(message: string): Promise<any> {
    const response = await apiClient.post('ai/chat/', { message });
    return response.data;
}

/**
 * AI Mode: Puja Samagri Recommendations
 */
export async function getAiPujaSamagri(payload: { service_id?: number; puja_name?: string }) {
    const response = await apiClient.post('ai/puja-samagri/', payload);
    return response.data;
}

/**
 * AI Quick Assistant (legacy or variant)
 */
export async function getAiAssistantResponse(message: string) {
    const response = await apiClient.post('ai/assistant/', { message });
    return response.data;
}

/**
 * AI Insight for a specific service/ritual
 */
export async function getPujaInsight(serviceId: number) {
    const response = await apiClient.get(`ai/insight/${serviceId}/`);
    return response.data;
}
