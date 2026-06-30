# PanditYatra Test Suite

## 📦 Test Files Overview

### 🔐 Authentication Tests
- **auth/auth.service.test.ts** - OTP, Google Login, API integration
- **auth/auth.store.test.ts** - User state management, tokens, logout

### 🌟 Kundali Tests  
- **kundali/kundali.service.test.ts** - Offline generation, PDF export, history

### 📅 Booking Tests
- **booking/booking.flow.test.ts** - Complete booking journey (search → payment)

### 🛒 Shop Tests
- **shop/shop.test.ts** - Product browsing, cart management, checkout

### 💬 Chat & AI Tests
- **chat/chat.test.ts** - Real-time chat, AI predictions, samagri recommendations
- **chat/video-puja.test.ts** - WebRTC video calls, signaling, streams

---

## 🛠️ Support Files

### Fixtures
- **fixtures/mockData.ts** - All mock data (users, products, bookings, etc.)

### Mocks
- **mocks/apiMocks.ts** - Axios mock adapter setup for API calls

### Utilities
- **utils/test-utils.tsx** - Custom render, helpers, test utilities

---

## 🚀 Quick Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth.service.test

# Run tests matching pattern
npm test -- -t "should login"

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Critical tests only (fast)
npm run test:critical
```

---

## ✅ Test Checklist

Before committing changes:
- [ ] All tests pass: `npm test`
- [ ] New features have tests
- [ ] Coverage maintained: `npm run test:coverage`
- [ ] No console errors
- [ ] Tests are independent (no shared state)

---

## 📖 Documentation

- **TESTING_GUIDE.md** - Comprehensive testing guide
- **TEST_SUMMARY.md** - Test suite summary and statistics

---

## 💡 Writing New Tests

1. Create test file in appropriate folder
2. Import utilities: `import { render } from '../utils/test-utils'`
3. Setup/cleanup mocks in beforeEach/afterEach
4. Use mock data from fixtures
5. Follow existing test patterns
6. Run and verify: `npm test -- yourfile.test`

---

**Status**: ✅ Production Ready
