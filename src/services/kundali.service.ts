import apiClient from './api-client';

// Accept both the backend snake_case payload AND the test/UI camelCase payload
export async function generateKundali(payload: Record<string, any>) {
    // Normalise camelCase → snake_case so test fixtures work out of the box
    const normalised = {
        name: payload.name,
        dob: payload.dob || payload.dateOfBirth,
        time: payload.time || payload.timeOfBirth,
        latitude: payload.latitude,
        longitude: payload.longitude,
        timezone: payload.timezone || 'Asia/Kathmandu',
        place_of_birth: payload.placeOfBirth || payload.place_of_birth,
    };
    const response = await apiClient.post('kundali/generate/', normalised);
    return response.data;
}

export async function getSavedKundalis() {
    const response = await apiClient.get('kundali/');
    return response.data.results ?? response.data;
}

/** Alias used by tests */
export const getKundaliHistory = getSavedKundalis;

export async function exportKundaliPDF(kundaliId: number): Promise<{ pdf_url: string }> {
    const response = await apiClient.post(`kundali/${kundaliId}/export-pdf/`);
    return response.data;
}

