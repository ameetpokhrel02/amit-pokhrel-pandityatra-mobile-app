// bookings.service.ts
import { api, publicApi } from './api-client';

export const listBookings = (params?: any) => api.get('bookings/', { params });
export const fetchBookings = listBookings;
export const fetchMyBookings = listBookings;
export const createBooking = (data: any) => api.post('bookings/', data);
export const getBooking = (id: number) => api.get(`bookings/${id}/`);
export const updateBooking = (id: number, data: any) => api.put(`bookings/${id}/`, data);
export const patchBooking = (id: number, data: any) => api.patch(`bookings/${id}/`, data);
export const deleteBooking = (id: number) => api.delete(`bookings/${id}/`);
export const cancelBooking = (id: number) => api.patch(`bookings/${id}/cancel/`, {});
export const updateBookingStatus = (id: number, data: any) => api.patch(`bookings/${id}/update_status/`, data);
export const myBookings = () => api.get('bookings/my_bookings/');
export const availableSlots = (pandit_id: number, date: string, service_id: number) => 
    api.get('bookings/available_slots/', { params: { pandit_id, date, service_id } });
export const getBookingInvoice = (id: number) => api.get(`bookings/${id}/invoice/`);