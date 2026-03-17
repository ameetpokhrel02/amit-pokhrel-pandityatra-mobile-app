import apiClient from './api-client';

export async function generateKundali(payload: {
    dob: string;
    time: string;
    lat: number;
    lon: number;
    timezone: string
}) {
    const response = await apiClient.post('kundali/generate/', payload);
    return response.data;
}

export async function getSavedKundalis() {
    const response = await apiClient.get('kundali/list/');
    return response.data;
}
