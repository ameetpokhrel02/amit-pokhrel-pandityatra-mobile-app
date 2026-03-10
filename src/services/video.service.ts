import apiClient from './api-client';
import { VideoRoom, VideoLinkResponse } from './api';

export async function fetchVideoRoom(bookingId: number): Promise<VideoRoom> {
    const response = await apiClient.get(`/video/room/${bookingId}/`);
    return response.data;
}

export async function generateVideoJoinLink(bookingId: number): Promise<VideoLinkResponse> {
    const response = await apiClient.post(`/video/generate-link/${bookingId}/`);
    return response.data;
}
