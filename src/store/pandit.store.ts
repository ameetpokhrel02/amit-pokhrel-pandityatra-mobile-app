import { create } from 'zustand';
import { Pandit, PanditFilter } from '@/types/pandit';
import { getImageUrl } from '@/utils/image';
import * as PanditService from '@/services/pandit.service';

interface PanditState {
  pandits: Pandit[];
  isLoading: boolean;
  error: string | null;
  filter: PanditFilter;

  setFilter: (filter: Partial<PanditFilter>) => void;
  fetchPandits: () => Promise<void>;
  resetFilter: () => void;
}

const INITIAL_FILTER: PanditFilter = {
  searchQuery: '',
};

export const usePanditStore = create<PanditState>((set, get) => ({
  pandits: [],
  isLoading: false,
  error: null,
  filter: INITIAL_FILTER,

  setFilter: (newFilter) => {
    set((state) => ({
      filter: { ...state.filter, ...newFilter },
    }));
    get().fetchPandits();
  },

  resetFilter: () => {
    set({ filter: INITIAL_FILTER });
    get().fetchPandits();
  },

  fetchPandits: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filter } = get();
      // Map filter to backend expected params if needed
      const params: any = {
        search: filter.searchQuery,
        expertise: filter.expertise || filter.specialization,
        min_rating: filter.minRating,
      };

      if (filter.availability === 'today') {
        params.is_available = true;
      }

      const response = await PanditService.listPandits(params);
      const rawData = response.data.results || response.data;

      // Map backend types to frontend types
      const mappedData: Pandit[] = rawData.map((p: any) => ({
        id: String(p.id),
        name: p.user_details?.full_name || 'Pandit Ji',
        image: getImageUrl(p.user_details?.profile_pic_url) || 'https://via.placeholder.com/150',
        experience: p.experience_years || 0,
        specialization: p.expertise ? p.expertise.split(',').map((s: string) => s.trim()) : [],
        languages: p.language ? p.language.split(',').map((l: string) => l.trim()) : [],
        rating: Number(p.rating) || 0,
        reviewCount: p.review_count || 0,
        location: 'Kathmandu, Nepal', // Placeholder if not in backend
        price: p.services && p.services.length > 0 ? Number(p.services[0].custom_price) : 500,
        isAvailable: p.is_available,
        isVerified: p.is_verified,
        isTopRated: p.rating >= 4.5,
        bio: p.bio,
      }));

      set({ pandits: mappedData, isLoading: false });
    } catch (err) {
      console.error('Store: Failed to fetch pandits:', err);
      set({ isLoading: false, error: 'Failed to fetch pandits' });
    }
  },
}));
