import apiClient from './api-client';

export interface Notification {
    id: number;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    type: string;
    data?: any;
}

export async function fetchNotifications(): Promise<Notification[]> {
    const response = await apiClient.get('notifications/');
    return response.data;
}

export async function markNotificationAsRead(id: number): Promise<void> {
    await apiClient.patch(`notifications/${id}/`, { is_read: true });
}

export async function markAllNotificationsAsRead(): Promise<void> {
    await apiClient.post('notifications/mark-all-read/');
}
export async function deleteNotification(id: number): Promise<void> {
    await apiClient.delete(`notifications/${id}/`);
}
