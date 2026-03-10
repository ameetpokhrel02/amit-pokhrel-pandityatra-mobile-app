import apiClient, { publicApi } from './api-client';
import { Pandit, PanditReview, PanditService, Puja } from './api';

export interface PanditRegisterPayload {
  user_id?: number;
  bio?: string;
  experience_years?: number;
  expertise?: string;
  language?: string;
  [key: string]: any;
}

export interface MyService {
  id: number;
  puja_details: Puja;
  custom_price: string;
  duration_minutes: number;
  is_active: boolean;
}

export async function fetchPandits(): Promise<Pandit[]> {
  const response = await publicApi.get('/pandits/');
  return response.data;
}

export async function fetchPandit(id: number): Promise<Pandit> {
  const response = await publicApi.get(`/pandits/${id}/`);
  return response.data;
}

export async function fetchPanditServices(panditId: number): Promise<Puja[]> {
  const response = await publicApi.get(`/pandits/${panditId}/services/`);
  return response.data;
}

export async function registerPandit(payload: PanditRegisterPayload) {
  const response = await apiClient.put('/users/profile/', payload);
  return response.data;
}

export async function fetchPanditsWithFilters(params?: any): Promise<Pandit[]> {
  const response = await apiClient.get('/pandits/', { params });
  return response.data;
}

export async function fetchPanditMyServices(): Promise<MyService[]> {
  const response = await apiClient.get('/pandits/my-services/');
  return response.data;
}

export async function addPanditService(payload: { puja_id: number; custom_price: number; duration_minutes: number }) {
  const response = await apiClient.post('/pandits/my-services/', payload);
  return response.data;
}

export async function togglePanditAvailability(is_available: boolean) {
  const response = await apiClient.post('/pandits/dashboard/toggle-availability/', { is_available });
  return response.data;
}

export async function updatePanditProfile(id: number, data: any) {
  const response = await apiClient.put(`/users/profile/`, data);
  return response.data;
}

export async function fetchPanditDashboardStats() {
  const response = await apiClient.get('/pandits/dashboard/stats/');
  return response.data;
}

export async function fetchPanditCalendar() {
  const response = await apiClient.get('/pandits/me/calendar/');
  return response.data;
}

export async function addAvailabilityBlock(payload: { start_time: string; end_time: string; title: string }) {
  const response = await apiClient.post('/pandits/me/calendar/', payload);
  return response.data;
}

export async function deleteAvailabilityBlock(blockId: number) {
  const response = await apiClient.delete(`/pandits/me/calendar/blocks/${blockId}/`);
  return response.data;
}

export async function fetchPujaCatalog(): Promise<Puja[]> {
  const response = await publicApi.get('/pandits/services/catalog/');
  return response.data;
}
