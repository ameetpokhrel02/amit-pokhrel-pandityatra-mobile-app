import { publicApi } from './api-client';
import { Category, Service } from './api';

export async function fetchCategories(): Promise<Category[]> {
    const response = await publicApi.get('services/categories/');
    return response.data;
}

export async function fetchServices(params?: { category?: number; search?: string }): Promise<Service[]> {
    const response = await publicApi.get('services/', { params });
    return response.data;
}

export async function fetchServiceDetail(id: number): Promise<Service> {
    const response = await publicApi.get(`services/${id}/`);
    return response.data;
}
