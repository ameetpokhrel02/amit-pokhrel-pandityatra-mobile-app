import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
// import { useAuthStore } from '@/store/auth.store'; // Removed to break require cycle

// Local Django backend (docker compose publishes it on port 8000 of the dev machine)
const LOCAL_BACKEND_PORT = 8000;

// EXPO_PUBLIC_API_URL may be given as the bare origin (http://host:8000) or with a
// legacy /api/ or /api/v1/ suffix. Strip either so we always end up on /api/v1/.
const toOrigin = (url: string) => url.trim().replace(/\/+$/, '').replace(/\/api(\/v1)?$/, '');

// Helper to determine the backend origin dynamically based on environment
const getOrigin = () => {
    // 1. Highest priority: explicit .env variable (inlined by Expo Metro bundler at startup)
    //    Run `npx expo start --clear` if changes to .env are not reflected.
    if (process.env.EXPO_PUBLIC_API_URL) {
        const origin = toOrigin(process.env.EXPO_PUBLIC_API_URL);
        console.log('[API] ✅ Using EXPO_PUBLIC_API_URL:', origin);
        return origin;
    }

    // 2. Dev builds: the backend runs on the same machine as Metro, so reuse Metro's host
    //    (its LAN IP). This keeps working when the Wi-Fi IP changes.
    const host = (Constants as any).expoConfig?.hostUri?.split(':')[0];
    if (__DEV__ && host && !host.includes('exp.direct') && !host.includes('ngrok')) {
        const origin = `http://${host}:${LOCAL_BACKEND_PORT}`;
        console.log('[API] 💻 Using local backend on the Metro host:', origin);
        return origin;
    }

    // 3. Release builds (and tunnels, which can't reach a LAN address) must set
    //    EXPO_PUBLIC_API_URL — eas.json does this per build profile.
    const fallback = `http://localhost:${LOCAL_BACKEND_PORT}`;
    console.error('[API] ❌ EXPO_PUBLIC_API_URL is not set; falling back to', fallback);
    return fallback;
};

/** Backend origin without any path, e.g. https://host — use for /media/ URLs. */
export const API_ORIGIN = getOrigin();
/** Versioned REST base. The unversioned /api/ prefix is deprecated (sunset 2027-01-01). */
export const API_BASE_URL = `${API_ORIGIN}/api/v1/`;
/** WebSockets live at the origin root (/ws/...), not under /api/. */
export const WS_BASE = API_ORIGIN.replace(/^http/, 'ws');
console.log('[API] 🔗 Final Base URL:', API_BASE_URL);

// Create primary Axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Accept': 'application/json',
        // Tells the backend to return the refresh token in the JSON body
        // instead of an httpOnly cookie (native apps have no cookie jar).
        'X-Client-Platform': 'mobile',
    }
});

// Create Public API instance
export const publicApi = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Accept': 'application/json',
        // Tells the backend to return the refresh token in the JSON body
        // instead of an httpOnly cookie (native apps have no cookie jar).
        'X-Client-Platform': 'mobile',
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
    if (__DEV__) {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.params ? `Params: ${JSON.stringify(config.params)}` : '', config.data ? `Data: ${JSON.stringify(config.data)}` : '');
    }
    return config;
}, error => Promise.reject(error));

publicApi.interceptors.request.use(config => {
    if (__DEV__) {
        console.log(`[Public API Request] ${config.method?.toUpperCase()} ${config.url}`, config.params ? `Params: ${JSON.stringify(config.params)}` : '', config.data ? `Data: ${JSON.stringify(config.data)}` : '');
    }
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

/**
 * Safely triggers logout by reaching into the auth store without causing a circular dependency.
 * This ensures the UI state (Zustand) is updated alongside storage cleanup.
 */
const triggerLogout = async () => {
    try {
        // We use a dynamic require to avoid direct import circular dependency
        const { useAuthStore } = require('@/store/auth.store');
        if (useAuthStore?.getState()?.logout) {
            await useAuthStore.getState().logout();
        }
    } catch (e) {
        console.error('[API] Failed to trigger dynamic logout:', e);
        // Fallback to manual storage cleanup if store is unreachable
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        await SecureStore.deleteItemAsync('user');
        await SecureStore.deleteItemAsync('role');
    }
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
                await triggerLogout();
                return Promise.reject(error);
            }

            try {
                const response = await axios.post(`${API_BASE_URL}token/refresh/`, {
                    refresh: refreshToken,
                }, {
                    headers: { 'X-Client-Platform': 'mobile' },
                });

                const { access, refresh } = response.data;
                await SecureStore.setItemAsync('access_token', access);
                // Refresh tokens rotate and the old one is blacklisted, so keep the new one
                if (refresh) {
                    await SecureStore.setItemAsync('refresh_token', refresh);
                }

                apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`;
                processQueue(null, access);

                return apiClient(originalRequest);
            } catch (err) {
                processQueue(err, null);
                await triggerLogout();
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        const status = error.response?.status;
        const configUrl = error.config?.url || '';
        if (!(status === 404 && (configUrl.includes('pandits/wallet/') || configUrl.includes('analytics/track/')))) {
            const details = error.response?.data || error.message;
            const safeDetails = typeof details === 'string'
                ? (details.length > 500 ? details.substring(0, 500) + '... (truncated)' : details)
                : JSON.stringify(details);
            console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} | Status: ${status} | Details:`, safeDetails);
        }
        return Promise.reject(error);
    }
);

publicApi.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const details = error.response?.data || error.message;
        const safeDetails = typeof details === 'string'
            ? (details.length > 500 ? details.substring(0, 500) + '... (truncated)' : details)
            : JSON.stringify(details);

        console.error(`[Public API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} | Status: ${status} | Details:`, safeDetails);

        if (status === 400 && typeof details === 'string' && details.includes('Bad Request (400)')) {
            console.warn('[API Insight] This "Bad Request (400)" without a JSON body often indicates a Django ALLOWED_HOSTS mismatch. Check backend settings.py.');
        }

        return Promise.reject(error);
    }
);

export { apiClient as api };
export default apiClient;

/**
 * Open an authenticated WebSocket. React Native can't send an Authorization header on
 * the upgrade request, so the backend expects a single-use, 30-second ticket instead.
 * A ticket is consumed even when the handshake fails — call this again for every reconnect.
 *
 * @param path e.g. `/ws/chat/12/`
 */
export async function openAuthedSocket(path: string): Promise<WebSocket> {
    const { data } = await apiClient.post('ws-ticket/');
    const url = `${WS_BASE}${path}?ticket=${encodeURIComponent(data.ticket)}`;
    if (__DEV__) console.log('[WS] Connecting to:', `${WS_BASE}${path}`);
    return new WebSocket(url);
}
