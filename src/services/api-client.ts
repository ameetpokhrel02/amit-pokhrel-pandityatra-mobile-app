import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { router } from 'expo-router';

// Helper to determine base URL dynamically based on environment
const getBaseUrl = () => {
    // Option 1: Use local IP address from Expo manifest (Development)
    // This works if your phone is on the same Wi-Fi as your computer
    if (Constants.expoConfig?.hostUri) {
        const host = Constants.expoConfig.hostUri.split(':')[0];

        // Fix for tunnel mode: tunnel URL usually doesn't forward the backend port (8000)
        // If using tunnel, fall back to the LAN IP (assuming device is on same network)
        if (host.includes('exp.direct')) {
            return 'http://192.168.1.172:8000/api';
        }

        // Use a flag for Emulator (optional)
        // If testing on Emulator use 10.0.2.2 to access host localhost
        // But expoConfig.hostUri usually returns the LAN IP

        return `http://${host}:8000/api`;
    }

    // Option 2: Fallback for Android Emulator (if hostUri is missing)
    // return 'http://10.0.2.2:8000/api';

    // Option 3: Hardcoded IP as fallback
    // Replace with your current local IP (e.g., from 'ipconfig' or 'ifconfig')
    return 'http://192.168.1.172:8000/api';
};

export const API_BASE_URL = getBaseUrl();

console.log('API Base URL:', API_BASE_URL); // Debug logging

// Create Axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000, // 15 seconds timeout
});

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
