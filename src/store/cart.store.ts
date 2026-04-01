import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  syncCart: (serverItems: any[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
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

  syncCart: (serverItems) => {
    if (!Array.isArray(serverItems)) return;
    
    const localItems = get().items;
    const mergedMap = new Map();
    
    // Load local items first
    localItems.forEach(item => {
      mergedMap.set(String(item.id), item);
    });
    
    // Override/Merge with server items
    serverItems.forEach((cartEntry: any) => {
      // Support various potential backend response structures
      const product = cartEntry.item || cartEntry.samagri_item || cartEntry.product || cartEntry;
      if (!product || (!product.id && !cartEntry.item_id)) return;
      
      const id = String(product.id || cartEntry.item_id);
      mergedMap.set(id, {
        id,
        name: product.name || 'Item',
        price: parseFloat(product.price || product.base_price || 0),
        image: product.image || product.image_url,
        quantity: cartEntry.quantity || 1,
        ...product
      });
    });
    
    const newItems = Array.from(mergedMap.values());
    
    set({ 
      items: newItems,
      totalItems: newItems.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    });
  },
}),
{
  name: 'cart-storage',
  storage: createJSONStorage(() => AsyncStorage),
}
)
);
