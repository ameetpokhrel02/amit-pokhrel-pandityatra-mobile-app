import apiClient, { publicApi } from './api-client';
import { Booking, PanditService, PanditReview, Puja, Service, Category } from './api';

export type ServiceCategory = Category;


export interface BookingPayload {
    service?: number; // PanditService ID
    pandit?: number;
    booking_date?: string;
    booking_time?: string;
    location?: string;
    notes?: string;
    special_instructions?: string;
    [key: string]: any;
}

export interface CalendarEvent {
    id: number;
    title: string;
    start: string;
    end: string;
    booking_id?: number;
    status: string;
}

export async function createBooking(payload: BookingPayload): Promise<Booking> {
    const response = await apiClient.post('/bookings/', payload);
    return response.data;
}

export async function fetchMyBookings(params?: { status?: string }): Promise<Booking[]> {
    const response = await apiClient.get('/bookings/', { params });
    return response.data;
}

export async function fetchBookingDetail(id: number): Promise<Booking> {
    const response = await apiClient.get(`/bookings/${id}/`);
    return response.data;
}

export async function fetchPanditCalendar(): Promise<CalendarEvent[]> {
    const response = await apiClient.get('/pandits/me/calendar/');
    return response.data;
}

export async function fetchBookings(): Promise<Booking[]> {
    const response = await apiClient.get('/bookings/');
    return response.data;
}

export async function updateBookingStatus(id: number, status: string) {
    const response = await apiClient.patch(`/bookings/${id}/update_status/`, { status });
    return response.data;
}

export async function cancelBooking(id: number, reason?: string) {
    const response = await apiClient.post(`/bookings/${id}/cancel/`, { reason });
    return response.data;
}



// Services functions moved to puja.service.ts

