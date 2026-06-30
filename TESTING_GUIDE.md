# PanditYatra - Automated Testing Guide

## 📋 Table of Contents
- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## Overview

This testing suite provides comprehensive automated testing for the PanditYatra mobile app before publishing to Google Play Store. All critical user flows are covered with unit tests, integration tests, and mocked real-time features.

### Test Framework Stack
- **Jest** - Test runner and assertion library
- **React Native Testing Library** - Component testing utilities
- **Axios Mock Adapter** - API mocking
- **Jest Expo** - Expo-specific test configuration

---

## Test Structure

```
src/__tests__/
├── auth/                    # Authentication tests
│   ├── auth.service.test.ts
│   └── auth.store.test.ts
├── kundali/                 # Kundali generation & PDF tests
│   └── kundali.service.test.ts
├── booking/                 # Booking flow integration tests
│   └── booking.flow.test.ts
├── shop/                    # Shop & Cart tests
│   └── shop.test.ts
├── chat/                    # Chat & Video Puja tests
│   ├── chat.test.ts
│   └── video-puja.test.ts
├── fixtures/                # Mock data
│   └── mockData.ts
├── mocks/                   # API mocks
│   └── apiMocks.ts
└── utils/                   # Test utilities
    └── test-utils.tsx
```

### External Mocks
```
__mocks__/
├── @expo/
│   └── vector-icons.js     # Icon components
├── expo-location.js         # Location services
├── expo-camera.js           # Camera permissions
├── expo-media-library.js    # Media library
├── expo-image-picker.js     # Image picker
├── @react-native-google-signin.js  # Google Sign-in
├── socket.io-client.js      # WebSocket mocking
└── react-native-webrtc.js   # WebRTC for video calls
```

---

## Running Tests

### Run All Tests
```bash
npm test
```

### Watch Mode (Development)
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

### Run Critical Tests Only (Fast)
```bash
npm run test:critical
```

This runs only auth, booking, and kundali tests - the most critical user flows.

### CI/CD Mode
```bash
npm run test:ci
```

Optimized for continuous integration with coverage reporting and limited workers.

---

## Test Coverage

### Coverage Targets
- **Overall**: 70%+
- **Critical Paths**: 85%+
  - Authentication (OTP, Google Login)
  - Booking Flow (Search → Payment)
  - Kundali Generation & PDF Export
  - Cart & Checkout

### View Coverage Report
After running `npm run test:coverage`, open:
```
coverage/lcov-report/index.html
```

---

## Test Categories

### 1. Authentication Tests ✅
**File**: `src/__tests__/auth/*.test.ts`

Tests:
- ✅ OTP send and verification
- ✅ Google Login flow
- ✅ Role selection (Customer/Pandit)
- ✅ Token management
- ✅ User profile updates
- ✅ Logout functionality

**Run**: `npm test -- auth`

---

### 2. Offline Kundali Tests ✅
**File**: `src/__tests__/kundali/kundali.service.test.ts`

Tests:
- ✅ Kundali generation without internet
- ✅ PDF export functionality
- ✅ History retrieval
- ✅ Invalid input handling

**Run**: `npm test -- kundali`

---

### 3. Booking Flow Integration Tests ✅
**File**: `src/__tests__/booking/booking.flow.test.ts`

Complete user journey:
1. Search for pandits
2. Select puja service
3. AI recommends samagri items
4. Add items to cart
5. Create booking
6. Verify payment

**Run**: `npm test -- booking`

---

### 4. Shop & Cart Tests ✅
**File**: `src/__tests__/shop/shop.test.ts`

Tests:
- ✅ Product browsing
- ✅ Wishlist management
- ✅ Add to cart
- ✅ Update quantities
- ✅ Remove items
- ✅ Price calculations
- ✅ Checkout validation

**Run**: `npm test -- shop`

---

### 5. AI Kundali Chat Tests ✅
**File**: `src/__tests__/chat/chat.test.ts`

Tests:
- ✅ PDF upload for AI analysis
- ✅ AI-powered predictions
- ✅ Chat message handling
- ✅ Samagri recommendations

**Run**: `npm test -- chat`

---

### 6. Real-time Features (Mocked) ✅
**Files**: 
- `src/__tests__/chat/chat.test.ts`
- `src/__tests__/chat/video-puja.test.ts`

Tests:
- ✅ WebSocket connections
- ✅ Real-time chat messaging
- ✅ Typing indicators
- ✅ WebRTC video calls
- ✅ Call signaling
- ✅ Stream management

**Run**: `npm test -- chat video-puja`

---

## Writing Tests

### Test Template

