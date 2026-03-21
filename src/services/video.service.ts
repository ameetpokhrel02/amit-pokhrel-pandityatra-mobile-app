import apiClient from './api-client';
import { VideoRoom, VideoLinkResponse } from './api';

export async function fetchVideoRoom(bookingId: number): Promise<VideoRoom> {
    const response = await apiClient.get(`video/room/${bookingId}/`);
    return response.data;
}

export async function joinVideoRoom(bookingId: number): Promise<VideoLinkResponse> {
    const response = await apiClient.post(`video/room/${bookingId}/join/`, { booking_id: bookingId });
    return response.data;
}

export async function startVideoRoom(bookingId: number) {
    const response = await apiClient.post(`video/room/${bookingId}/start/`);
    return response.data;
}

export async function endVideoRoom(bookingId: number) {
    const response = await apiClient.post(`video/room/${bookingId}/end/`);
    return response.data;
}

// --- Production Video Management --- //

/**
 * Validate if a room is active/ready
 */
export async function validateVideoRoom(roomId: string | number) {
    const response = await apiClient.get(`video/${roomId}/validate/`);
    return response.data;
}

/**
 * Create a new video session token (Daily.co)
 */
export async function createVideoToken(payload: { room_name: string; participant_identity: string; }) {
    const response = await apiClient.post(`video/create-token/`, payload);
    return response.data;
}

/**
 * High-level helper to get a join link for a specific booking
 */
export async function generateVideoLink(bookingId: number) {
    const response = await apiClient.post(`video/room/${bookingId}/join/`);
    return response.data;
}

/**
 * Upload a recording for a booking
 */
export async function uploadBookingRecording(bookingId: number, fileUri: string) {
    const formData = new FormData();
    const filename = fileUri.split('/').pop() || `recording_${bookingId}.mp4`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `video/${match[1]}` : `video/mp4`;

    // @ts-ignore
    formData.append('recording', {
        uri: fileUri,
        name: filename,
        type: type,
    });

    const response = await apiClient.post(`video/room/${bookingId}/upload-recording/`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
}
