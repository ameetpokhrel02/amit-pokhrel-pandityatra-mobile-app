import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

// Define API_BASE_URL (Update this with your actual backend URL)
// For Physical Device: Use your computer's IP address (e.g., http://192.168.1.83:8000/api)
// For Android Emulator: Use http://10.0.2.2:8000/api
// For iOS Simulator: Use http://localhost:8000/api
export const API_BASE_URL = 'http://192.168.1.83:8000/api';

// Create Axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    // headers: {
    //     'Content-Type': 'application/json',
    // },
});

// Request Interceptor: Attach Token
apiClient.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // If data is FormData, let browser set Content-Type
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
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

// Public API instance (no auth headers, no refresh logic)
export const publicApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export { apiClient as api };
export default apiClient;
