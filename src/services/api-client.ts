import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { router } from 'expo-router';

// Helper to determine base URL dynamically based on environment
const getBaseUrl = () => {
    console.log('[API] Detecting Base URL...');
    console.log('[API] hostUri:', Constants.expoConfig?.hostUri);
    console.log('[API] EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);

    // 1. Priority: Explicit environment variable (from .env file)
    if (process.env.EXPO_PUBLIC_API_URL) {
        const url = process.env.EXPO_PUBLIC_API_URL;
        console.log('[API] Using environment variable URL:', url);
        return url;
    }

    const LOCAL_IP = '192.168.1.83'; // Fallback machine's LAN IP
    const PORT = '8000';

    // 2. Dynamic detection: Use local IP address from Expo manifest (Development)
    if (Constants.expoConfig?.hostUri) {
        const host = Constants.expoConfig.hostUri.split(':')[0];

        // Fix for tunnel mode: tunnel URL usually doesn't forward the backend port (8000)
        if (host.includes('exp.direct')) {
            console.log('[API] ⚠️ TUNNEL MODE DETECTED. Using fallback LOCAL_IP:', LOCAL_IP);
            console.log('[API] Note: If your phone is not on the same Wi-Fi as your computer, this connection will fail.');
            console.log('[API] Consider using a tunnel for your backend (e.g. ngrok) and updating .env');
            return `http://${LOCAL_IP}:${PORT}/api`;
        }

        // Handle Android Emulator case
        if (host === 'localhost' || host === '127.0.0.1') {
            const url = `http://10.0.2.2:${PORT}/api`;
            console.log('[API] 📱 Emulator detected, using:', url);
            return url;
        }

        const url = `http://${host}:${PORT}/api`;
        console.log('[API] 🌐 Using dynamic host URL:', url);
        return url;
    }

    // 3. Last fallback
    const url = `http://${LOCAL_IP}:${PORT}/api`;
    console.log('[API] 📍 Using last fallback URL:', url);
    return url;
};

export const API_BASE_URL = getBaseUrl();

console.log('Current API Base URL:', API_BASE_URL); // Debug logging

// Create Axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000, // 15 seconds timeout
});

/**
 * Centralized helper to save authentication tokens
 * @param access The access token string
 * @param refresh The refresh token string
 */
export const saveTokens = async (access: string, refresh: string) => {
    try {
        await SecureStore.setItemAsync('access_token', access);
        await SecureStore.setItemAsync('refresh_token', refresh);

        // Update default header for the current instance session
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`;
    } catch (error) {
        console.error('Error saving tokens:', error);
        throw new Error('Failed to save session securely');
    }
};

// ... imports and interceptors ...

// Public API instance (no auth headers, no refresh logic)
export const publicApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000, // 15 seconds timeout
});

// Request Interceptor: Attach Token
apiClient.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Robust FormData detection for React Native
        const isFormData = config.data instanceof FormData ||
            (config.data && typeof config.data === 'object' && config.data.append);

        if (isFormData) {
            // Let the engine/browser set the boundary for multipart/form-data
            config.headers['Content-Type'] = 'multipart/form-data';

            // In some environments (like older Axios/RN), we might need to delete it 
            // to allow the polyfill to set the boundary correctly
            // delete config.headers['Content-Type']; 
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Refresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Check for 401 Unauthorized and ensure we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return apiClient(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = await SecureStore.getItemAsync('refresh_token');

            if (!refreshToken) {
                // No refresh token, force logout
                handleLogout();
                return Promise.reject(error);
            }

            try {
                const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
                    refresh: refreshToken,
                });

                const { access } = response.data;

                await SecureStore.setItemAsync('access_token', access);

                apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`;
                processQueue(null, access);

                return apiClient(originalRequest);
            } catch (err) {
                processQueue(err, null);
                handleLogout();
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

async function handleLogout() {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('role');
    await SecureStore.deleteItemAsync('user');
    router.replace('/auth/login');
}



export { apiClient as api };
export default apiClient;
