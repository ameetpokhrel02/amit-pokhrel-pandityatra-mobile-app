import { setupAPIMocks, cleanupAPIMocks } from '../mocks/apiMocks';
import { searchPandits } from '@/services/pandit.service';
import { createBooking, getBookings } from '@/services/booking.service';
import { fetchSamagriItems } from '@/services/samagri.service';
import { useCartStore } from '@/store/cart.store';
import * as mockData from '../fixtures/mockData';

describe('Booking Flow Integration', () => {
  beforeEach(() => {
    setupAPIMocks();
    // Clear cart before each test
    useCartStore.getState().clearCart();
  });

  afterEach(() => {
    cleanupAPIMocks();
  });

  describe('Complete Booking Journey', () => {
    it('should complete full booking flow: search → select → samagri → cart → payment', async () => {
      // Step 1: Search for pandits
      const searchResults = await searchPandits({ expertise: 'Vedic' });
      expect(searchResults).toBeDefined();
      expect(searchResults.length).toBeGreaterThan(0);

      const selectedPandit = searchResults[0];
      expect(selectedPandit.is_verified).toBe(true);

      // Step 2: Select puja service
      const pujaService = mockData.mockPujaService;
      expect(pujaService).toBeDefined();

      // Step 3: AI recommends samagri items
      const samagriItems = await fetchSamagriItems();
      expect(samagriItems.length).toBeGreaterThan(0);

      // Step 4: Add items to cart
      const cartStore = useCartStore.getState();
      samagriItems.slice(0, 3).forEach(item => {
        cartStore.addToCart({
          id: String(item.id),
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: 1,
        });
      });

      expect(cartStore.items.length).toBe(3);
      expect(cartStore.totalItems).toBe(3);

      // Step 5: Create booking
      const bookingData = {
        pandit_id: selectedPandit.id,
        puja_service_id: pujaService.id,
        booking_date: '2026-07-01',
        booking_time: '10:00:00',
        location: 'Kathmandu, Nepal',
        samagri_items: cartStore.items.map(i => ({ id: i.id, quantity: i.quantity })),
      };

      const booking = await createBooking(bookingData);
      expect(booking).toBeDefined();
      expect(booking.status).toBe('confirmed');
      expect(booking.payment_status).toBe('paid');

      // Step 6: Verify booking was created
      const bookings = await getBookings();
      expect(bookings.length).toBeGreaterThan(0);
      expect(bookings[0].id).toBe(booking.id);
    });

    it('should handle booking creation failure gracefully', async () => {
      const invalidBookingData = {
        pandit_id: -1, // Invalid pandit
        puja_service_id: -1,
        booking_date: '',
        booking_time: '',
        location: '',
      };

      try {
        await createBooking(invalidBookingData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Cart Management', () => {
    it('should add items to cart with correct quantities', () => {
      const cartStore = useCartStore.getState();
      const item = mockData.mockSamagriItem;

      cartStore.addToCart({
        id: String(item.id),
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: 2,
      });

      expect(cartStore.items.length).toBe(1);
      expect(cartStore.items[0].quantity).toBe(2);
      expect(cartStore.totalItems).toBe(2);
    });

    it('should update item quantity', () => {
      const cartStore = useCartStore.getState();
      const item = mockData.mockSamagriItem;

      cartStore.addToCart({
        id: String(item.id),
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: 1,
      });

      cartStore.updateQuantity(String(item.id), 5);
      expect(cartStore.items[0].quantity).toBe(5);
      expect(cartStore.totalItems).toBe(5);
    });

    it('should remove item from cart', () => {
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

      cartStore.removeFromCart(String(item.id));
      expect(cartStore.items.length).toBe(0);
      expect(cartStore.totalItems).toBe(0);
    });

    it('should calculate correct total price', () => {
      const cartStore = useCartStore.getState();

      cartStore.addToCart({
        id: '1',
        name: 'Item 1',
        price: 100,
        image: '',
        quantity: 2,
      });

      cartStore.addToCart({
        id: '2',
        name: 'Item 2',
        price: 150,
        image: '',
        quantity: 1,
      });

      // Total = (100 * 2) + (150 * 1) = 350
      expect(cartStore.totalPrice).toBe(350);
    });

    it('should clear cart', () => {
      const cartStore = useCartStore.getState();

      cartStore.addToCart({
        id: '1',
        name: 'Item 1',
        price: 100,
        image: '',
        quantity: 1,
      });

      cartStore.clearCart();
      expect(cartStore.items.length).toBe(0);
      expect(cartStore.totalItems).toBe(0);
      expect(cartStore.totalPrice).toBe(0);
    });
  });
});
