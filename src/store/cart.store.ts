import { create } from 'zustand';
import { Product } from '@/data/products';

interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  
  // Actions
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: (productId: string) => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totalItems: 0,
  totalPrice: 0,

  addToCart: (product) => {
    const { items } = get();
    const existingItem = items.find(item => item.id === product.id);
    
    let newItems;
    if (existingItem) {
      newItems = items.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newItems = [...items, { ...product, quantity: 1 }];
    }
    
    set({ 
      items: newItems,
      totalItems: newItems.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    });
  },

  removeFromCart: (productId) => {
    const { items } = get();
    const newItems = items.filter(item => item.id !== productId);
    
    set({ 
      items: newItems,
      totalItems: newItems.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity < 1) {
      get().removeFromCart(productId);
      return;
    }
    
    const { items } = get();
    const newItems = items.map(item =>
      item.id === productId ? { ...item, quantity } : item
    );
    
    set({ 
      items: newItems,
      totalItems: newItems.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    });
  },

  clearCart: () => set({ items: [], totalItems: 0, totalPrice: 0 }),

  getItemCount: (productId) => {
    return get().items.find(item => item.id === productId)?.quantity || 0;
  },
}));
