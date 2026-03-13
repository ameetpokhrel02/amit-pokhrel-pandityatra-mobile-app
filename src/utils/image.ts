import { API_BASE_URL } from '@/services/api-client';

/**
 * Resolves a potentially relative image path from the backend into a full URL.
 * @param path The image path or URL
 * @returns A full URL string, or null if no path provided
 */
export const getImageUrl = (path?: string | null): string | null => {
  if (!path) return null;
  
  // If it's already a full URL, return it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Remove /api from the end of API_BASE_URL to get the root
  const rootUrl = API_BASE_URL.replace(/\/api\/?$/, '');
  
  // Ensure the path starts with a slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${rootUrl}${cleanPath}`;
};

/**
 * Helper to get an image source object for React Native Image components.
 * @param path The image path or URL
 * @param fallback The fallback URL if path is invalid
 * @returns An object with a uri property
 */
export const getImageSource = (path?: string | null, fallback?: string) => {
  const resolved = getImageUrl(path);
  return { uri: resolved || fallback || 'https://via.placeholder.com/150' };
};
