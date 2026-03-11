import apiClient from './api-client';
import { VideoRoom, VideoLinkResponse } from './api';

export async function fetchVideoRoom(bookingId: number): Promise<VideoRoom> {
    const response = await apiClient.get(`/video/room/${bookingId}/`);
    return response.data;
}

export async function joinVideoRoom(bookingId: number): Promise<VideoLinkResponse> {
    const response = await apiClient.post(`/video/room/${bookingId}/join/`);
    return response.data;
}

export const generateVideoJoinLink = joinVideoRoom;
