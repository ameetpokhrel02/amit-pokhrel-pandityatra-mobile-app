import apiClient from './api-client';

/**
 * Analytics service for tracking user behavior and page views.
 * In a real production app, this would also forward events to 
 * Firebase, Segment, or Mixpanel.
 */
export const trackEvent = async (event: string, properties: Record<string, any> = {}) => {
  try {
    const payload = {
      event,
      properties,
      timestamp: new Date().toISOString(),
      platform: 'mobile',
    };

    // Logging for debug
    console.log(`[Analytics] ${event}`, properties);

    // Forward to backend analytics endpoint
    await apiClient.post('analytics/track/', payload).catch((err) => {
        // Silently fail if analytics endpoint is not ready (404)
        if (err.response?.status !== 404) {
            console.warn('[Analytics] Backend tracking failed:', err.message);
        }
    });
  } catch (error) {
    // Analytics should never crash the app
    console.error('[Analytics] Error tracking event:', error);
  }
};

export const trackPageView = (screenName: string, properties: Record<string, any> = {}) => {
  return trackEvent('page_view', { screen_name: screenName, ...properties });
};
