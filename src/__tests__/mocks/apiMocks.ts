import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import * as mockData from '../fixtures/mockData';

// The services import a custom apiClient and publicApi — both built from axios.create().
// axios-mock-adapter on the default `axios` instance does NOT intercept those custom instances.
// We work around this by also intercepting the real apiClient / publicApi instances directly.
import apiClientDefault, { publicApi } from '@/services/api-client';

const mockDefaultAxios = new MockAdapter(axios, { delayResponse: 0 });
const mockApiClient = new MockAdapter(apiClientDefault, { delayResponse: 0 });
const mockPublicApi = new MockAdapter(publicApi, { delayResponse: 0 });

const applyMocks = (mock: MockAdapter) => {
  mock.reset();

  // Auth endpoints
  mock.onPost(/request-otp/).reply(200, mockData.mockOTPResponse);
  mock.onPost(/login-otp/).reply(200, mockData.mockOTPVerifyResponse);
  mock.onPost(/google-login/).reply(200, mockData.mockGoogleAuthResponse);
  mock.onPost(/token\/refresh/).reply(200, { access: 'new-access-token' });

  // Pandit endpoints
  mock.onGet(/pandits\/search/).reply(200, [mockData.mockPandit]);
  mock.onGet(/pandits\/\d+\//).reply(200, mockData.mockPandit);
  mock.onGet(/pandits\/?$/).reply(200, [mockData.mockPandit]);

  // Puja services
  mock.onGet(/services\/\d+\//).reply(200, mockData.mockPujaService);
  mock.onGet(/services\/?$/).reply(200, mockData.mockPujaServices);

  // Samagri (shop) endpoints
  mock.onGet(/samagri\/items\/?$/).reply(200, mockData.mockSamagriItems);
  mock.onGet(/samagri\/items\/\d+\//).reply(200, mockData.mockSamagriItem);
  mock.onGet(/samagri\/wishlist\/check\/\d+\//).reply(200, { is_favorite: false });
  mock.onPost(/samagri\/wishlist\/toggle/).reply(200, { status: 'added' });
  // Server cart endpoints (used by cart.store)
  mock.onPost(/samagri\/cart\/?$/).reply(200, { id: 1, quantity: 1 });
  mock.onPatch(/samagri\/cart\/\d+\//).reply(200, { id: 1, quantity: 1 });
  mock.onDelete(/samagri\/cart\/\d+\//).reply(204);
  mock.onDelete(/samagri\/cart\/clear/).reply(204);
  mock.onGet(/samagri\/cart\/?$/).reply(200, []);

  // Booking endpoints
  mock.onPost(/bookings\/?$/).reply(201, mockData.mockBooking);
  mock.onGet(/bookings\/my_bookings/).reply(200, [mockData.mockBooking]);
  mock.onGet(/bookings\/\d+\//).reply(200, mockData.mockBooking);
  mock.onGet(/bookings\/?$/).reply(200, [mockData.mockBooking]);
  mock.onPatch(/bookings\/\d+\//).reply(200, mockData.mockBooking);

  // Kundali endpoints
  mock.onPost(/kundali\/generate/).reply(201, mockData.mockKundaliResult);
  mock.onGet(/kundali\/?$/).reply(200, [mockData.mockKundaliResult]);
  mock.onGet(/kundali\/\d+\//).reply(200, mockData.mockKundaliResult);
  mock.onPost(/kundali\/\d+\/export-pdf/).reply(200, { pdf_url: mockData.mockKundaliResult.pdf_url });

  // Payment endpoints
  mock.onPost(/payments\/initiate/).reply(200, {
    payment_url: 'https://khalti.com/payment/mock',
    pidx: 'MOCK_PIDX_123',
  });
  mock.onPost(/payments\/verify/).reply(200, mockData.mockPaymentSuccess);

  // Banner endpoints
  mock.onGet(/banners\/active_banners/).reply(200, mockData.mockBanners);

  // Chat endpoints
  mock.onGet(/chat\/\d+\/messages/).reply(200, mockData.mockChatMessages);
  mock.onPost(/chat\/\d+\/send/).reply(201, mockData.mockChatMessages[0]);

  // AI endpoints
  mock.onPost(/ai\/kundali-chat/).reply(200, {
    response: 'Based on your kundali, you have strong leadership qualities.',
  });
  mock.onPost(/ai\/samagri-recommendation/).reply(200, {
    items: mockData.mockSamagriItems.slice(0, 3),
  });
  mock.onPost(/ai\//).reply(200, { message: 'AI response' });

  // User profile endpoints
  mock.onGet(/users\/profile/).reply(200, mockData.mockCustomerUser);
  mock.onPatch(/users\/profile/).reply(200, mockData.mockCustomerUser);

  // Fallback — let through anything unmatched rather than hanging
  mock.onAny().passThrough();
};

export const setupAPIMocks = () => {
  applyMocks(mockDefaultAxios);
  applyMocks(mockApiClient);
  applyMocks(mockPublicApi);
};

export const cleanupAPIMocks = () => {
  mockDefaultAxios.reset();
  mockApiClient.reset();
  mockPublicApi.reset();
};

// Helper to mock a specific URL with an error
export const mockAPIError = (url: string, status: number, message: string) => {
  mockApiClient.onAny(url).reply(status, { error: message });
  mockPublicApi.onAny(url).reply(status, { error: message });
};

export default mockApiClient;
