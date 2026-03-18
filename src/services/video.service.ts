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

export const generateVideoJoinLink = joinVideoRoom;

// --- New Backend Endpoints --- //

export async function validateVideoRoom(roomId: string | number) {
    const response = await apiClient.get(`video/${roomId}/validate/`);
    return response.data;
}

export async function createVideoToken(payload: { room_name: string; participant_identity: string; }) {
    const response = await apiClient.post(`video/create-token/`, payload);
    return response.data;
}

export async function generateLinkViaBooking(bookingId: number) {
    const response = await apiClient.post(`video/generate-link/${bookingId}/`);
    return response.data;
}

export async function createVideoRoom(payload: any) {
    const response = await apiClient.post(`video/rooms/create/`, payload);
    return response.data;
}

export async function getVideoRoomDetails(roomId: string | number) {
    const response = await apiClient.get(`video/rooms/${roomId}/`);
    return response.data;
}

export async function updateVideoRoom(roomId: string | number, payload: any) {
    const response = await apiClient.patch(`video/rooms/${roomId}/`, payload);
    return response.data;
}

export async function startVideoRoom(roomId: string | number) {
    const response = await apiClient.post(`video/rooms/${roomId}/start/`);
    return response.data;
}

export async function endVideoRoom(roomId: string | number) {
    const response = await apiClient.post(`video/rooms/${roomId}/end/`);
    return response.data;
}

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