```typescript
import { setupAPIMocks, cleanupAPIMocks } from '../mocks/apiMocks';
import { render, fireEvent, waitFor } from '../utils/test-utils';

describe('Feature Name', () => {
  beforeEach(() => {
    setupAPIMocks();
  });

  afterEach(() => {
    cleanupAPIMocks();
  });

  it('should perform expected behavior', async () => {
    // Arrange
    const expectedResult = 'expected value';

    // Act
    const result = await someFunction();

    // Assert
    expect(result).toBe(expectedResult);
  });
});
```

### Component Testing

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Expected Text')).toBeTruthy();
  });

  it('should handle button press', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <MyComponent onPress={onPress} />
    );

    fireEvent.press(getByTestId('my-button'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

### Store Testing

```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useMyStore } from '@/store/myStore';

describe('MyStore', () => {
  it('should update state', () => {
    const { result } = renderHook(() => useMyStore());

    act(() => {
      result.current.updateData({ key: 'value' });
    });

    expect(result.current.data.key).toBe('value');
  });
});
```

---

## Mock Data

All mock data is centralized in `src/__tests__/fixtures/mockData.ts`.

### Available Mocks
- `mockCustomerUser` - Customer user profile
- `mockPanditUser` - Pandit user profile
- `mockPandit` - Pandit full profile with services
- `mockPujaService` - Puja service details
- `mockSamagriItems` - Shop items
- `mockBooking` - Booking data
- `mockKundaliResult` - Kundali generation result
- `mockChatMessages` - Chat messages
- `mockBanners` - App banners

### Using Mock Data

```typescript
import * as mockData from '../fixtures/mockData';

it('should use mock data', () => {
  const user = mockData.mockCustomerUser;
  expect(user.role).toBe('customer');
});
```

---

## API Mocking

API calls are automatically mocked using `axios-mock-adapter`.

### Setup

```typescript
import { setupAPIMocks, cleanupAPIMocks } from '../mocks/apiMocks';

beforeEach(() => {
  setupAPIMocks(); // Mock all APIs
});

afterEach(() => {
  cleanupAPIMocks(); // Clean up
});
```

### Custom API Error Mocking

```typescript
import { mockAPIError } from '../mocks/apiMocks';

it('should handle API error', async () => {
  mockAPIError('/auth/login/', 401, 'Unauthorized');

  try {
    await login();
    fail('Should have thrown error');
  } catch (error) {
    expect(error).toBeDefined();
  }
});
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Troubleshooting

### Common Issues

#### 1. "Cannot find module" errors

**Solution**: Clear Jest cache
```bash
npx jest --clearCache
npm test
```

#### 2. Timeout errors

**Solution**: Increase timeout in specific tests
```typescript
it('should complete long operation', async () => {
  // code
}, 10000); // 10 second timeout
```

#### 3. Mock not working

**Solution**: Verify mock is imported before the actual module
```typescript
// Mock MUST be at the top
jest.mock('@/services/api.service');

import { myFunction } from '@/services/api.service';
```

#### 4. Async tests failing randomly

**Solution**: Use `waitFor` helper
```typescript
import { waitFor } from '@testing-library/react-native';

await waitFor(() => {
  expect(result).toBeDefined();
});
```

### Debug Mode

Run tests with verbose output:
```bash
npm test -- --verbose
```

Run a single test file:
```bash
npm test -- auth.service.test
```

Run tests matching a pattern:
```bash
npm test -- -t "should login"
```

---

## Best Practices

### ✅ DO
- Write descriptive test names
- Test user behavior, not implementation
- Use mock data from fixtures
- Clean up after each test
- Test error cases
- Keep tests independent
- Use async/await properly

### ❌ DON'T
- Test implementation details
- Share state between tests
- Write flaky tests
- Skip error handling tests
- Use hardcoded values
- Test third-party libraries
- Make tests depend on execution order

---

## Test Checklist for Google Play Release

Before publishing to Google Play Store, ensure:

- [ ] All tests pass: `npm test`
- [ ] Coverage meets targets: `npm run test:coverage`
- [ ] Critical paths tested: `npm run test:critical`
- [ ] No console errors in test output
- [ ] All mocks are working correctly
- [ ] New features have test coverage
- [ ] Offline functionality tested (Kundali)
- [ ] Authentication flows tested
- [ ] Payment flow tested
- [ ] Real-time features mocked and tested

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review test output for specific errors
3. Check Jest documentation: https://jestjs.io/
4. Check React Native Testing Library docs: https://callstack.github.io/react-native-testing-library/

---

**Last Updated**: 2026-06-26
**Test Suite Version**: 1.0.0
**Status**: ✅ Production Ready
