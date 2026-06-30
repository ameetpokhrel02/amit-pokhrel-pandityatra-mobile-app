import { setupAPIMocks, cleanupAPIMocks } from '../mocks/apiMocks';
import { fetchSamagriItems, checkWishlistStatus, toggleWishlist } from '@/services/samagri.service';
import { useCartStore } from '@/store/cart.store';
import * as mockData from '../fixtures/mockData';

describe('Shop Features', () => {
  beforeEach(() => {
    setupAPIMocks();
    useCartStore.getState().clearCart();
  });

  afterEach(() => {
    cleanupAPIMocks();
  });

  describe('Product Browsing', () => {
    it('should fetch all samagri items', async () => {
      const items = await fetchSamagriItems();

      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
      expect(items[0]).toHaveProperty('name');
      expect(items[0]).toHaveProperty('price');
      expect(items[0]).toHaveProperty('category');
    });

    it('should display item details correctly', async () => {
      const items = await fetchSamagriItems();
      const item = items[0];

      expect(item.id).toBeDefined();
      expect(item.name).toBeTruthy();
      expect(item.price).toBeGreaterThan(0);
      expect(item.image).toBeTruthy();
    });
  });

  describe('Wishlist Management', () => {
    it('should check wishlist status for an item', async () => {
      const itemId = mockData.mockSamagriItem.id;
      const status = await checkWishlistStatus(itemId);

      expect(status).toHaveProperty('is_favorite');
      expect(typeof status.is_favorite).toBe('boolean');
    });

    it('should toggle item in wishlist', async () => {
      const itemId = mockData.mockSamagriItem.id;

      const result = await toggleWishlist(itemId);

      expect(result).toHaveProperty('status');
      expect(['added', 'removed']).toContain(result.status);
    });
  });

  describe('Add to Cart from Shop', () => {
    it('should add product to cart from shop page', () => {
      const cartStore = useCartStore.getState();
      const item = mockData.mockSamagriItem;

      cartStore.addToCart({
        id: String(item.id),
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: 1,
      });

      expect(cartStore.items.length).toBe(1);
      expect(cartStore.items[0].id).toBe(String(item.id));
    });

    it('should increase quantity if item already in cart', () => {
      const cartStore = useCartStore.getState();
      const item = mockData.mockSamagriItem;

      cartStore.addToCart({
        id: String(item.id),
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: 1,
      });

      cartStore.addToCart({
        id: String(item.id),
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: 1,
      });

      expect(cartStore.items.length).toBe(1);
      expect(cartStore.items[0].quantity).toBe(2);
    });
  });

  describe('Checkout Flow', () => {
    it('should proceed to checkout with items in cart', () => {
      const cartStore = useCartStore.getState();

      // Add multiple items
      mockData.mockSamagriItems.forEach(item => {
        cartStore.addToCart({
          id: String(item.id),
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: 1,
        });
      });

      expect(cartStore.items.length).toBe(mockData.mockSamagriItems.length);
      expect(cartStore.totalPrice).toBeGreaterThan(0);

      // Verify checkout data
      const checkoutData = {
        items: cartStore.items,
        total: cartStore.totalPrice,
        itemCount: cartStore.totalItems,
      };

      expect(checkoutData.items.length).toBeGreaterThan(0);
      expect(checkoutData.total).toBeGreaterThan(0);
      expect(checkoutData.itemCount).toBeGreaterThan(0);
    });

    it('should not allow checkout with empty cart', () => {
      const cartStore = useCartStore.getState();

      expect(cartStore.items.length).toBe(0);
      expect(cartStore.totalItems).toBe(0);

      // Checkout should be disabled
      const canCheckout = cartStore.items.length > 0;
      expect(canCheckout).toBe(false);
    });
  });
});
