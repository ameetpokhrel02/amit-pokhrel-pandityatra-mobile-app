import apiClient from './api-client';
import { PanchangData } from './api';

export async function fetchPanchang(date: string): Promise<PanchangData> {
    const response = await apiClient.get('panchang/data/', { params: { date } });
    return response.data;
}
