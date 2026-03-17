import apiClient from './api-client';
import { VideoRoom, VideoLinkResponse } from './api';

export async function fetchVideoRoom(bookingId: number): Promise<VideoRoom> {
    const response = await apiClient.get(`video/room/${bookingId}/`);
    return response.data;
}

export async function joinVideoRoom(bookingId: number): Promise<VideoLinkResponse> {
    const response = await apiClient.post(`video/room/${bookingId}/join/`);
    return response.data;
}

export const generateVideoJoinLink = joinVideoRoom;

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
