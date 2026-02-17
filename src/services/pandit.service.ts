import { Pandit, PanditFilter } from '@/types/pandit';
import { fetchPandits, fetchPanditsWithFilters, fetchPandit } from '@/services/api';

export const PanditService = {
  getPandits: async (filter?: PanditFilter): Promise<Pandit[]> => {
    try {
      // If there's a filter, use the filtered endpoint
      if (filter && (filter.searchQuery || filter.location || filter.minRating || filter.availability)) {
        const params: any = {};

        if (filter.searchQuery) {
          params.search = filter.searchQuery;
        }
        if (filter.location) {
          params.location = filter.location;
        }
        if (filter.minRating) {
          params.min_rating = filter.minRating;
        }
        if (filter.availability === 'today') {
          params.is_available = true;
        }

        const data = await fetchPanditsWithFilters(params);
        // Map backend response to frontend Pandit type
        return data.map(mapBackendPanditToFrontend);
      }

      // Otherwise fetch all pandits
      const data = await fetchPandits();
      return data.map(mapBackendPanditToFrontend);
    } catch (error) {
      console.error('Error fetching pandits:', error);
      throw error;
    }
  },

  getPanditById: async (id: string): Promise<Pandit | undefined> => {
    try {
      const data = await fetchPandit(Number(id));
      return mapBackendPanditToFrontend(data);
    } catch (error) {
      console.error('Error fetching pandit:', error);
      return undefined;
    }
  },
};

// Helper function to map backend Pandit type to frontend Pandit type
function mapBackendPanditToFrontend(backendPandit: any): Pandit {
  return {
    id: String(backendPandit.id),
    name: backendPandit.user_details?.full_name || 'Unknown',
    image: backendPandit.user_details?.profile_pic_url || undefined,
    experience: backendPandit.experience_years || 0,
    specialization: backendPandit.expertise ? [backendPandit.expertise] : [],
    languages: backendPandit.language ? backendPandit.language.split(',').map((l: string) => l.trim()) : [],
    rating: backendPandit.rating || 0,
    reviewCount: backendPandit.review_count || 0,
    location: 'Kathmandu', // Backend doesn't have location field, using default
    price: backendPandit.services?.[0]?.custom_price ? Number(backendPandit.services[0].custom_price) : 0,
    isAvailable: backendPandit.is_available || false,
    isTopRated: backendPandit.rating >= 4.5,
    isVerified: backendPandit.is_verified || false,
  };
}

