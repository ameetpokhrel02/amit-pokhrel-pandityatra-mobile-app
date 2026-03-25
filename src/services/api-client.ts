import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
// import { useAuthStore } from '@/store/auth.store'; // Removed to break require cycle

// Helper to determine base URL dynamically based on environment
const getBaseUrl = () => {
    console.log('[API] Detecting Base URL...');

    // 1. Priority: Explicit environment variable (from .env file)
    if (process.env.EXPO_PUBLIC_API_URL) {
        let url = process.env.EXPO_PUBLIC_API_URL;
        if (!url.endsWith('/')) {
            url += '/';
        }
        console.log('[API] Using environment variable URL:', url);
        return url;
    }

    const LOCAL_IP = '192.168.1.83'; // Fallback machine's LAN IP
    const PORT = '8000';

    // 2. Dynamic detection: Use local IP address from Expo manifest (Development)
    const expoConfig = Constants.expoConfig;
    if (expoConfig?.hostUri) {
        const host = expoConfig.hostUri.split(':')[0];

        // Fix for tunnel mode: tunnel URL usually doesn't forward the backend port (8000)
        if (host.includes('exp.direct')) {
            console.log('[API] ⚠️ TUNNEL MODE DETECTED. Using fallback LOCAL_IP:', LOCAL_IP);
            return `http://${LOCAL_IP}:${PORT}/api/`;
        }

        // Handle Android Emulator case
        if (host === 'localhost' || host === '127.0.0.1') {
            const url = `http://10.0.2.2:${PORT}/api/`;
            console.log('[API] 📱 Emulator detected, using:', url);
            return url;
        }

        const url = `http://${host}:${PORT}/api/`;
        console.log('[API] 🌐 Using dynamic host URL:', url);
        return url;
    }

    // 3. Last fallback
    const url = `http://${LOCAL_IP}:${PORT}/api/`;
    console.log('[API] 📍 Using last fallback URL:', url);
    return url;
};

export const API_BASE_URL = getBaseUrl();

// Create primary Axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Accept': 'application/json',
    }
});

// Create Public API instance
export const publicApi = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Accept': 'application/json',
    }
});

/**
 * Centralized helper to save authentication tokens
 */
export const saveTokens = async (access: string, refresh: string, userData?: any) => {
    try {
        await SecureStore.setItemAsync('access_token', access);
        await SecureStore.setItemAsync('refresh_token', refresh);

        if (userData) {
            // Success: the store will pick up these tokens on its own synchronization
            // or we can emit an event if needed. For now, we trust the sync.
            // await useAuthStore.getState().login(userData, { access, refresh });
        }

        // Update default header for the current instance session
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`;
    } catch (error) {
        console.error('Error saving tokens:', error);
        throw new Error('Failed to save session securely');
    }
};

// --- LOGGING INTERCEPTORS ---

apiClient.interceptors.request.use(config => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.params ? `Params: ${JSON.stringify(config.params)}` : '', config.data ? `Data: ${JSON.stringify(config.data)}` : '');
    return config;
}, error => Promise.reject(error));

publicApi.interceptors.request.use(config => {
    console.log(`[Public API Request] ${config.method?.toUpperCase()} ${config.url}`, config.params ? `Params: ${JSON.stringify(config.params)}` : '', config.data ? `Data: ${JSON.stringify(config.data)}` : '');
    return config;
}, error => Promise.reject(error));

// --- AUTH & HEADER INTERCEPTORS ---

apiClient.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        const isFormData = config.data instanceof FormData ||
            (config.data && typeof config.data === 'object' && config.data.append);

        if (isFormData) {
            config.headers['Content-Type'] = 'multipart/form-data';
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// --- REFRESH TOKEN LOGIC ---

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
                // useAuthStore.getState().logout();
                await SecureStore.deleteItemAsync('access_token');
                await SecureStore.deleteItemAsync('refresh_token');
                return Promise.reject(error);
            }

            try {
                const response = await axios.post(`${API_BASE_URL}token/refresh/`, {
                    refresh: refreshToken,
                });

                const { access } = response.data;
                await SecureStore.setItemAsync('access_token', access);

                apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`;
                processQueue(null, access);

                return apiClient(originalRequest);
            } catch (err) {
                processQueue(err, null);
                // useAuthStore.getState().logout();
                await SecureStore.deleteItemAsync('access_token');
                await SecureStore.deleteItemAsync('refresh_token');
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        const status = error.response?.status;
        const configUrl = error.config?.url || '';
        if (!(status === 404 && configUrl.includes('pandits/wallet/'))) {
            console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} | Status: ${status} | Details:`, JSON.stringify(error.response?.data || error.message));
        }
        return Promise.reject(error);
    }
);

publicApi.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const details = error.response?.data || error.message;
        console.error(`[Public API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} | Status: ${status} | Details:`, JSON.stringify(details));

        if (status === 400 && typeof details === 'string' && details.includes('Bad Request (400)')) {
            console.warn('[API Insight] This "Bad Request (400)" without a JSON body often indicates a Django ALLOWED_HOSTS mismatch. Check backend settings.py.');
        }

        return Promise.reject(error);
    }
);

export { apiClient as api };
export default apiClient;
