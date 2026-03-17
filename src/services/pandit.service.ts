// pandit.service.ts
import { api, publicApi } from './api-client';

// Public
export const listPandits = (params?: any) => publicApi.get('pandits/', { params });
export const getPanditSummary = (id: number) => publicApi.get(`pandits/${id}/`);
export const getPanditProfile = (id: number) => publicApi.get(`pandits/${id}/profile/`);
export const getPujaCatalog = () => publicApi.get('pandits/services/catalog/');
export const registerPandit = (formData: FormData) => publicApi.post('pandits/register/', formData);

// Pandit self-service
export const getDashboardStats = () => api.get('pandits/dashboard/stats/');
export const fetchPanditDashboardStats = getDashboardStats;
export const togglePanditAvailability = (isAvailable: boolean) => 
    api.post('pandits/dashboard/toggle-availability/', { is_available: isAvailable });
export const toggleAvailability = togglePanditAvailability;

export const getCalendar = () => api.get('pandits/me/calendar/');
export const createCalendarBlock = (data: any) => api.post('pandits/me/calendar/', data);
export const deleteCalendarBlock = (id: number) => api.delete(`pandits/me/calendar/blocks/${id}/`);
export const getWallet = () => api.get('pandits/wallet/');
export const fetchWalletBalance = getWallet;
export const getWithdrawals = () => api.get('pandits/withdrawals/');
export const requestWithdrawal = (data: any) => api.post('pandits/withdrawal/request/', data);

// Pandit profile CRUD
export const updatePanditProfile = (id: number, data: any) => api.put(`pandits/${id}/`, data);
export const patchPanditProfile = (id: number, data: any) => api.patch(`pandits/${id}/`, data);
export const deletePanditProfile = (id: number) => api.delete(`pandits/${id}/`);

// Pandit services
export const listMyServices = () => api.get('pandits/my-services/');
export const fetchPanditMyServices = listMyServices;
export const addService = (data: any) => api.post('pandits/my-services/', data);
export const addPanditService = addService;
export const getService = (id: number) => api.get(`pandits/my-services/${id}/`);
export const updateService = (id: number, data: any) => api.put(`pandits/my-services/${id}/`, data);
export const patchService = (id: number, data: any) => api.patch(`pandits/my-services/${id}/`, data);
export const deleteService = (id: number) => api.delete(`pandits/my-services/${id}/`);

export interface MyService {
    id: number;
    puja: number;
    puja_details: {
        id: number;
        name: string;
    };
    custom_price: number;
    duration_minutes: number;
    is_active: boolean;
}