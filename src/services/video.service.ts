import apiClient from './api-client';

/**
 * Create (or fetch, if it already exists) the video room for a booking.
 * The booking must be ONLINE, paid and ACCEPTED/COMPLETED.
 */
export async function createVideoRoom(bookingId: number): Promise<{ room_id: string; room_url?: string; start_time?: string }> {
    const response = await apiClient.post('video/rooms/create/', { booking_id: bookingId });
    return response.data;
}

export async function startVideoRoom(roomId: number | string) {
    const response = await apiClient.post(`video/rooms/${roomId}/start/`);
    return response.data;
}

export async function endVideoRoom(roomId: number | string) {
    const response = await apiClient.post(`video/rooms/${roomId}/end/`);
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
 * Upload a recording for a booking/room
 */
export async function uploadBookingRecording(roomId: number | string, fileUri: string) {
    const formData = new FormData();
    const filename = fileUri.split('/').pop() || `recording_${roomId}.mp4`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `video/${match[1]}` : `video/mp4`;

    // @ts-ignore
    formData.append('recording', {
        uri: fileUri,
        name: filename,
        type: type,
    });

    const response = await apiClient.post(`video/rooms/${roomId}/upload-recording/`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
}
/**
 * Fetch the user's recorded puja sessions (Customer or Pandit).
 * Built from the call history; only ended calls with an uploaded recording are returned,
 * mapped to the shape the recordings screen uses.
 */
export async function fetchVideoRecordings() {
    const response = await apiClient.get('video/history/');
    const calls: any[] = Array.isArray(response.data) ? response.data : response.data.results ?? [];
    return calls
        .filter((call) => call.recording_url)
        .map((call) => ({
            ...call,
            recording: call.recording_url,
            duration: call.duration_seconds
                ? `${String(Math.floor(call.duration_seconds / 60)).padStart(2, '0')}:${String(call.duration_seconds % 60).padStart(2, '0')}`
                : undefined,
            booking_details: { service_name: call.puja_name, pandit_full_name: call.partner_name },
        }));
}
