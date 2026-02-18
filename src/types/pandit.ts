export interface Pandit {
  id: string;
  name: string;
  image: string;
  experience: number; // years
  specialization: string[];
  languages: string[];
  rating: number;
  reviewCount: number;
  location: string;
  price: number;
  isAvailable: boolean;
  isTopRated?: boolean;
  isVerified?: boolean;
  bio?: string;
  services?: PanditServiceItem[];
}

export interface PanditServiceItem {
  id: number;
  name: string;
  price: number;
  duration: number;
}

export interface PanditFilter {
  searchQuery: string;
  specialization?: string;
  expertise?: string;
  language?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  availability?: 'today' | 'week' | 'all';
}
