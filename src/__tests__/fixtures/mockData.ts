// Mock User Data
export const mockCustomerUser = {
  id: 1,
  email: 'customer@test.com',
  full_name: 'Test Customer',
  phone_number: '+9779812345678',
  role: 'customer',
  profile_pic_url: 'https://example.com/customer.jpg',
};

export const mockPanditUser = {
  id: 2,
  email: 'pandit@test.com',
  full_name: 'Test Pandit',
  phone_number: '+9779887654321',
  role: 'pandit',
  profile_pic_url: 'https://example.com/pandit.jpg',
};

// Mock Pandit Profile
export const mockPandit = {
  id: 1,
  user: 2,
  user_details: mockPanditUser,
  expertise: 'Vedic Rituals, Puja Services',
  experience_years: 10,
  language: 'Nepali, Hindi, English',
  rating: 4.8,
  bio: 'Experienced pandit specializing in traditional pujas',
  is_available: true,
  is_verified: true,
  verification_status: 'verified',
  review_count: 150,
  bookings_count: 300,
};

// Mock Puja Services
export const mockPujaService = {
  id: 1,
  name: 'Satyanarayan Puja',
  category: 1,
  base_price: '5000',
  image: 'https://example.com/satyanarayan.jpg',
  description: 'Traditional Satyanarayan Puja ceremony',
  base_duration_minutes: 120,
};

export const mockPujaServices = [
  mockPujaService,
  {
    id: 2,
    name: 'Griha Pravesh',
    category: 2,
    base_price: '7500',
    image: 'https://example.com/griha-pravesh.jpg',
    description: 'House warming ceremony',
    base_duration_minutes: 180,
  },
];

// Mock Samagri Items
export const mockSamagriItem = {
  id: 1,
  name: 'Incense Sticks',
  price: 150,
  category: 'Fragrance',
  image: 'https://example.com/incense.jpg',
  description: 'Premium quality incense sticks',
  in_stock: true,
};

export const mockSamagriItems = [
  mockSamagriItem,
  {
    id: 2,
    name: 'Camphor',
    price: 100,
    category: 'Essential',
    image: 'https://example.com/camphor.jpg',
    description: 'Pure camphor for puja',
    in_stock: true,
  },
  {
    id: 3,
    name: 'Sacred Thread',
    price: 50,
    category: 'Essential',
    image: 'https://example.com/thread.jpg',
    description: 'Traditional sacred thread',
    in_stock: true,
  },
];

// Mock Booking
export const mockBooking = {
  id: 1,
  customer: 1,
  pandit: 1,
  puja_service: 1,
  puja_service_details: mockPujaService,
  pandit_details: mockPandit,
  booking_date: '2026-07-01',
  booking_time: '10:00:00',
  location: 'Kathmandu, Nepal',
  status: 'confirmed',
  total_amount: '5500',
  payment_status: 'paid',
  created_at: '2026-06-26T10:00:00Z',
};

// Mock Cart Items
export const mockCartItems = [
  {
    id: '1',
    name: 'Incense Sticks',
    price: 150,
    quantity: 2,
    image: 'https://example.com/incense.jpg',
  },
  {
    id: '2',
    name: 'Camphor',
    price: 100,
    quantity: 1,
    image: 'https://example.com/camphor.jpg',
  },
];

// Mock Kundali Data
export const mockKundaliInput = {
  name: 'John Doe',
  dateOfBirth: '1990-01-15',
  timeOfBirth: '10:30',
  placeOfBirth: 'Kathmandu',
  latitude: 27.7172,
  longitude: 85.324,
};

export const mockKundaliResult = {
  id: 1,
  user: 1,
  name: 'John Doe',
  date_of_birth: '1990-01-15',
  time_of_birth: '10:30:00',
  place_of_birth: 'Kathmandu',
  sun_sign: 'Capricorn',
  moon_sign: 'Taurus',
  ascendant: 'Leo',
  predictions: {
    personality: 'Strong leadership qualities',
    career: 'Success in business',
    health: 'Good overall health',
    relationships: 'Harmonious relationships',
  },
  pdf_url: 'https://example.com/kundali.pdf',
  created_at: '2026-06-26T10:00:00Z',
};

// Mock Chat Messages
export const mockChatMessages = [
  {
    _id: '1',
    text: 'Hello, I need help with puja booking',
    createdAt: new Date('2026-06-26T10:00:00Z'),
    user: {
      _id: 1,
      name: 'Test Customer',
      avatar: 'https://example.com/customer.jpg',
    },
  },
  {
    _id: '2',
    text: 'Sure, I can help you with that',
    createdAt: new Date('2026-06-26T10:01:00Z'),
    user: {
      _id: 2,
      name: 'Test Pandit',
      avatar: 'https://example.com/pandit.jpg',
    },
  },
];

// Mock Banners
export const mockBanners = [
  {
    id: 1,
    title: 'Flash Sale',
    description: '50% off on all puja samagri',
    image_url: 'https://example.com/banner1.jpg',
    banner_type: 'SALE_BANNER',
    discount_percentage: 50,
    status: 'ACTIVE',
    priority_order: 1,
  },
  {
    id: 2,
    title: 'New Pandit Joined',
    description: 'Expert in Vedic rituals',
    image_url: 'https://example.com/banner2.jpg',
    banner_type: 'MAIN_BANNER',
    status: 'ACTIVE',
    priority_order: 2,
  },
];

// Mock Payment Response
export const mockPaymentSuccess = {
  id: 1,
  payment_method: 'khalti',
  amount_npr: '5500',
  transaction_id: 'TXN123456',
  status: 'completed',
  booking: 1,
};

// Mock OTP Response
export const mockOTPResponse = {
  message: 'OTP sent successfully',
  phone_number: '+9779812345678',
};

export const mockOTPVerifyResponse = {
  access: 'mock-access-token',
  refresh: 'mock-refresh-token',
  user: mockCustomerUser,
};

// Mock Google Auth Response
export const mockGoogleAuthResponse = {
  access: 'mock-google-access-token',
  refresh: 'mock-google-refresh-token',
  user: mockCustomerUser,
};
