import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '@/data/products';
import { addToCart as addToServerCart, updateCartItem as updateServerCart, removeFromCartServer, clearCartServer } from '@/services/samagri.service';
import { useAuthStore } from './auth.store';

interface CartItem extends Product {
  quantity: number;
  serverCartItemId?: number; // Stores the PK of the CartItem on the server
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  
  // Actions
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getItemCount: (productId: string) => number;
  syncCart: (serverItems: any[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
  items: [],
  totalItems: 0,
  totalPrice: 0,

  addToCart: async (product) => {
    const { isAuthenticated } = useAuthStore.getState();
    const { items } = get();
    const existingItem = items.find(item => String(item.id) === String(product.id));
    
    // 1. Update server if authenticated
    if (isAuthenticated) {
      try {
        await addToServerCart(Number(product.id), 1);
      } catch (error) {
        console.error('[CartStore] Failed to add item to server cart:', error);
      }
    }

    // 2. Update local state
    let newItems;
    if (existingItem) {
      newItems = items.map(item =>
        String(item.id) === String(product.id) ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newItems = [...items, { ...product, quantity: 1 }];
    }
    
    set({ 
      items: newItems,
      totalItems: newItems.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: newItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0)
    });
  },

  removeFromCart: async (productId) => {
    const { isAuthenticated } = useAuthStore.getState();
    const { items } = get();
    const itemToDelete = items.find(item => String(item.id) === String(productId));

    // 1. Update server if authenticated
    if (isAuthenticated && itemToDelete?.serverCartItemId) {
      try {
        await removeFromCartServer(itemToDelete.serverCartItemId);
      } catch (error) {
        console.error('[CartStore] Failed to remove item from server cart:', error);
      }
    }

    // 2. Update local state
    const newItems = items.filter(item => String(item.id) !== String(productId));
    
    set({ 
      items: newItems,
      totalItems: newItems.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: newItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0)
    });
  },

  updateQuantity: async (productId, quantity) => {
    if (quantity < 1) {
      await get().removeFromCart(productId);
      return;
    }
    
    const { isAuthenticated } = useAuthStore.getState();
    const { items } = get();
    const existingItem = items.find(item => String(item.id) === String(productId));

    // 1. Update server if authenticated
    if (isAuthenticated && existingItem?.serverCartItemId) {
      try {
        await updateServerCart(existingItem.serverCartItemId, quantity);
      } catch (error) {
        console.error('[CartStore] Failed to update server cart quantity:', error);
      }
    }

    // 2. Update local state
    const newItems = items.map(item =>
      String(item.id) === String(productId) ? { ...item, quantity } : item
    );
    
    set({ 
      items: newItems,
      totalItems: newItems.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: newItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0)
    });
  },

  clearCart: async () => {
    const { isAuthenticated } = useAuthStore.getState();
    
    // 1. Update server if authenticated
    if (isAuthenticated) {
      try {
        await clearCartServer();
      } catch (error) {
        console.error('[CartStore] Failed to clear server cart:', error);
      }
    }

    // 2. Update local state
    set({ items: [], totalItems: 0, totalPrice: 0 });
  },

  getItemCount: (productId) => {
    return get().items.find(item => String(item.id) === String(productId))?.quantity || 0;
  },

  syncCart: (serverItems) => {
    if (!Array.isArray(serverItems)) return;
    
    const localItems = get().items;
    const mergedMap = new Map();
    
    // Load local items first (preserving server identities if they already match)
    localItems.forEach(item => {
      mergedMap.set(String(item.id), item);
    });
    
    // Override/Merge with server items (Server truth wins for quantities and IDs)
    serverItems.forEach((cartEntry: any) => {
      const product = cartEntry.item || cartEntry.samagri_item || cartEntry.product || cartEntry;
      if (!product || (!product.id && !cartEntry.item_id)) return;
      
      const id = String(product.id || cartEntry.item_id);
      mergedMap.set(id, {
        id,
        name: product.name || 'Item',
        price: parseFloat(product.price || product.base_price || 0),
        image: product.image || product.image_url,
        quantity: cartEntry.quantity || 1,
        serverCartItemId: cartEntry.id, // THE DATABASE PK OF THE CART ITEM
        ...product
      });
    });
    
    const newItems = Array.from(mergedMap.values());
    
    set({ 
      items: newItems,
      totalItems: newItems.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: newItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0)
    });
  },
}),
{
  name: 'cart-storage',
  storage: createJSONStorage(() => AsyncStorage),
}
)
);
