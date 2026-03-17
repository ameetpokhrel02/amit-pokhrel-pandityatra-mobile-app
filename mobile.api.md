# PanditYatra Mobile (React Native) — Features, Screens, and API Endpoints
Last updated: 2026-03-14  
Scope: Mobile app using existing web backend APIs.  
Excludes: Admin/Superadmin mobile features (intentionally omitted).

---
## 1) Mobile Feature Scope (No Admin)
### Customer App Features
- Auth: OTP login, password login, Google login, forgot/reset password
- Profile: view/update/delete profile
- Discover pandits: list, filter, view profile, view services
- Booking flow: select pandit/service/date/time/location, confirm, pay, track
- My bookings: list, cancel, status updates, invoice
- Reviews: create review after booking, site reviews, view own reviews
- Shop: samagri + books browsing, wishlist, checkout, my orders, invoices
- AI Guide: conversational assistant, item search, add-to-cart actions, puja-specific samagri
- Kundali: generate and list saved kundalis
- Panchang: daily data + festival support
- Chat: pre-booking and booking chat with pandit (real-time)
- Video puja: join room, create token, generate link
- Notifications: list, mark read, mark all read, delete

### Pandit App Features
- Pandit onboarding/register
- Dashboard stats + availability toggle
- Profile update/delete
- Services management (CRUD)
- Bookings list + status updates
- Wallet / withdrawals
- Calendar/availability blocks
- Messages/chat with customers
- Reviews (received)

---
## 2) Mobile Screen List (Recommended)
### Public
- Splash / App Init
- Onboarding
- Home
- About
- Contact
- Panchang Calendar
- Pandit List
- Pandit Profile
- Samagri Shop
- Books Shop
- Cart

### Auth
- Login (OTP/Password)
- Register (Customer)
- Register (Pandit)
- OTP Verification
- Forgot Password
- Reset Password

### Customer (Logged-in)
- Customer Dashboard
- Edit Profile
- Booking Form
- Booking Confirmation
- Payment Screen
- Payment Success
- Payment Failure
- My Bookings
- Submit Booking Review
- Customer Messages (chat list + room)
- Kundali Generator
- Kundali History
- Notifications
- Shop Checkout
- My Shop Orders
- Order Detail
- Site Review Submission

### Pandit (Logged-in)
- Pandit Dashboard
- Pandit Profile
- Pandit Services
- Pandit Bookings
- Pandit Earnings/Withdrawals
- Pandit Calendar
- Pandit Messages
- Pandit Reviews
- Pandit App Feedback

### Shared Utility
- AI Guide Widget/Screen
- Video Puja Room
- Invoice Viewer/Downloader

---
## 3) API Base and Auth
- Base URL: `https://<your-domain>/api`
- JSON auth header: `Authorization: Bearer <access_token>`
- JWT token endpoints:
  - `POST /api/token/`
  - `POST /api/token/refresh/`

---
## 4) Endpoint Catalog (Mobile-safe)
Notes:

- All endpoints below are from current backend route configuration and current web usage.
- Admin-only routes are intentionally excluded.
- For DRF `ViewSet` routes, standard REST endpoints are included where applicable.

### 4.1 Users/Auth/Profile
- `POST /api/users/register/` — customer registration
- `POST /api/users/request-otp/` — request OTP
- `POST /api/users/login-otp/` — verify OTP + login
- `POST /api/users/login-password/` — login with password
- `POST /api/users/google-login/` — Google login
- `POST /api/users/forgot-password/` — forgot password request OTP
- `POST /api/users/forgot-password/verify-otp/` — verify reset OTP
- `POST /api/users/forgot-password/reset/` — set new password
- `GET /api/users/profile/` — get current user
- `PATCH /api/users/profile/` — update profile
- `PUT /api/users/profile/` — full profile update
- `DELETE /api/users/profile/` — self account delete
- `POST /api/users/contact/` — contact form
- `GET /api/users/site-content/` — public CMS content

### 4.2 Pandits
- `GET /api/pandits/` — list pandits
- `GET /api/pandits/{id}/` — pandit detail
- `PATCH /api/pandits/{id}/` — pandit profile update (owner/admin as allowed)
- `DELETE /api/pandits/{id}/` — pandit self-delete/admin delete (per backend rules)
- `GET /api/pandits/{id}/profile/` — extra profile endpoint
- `POST /api/pandits/register/` — pandit registration
- `GET /api/pandits/services/catalog/` — puja catalog for pandit services
- `GET /api/pandits/dashboard/stats/` — pandit dashboard stats
- `POST /api/pandits/dashboard/toggle-availability/` — availability toggle
- `GET /api/pandits/wallet/` — pandit wallet
- `GET /api/pandits/withdrawals/` — withdrawal history
- `POST /api/pandits/withdrawal/request/` — request withdrawal

#### Pandit Services (`my-services` ViewSet)
- `GET /api/pandits/my-services/`
- `POST /api/pandits/my-services/`
- `GET /api/pandits/my-services/{id}/`
- `PATCH /api/pandits/my-services/{id}/`
- `DELETE /api/pandits/my-services/{id}/`

#### Pandit Calendar
- `GET /api/pandits/me/calendar/`
- `POST /api/pandits/me/calendar/`
- `DELETE /api/pandits/me/calendar/blocks/{block_id}/`

### 4.3 Services (Puja)
- `GET /api/services/` — list pujas
- `POST /api/services/` — create puja (normally admin/staff usage)
- `GET /api/services/{id}/` — puja detail
- `PATCH /api/services/{id}/`
- `DELETE /api/services/{id}/`
- `GET /api/services/categories/` — puja categories

### 4.4 Bookings
#### Booking ViewSet standard
- `GET /api/bookings/`
- `POST /api/bookings/`
- `GET /api/bookings/{id}/`
- `PATCH /api/bookings/{id}/`
- `DELETE /api/bookings/{id}/`

#### Booking custom actions
- `PATCH /api/bookings/{id}/update_status/`
- `PATCH /api/bookings/{id}/cancel/`
- `GET /api/bookings/my_bookings/`
- `GET /api/bookings/available_slots/?pandit_id=&date=&service_id=`
- `GET /api/bookings/{id}/invoice/`

### 4.5 Reviews
- `POST /api/reviews/create/` — create booking review
- `GET /api/reviews/pandit-reviews/` — recent pandit reviews
- `GET /api/reviews/site-reviews/` — site reviews list
- `POST /api/reviews/site-reviews/` — submit site review
- `GET /api/reviews/my-reviews/` — customer’s reviews
- `GET /api/reviews/pandit/my-reviews/` — pandit received reviews

### 4.6 Samagri + Shop + Wishlist
#### Samagri categories/items/requirements
- `GET /api/samagri/categories/`
- `GET /api/samagri/items/`
- `GET /api/samagri/requirements/`

(Creation/update/deletion routes exist but generally admin-side; do not expose in customer mobile UX.)

#### AI recommendation (legacy)
- `POST /api/samagri/ai_recommend/`

#### Shop checkout (`checkout` ViewSet + actions)
- `POST /api/samagri/checkout/initiate/`
- `GET /api/samagri/checkout/my-orders/`
- `GET /api/samagri/checkout/{id}/detail/`
- `GET /api/samagri/checkout/{id}/invoice/`

#### Wishlist (`wishlist` ViewSet + actions)
- `GET /api/samagri/wishlist/`
- `POST /api/samagri/wishlist/add/`
- `DELETE /api/samagri/wishlist/remove/{item_id}/`
- `GET /api/samagri/wishlist/check/{item_id}/`
- `POST /api/samagri/wishlist/toggle/`

### 4.7 Recommender (non-admin usable subset)
- `GET /api/recommender/recommendations/by_puja/?puja_id=&limit=&min_confidence=`
- `GET /api/recommender/recommendations/personalized/?puja_id=&limit=`
- `GET /api/recommender/recommendations/seasonal/?puja_id=&limit=`
- `GET /api/recommender/recommendations/stats/?puja_id=&days=`

#### Booking samagri recommendation flow
- `GET /api/recommender/bookings/{booking_id}/samagri/`
- `POST /api/recommender/bookings/{booking_id}/samagri/recommendations/`
- `POST /api/recommender/bookings/{booking_id}/samagri/auto-add/`
- `POST /api/recommender/bookings/{booking_id}/samagri/add-item/`

#### User preferences
- `GET /api/recommender/user/preferences/`
- `POST /api/recommender/user/preferences/`
- `PATCH /api/recommender/user/preferences/{id}/`
- `DELETE /api/recommender/user/preferences/{id}/`
- `GET /api/recommender/user/preferences/insights/`

### 4.8 AI Guide + AI Puja Samagri
- `POST /api/ai/chat/` — unified AI guide chat
- `POST /api/ai/puja-samagri/` — puja-specific samagri response
- `GET /api/ai/guide/` — guide info endpoint

### 4.9 Chat
- `GET /api/chat/rooms/`
- `GET /api/chat/rooms/{id}/`
- `GET /api/chat/rooms/{room_id}/messages/`
- `POST /api/chat/rooms/{room_id}/messages/`
- `POST /api/chat/messages/{id}/mark-read/`
- `POST /api/chat/rooms/initiate/` — initiate pre-booking/booking room
- `POST /api/chat/quick-chat/` — quick AI guide fallback chat
- `GET /api/chat/history/`

#### Chat WebSocket
- `ws(s)://<host>/ws/chat/{roomId}/?token=<jwt>`

### 4.10 Payments
- `POST /api/payments/create/`
- `POST /api/payments/initiate/`
- `GET /api/payments/check-status/{booking_id}/`
- `GET /api/payments/exchange-rate/`
- `GET /api/payments/khalti/verify/` (query params from gateway)
- `GET /api/payments/esewa/verify/` (query params from gateway)

(Refund and admin payout endpoints exist but excluded from mobile scope.)
### 4.11 Video
- `GET /api/video/room/{booking_id}/`
- `POST /api/video/create-token/`
- `POST /api/video/generate-link/{booking_id}/`
- `POST /api/video/room/{booking_id}/join/`

### 4.12 Kundali
- `POST /api/kundali/generate/`
- `GET /api/kundali/list/`
- `GET /api/kundali/public-stats/`

### 4.13 Panchang
- `GET /api/panchang/data/` (date/location params if provided)

### 4.14 Notifications
- `GET /api/notifications/`
- `GET /api/notifications/{id}/`
- `PATCH /api/notifications/{id}/` (mark read, etc.)
- `DELETE /api/notifications/{id}/`
- `POST /api/notifications/mark-all-read/`

---
## 5) Mobile Navigation Blueprint (No Admin)
### Bottom Tabs (Customer)
- Home
- Pandits
- Bookings
- Shop
- Profile

### Bottom Tabs (Pandit)
- Dashboard
- Bookings
- Services
- Messages
- Profile

### Common Stack
- Auth stack
- Booking flow stack
- Payment flow stack
- Chat room
- Video room
- AI Guide modal/page

---
## 6) Integration Notes for React Native
- Reuse same bearer token strategy as web.
- For file/image upload use `multipart/form-data`.
- Maintain unified cart locally (and sync with checkout payload).
- Chat/Video require robust reconnection handling.
- Use endpoint wrappers (like web `src/lib/api.ts`) in a dedicated RN API layer.

---
## 7) Admin Endpoints Explicitly Excluded in Mobile
Do not include routes under:

- `/api/admin/*`
- `/api/users/admin/*`
- `/api/pandits/admin/*`
- `/api/payments/admin/*`
- `/api/reviews/admin-reviews/`

---
## 8) Suggested Build Order
1. Auth + profile
2. Pandit discovery + profile
3. Booking + payment + my bookings
4. Shop + wishlist + checkout + orders
5. Chat + notifications
6. Video puja
7. Kundali + panchang
8. AI guide + puja-samagri

---
If needed, next step: generate a second doc with exact React Native folder structure, API client modules, DTO types, and Zustand/Redux slices mapped to these endpoints.
# PanditYatra Mobile (React Native) — Features, Screens, and API Endpoints

Last updated: 2026-03-14  
Scope: Mobile app using existing web backend APIs.  
Excludes: Admin/Superadmin mobile features (intentionally omitted).

---

## 1) Mobile Feature Scope (No Admin)

### Customer App Features
- Auth: OTP login, password login, Google login, forgot/reset password
- Profile: view/update/delete profile
- Discover pandits: list, filter, view profile, view services
- Booking flow: select pandit/service/date/time/location, confirm, pay, track
- My bookings: list, cancel, status updates, invoice
- Reviews: create review after booking, site reviews, view own reviews
- Shop: samagri + books browsing, wishlist, checkout, my orders, invoices
- AI Guide: conversational assistant, item search, add-to-cart actions, puja-specific samagri
- Kundali: generate and list saved kundalis
- Panchang: daily data + festival support
- Chat: pre-booking and booking chat with pandit (real-time)
- Video puja: join room, create token, generate link
- Notifications: list, mark read, mark all read, delete

### Pandit App Features
- Pandit onboarding/register
- Dashboard stats + availability toggle
- Profile update/delete
- Services management (CRUD)
- Bookings list + status updates
- Wallet / withdrawals
- Calendar/availability blocks
- Messages/chat with customers
- Reviews (received)

---

## 2) Mobile Screen List (Recommended)

## 2.1 Public
1. Splash / App Init
2. Onboarding
3. Home
4. About
5. Contact
6. Panchang Calendar
7. Pandit List
8. Pandit Profile
9. Samagri Shop
10. Books Shop
11. Cart

## 2.2 Auth
12. Login (OTP/Password)
13. Register (Customer)
14. Register (Pandit)
15. OTP Verification
16. Forgot Password
17. Reset Password

## 2.3 Customer (Logged-in)
18. Customer Dashboard
19. Edit Profile
20. Booking Form
21. Booking Confirmation
22. Payment Screen
23. Payment Success
24. Payment Failure
25. My Bookings
26. Submit Booking Review
27. Customer Messages (chat list + room)
28. Kundali Generator
29. Kundali History
30. Notifications
31. Shop Checkout
32. My Shop Orders
33. Order Detail
34. Site Review Submission

## 2.4 Pandit (Logged-in)
35. Pandit Dashboard
36. Pandit Profile
37. Pandit Services
38. Pandit Bookings
39. Pandit Earnings/Withdrawals
40. Pandit Calendar
41. Pandit Messages
42. Pandit Reviews
43. Pandit App Feedback

## 2.5 Shared Utility
44. AI Guide Widget/Screen
45. Video Puja Room
46. Invoice Viewer/Downloader

---

## 3) API Base and Auth

- Base URL: `https://<your-domain>/api`
- JSON auth: `Authorization: Bearer <access_token>`
- JWT token endpoints:
  - `POST /api/token/`
  - `POST /api/token/refresh/`

---

## 4) Endpoint Catalog (Mobile-safe)

Notes:
- All endpoints below are from current backend route configuration.
- Admin-only routes are intentionally excluded.
- For DRF `ViewSet` routes, standard REST endpoints are included where applicable.

## 4.1 Users/Auth/Profile
- `POST /api/users/register/` — customer registration
- `POST /api/users/request-otp/` — request OTP
- `POST /api/users/login-otp/` — verify OTP + login
- `POST /api/users/login-password/` — login with password
- `POST /api/users/google-login/` — Google login
- `POST /api/users/forgot-password/` — forgot password request OTP
- `POST /api/users/forgot-password/verify-otp/` — verify reset OTP
- `POST /api/users/forgot-password/reset/` — set new password
- `GET /api/users/profile/` — get current user
- `PATCH /api/users/profile/` — update profile
- `PUT /api/users/profile/` — full profile update
- `DELETE /api/users/profile/` — self account delete
- `POST /api/users/contact/` — contact form
- `GET /api/users/site-content/` — public CMS content

## 4.2 Pandits
- `GET /api/pandits/` — list pandits
- `GET /api/pandits/{id}/` — pandit detail
- `PATCH /api/pandits/{id}/` — pandit profile update (owner/admin as allowed)
- `DELETE /api/pandits/{id}/` — pandit self-delete/admin delete (per backend rules)
- `GET /api/pandits/{id}/profile/` — extra profile endpoint
- `POST /api/pandits/register/` — pandit registration
- `GET /api/pandits/services/catalog/` — puja catalog for pandit services
- `GET /api/pandits/dashboard/stats/` — pandit dashboard stats
- `POST /api/pandits/dashboard/toggle-availability/` — availability toggle
- `GET /api/pandits/wallet/` — pandit wallet
- `GET /api/pandits/withdrawals/` — withdrawal history
- `POST /api/pandits/withdrawal/request/` — request withdrawal

### Pandit Services (my-services ViewSet)
- `GET /api/pandits/my-services/`
- `POST /api/pandits/my-services/`
- `GET /api/pandits/my-services/{id}/`
- `PATCH /api/pandits/my-services/{id}/`
- `DELETE /api/pandits/my-services/{id}/`

### Pandit Calendar
- `GET /api/pandits/me/calendar/`
- `POST /api/pandits/me/calendar/`
- `DELETE /api/pandits/me/calendar/blocks/{block_id}/`

## 4.3 Services (Puja)
- `GET /api/services/` — list pujas
- `POST /api/services/` — create puja (normally admin/staff usage)
- `GET /api/services/{id}/` — puja detail
- `PATCH /api/services/{id}/`
- `DELETE /api/services/{id}/`
- `GET /api/services/categories/` — puja categories

## 4.4 Bookings
### Booking ViewSet standard
- `GET /api/bookings/`
- `POST /api/bookings/`
- `GET /api/bookings/{id}/`
- `PATCH /api/bookings/{id}/`
- `DELETE /api/bookings/{id}/`

### Booking custom actions
- `PATCH /api/bookings/{id}/update_status/`
- `PATCH /api/bookings/{id}/cancel/`
- `POST /api/bookings/{id}/admin_cancel/` (admin behavior route exists; avoid in mobile)
- `GET /api/bookings/my_bookings/`
- `GET /api/bookings/available_slots/?pandit_id=&date=&service_id=`
- `GET /api/bookings/{id}/invoice/`

## 4.5 Reviews
- `POST /api/reviews/create/` — create booking review
- `GET /api/reviews/pandit-reviews/` — recent pandit reviews
- `GET /api/reviews/site-reviews/` — site reviews list
- `POST /api/reviews/site-reviews/` — submit site review
- `GET /api/reviews/my-reviews/` — customer’s reviews
- `GET /api/reviews/pandit/my-reviews/` — pandit received reviews

## 4.6 Samagri + Shop + Wishlist
### Samagri categories/items/requirements
- `GET /api/samagri/categories/`
- `GET /api/samagri/items/`
- `GET /api/samagri/requirements/`

(creation/update/deletion routes exist but generally admin-side; do not expose in customer mobile UX)

### AI recommendation (legacy + enhanced)
- `POST /api/samagri/ai_recommend/` — legacy AI recommendation

### Shop checkout (checkout ViewSet + actions)
- `POST /api/samagri/checkout/initiate/`
- `GET /api/samagri/checkout/my-orders/`
- `GET /api/samagri/checkout/{id}/detail/`
- `GET /api/samagri/checkout/{id}/invoice/`

### Wishlist (wishlist ViewSet + actions)
- `GET /api/samagri/wishlist/`
- `POST /api/samagri/wishlist/add/`
- `DELETE /api/samagri/wishlist/remove/{item_id}/`
- `GET /api/samagri/wishlist/check/{item_id}/`
- `POST /api/samagri/wishlist/toggle/`

## 4.7 Recommender (non-admin usable subset)
- `GET /api/recommender/recommendations/by_puja/?puja_id=&limit=&min_confidence=`
- `GET /api/recommender/recommendations/personalized/?puja_id=&limit=`
- `GET /api/recommender/recommendations/seasonal/?puja_id=&limit=`
- `GET /api/recommender/recommendations/stats/?puja_id=&days=`

### Booking samagri recommendation flow
- `GET /api/recommender/bookings/{booking_id}/samagri/`
- `POST /api/recommender/bookings/{booking_id}/samagri/recommendations/`
- `POST /api/recommender/bookings/{booking_id}/samagri/auto-add/`
- `POST /api/recommender/bookings/{booking_id}/samagri/add-item/`

### User preferences
- `GET /api/recommender/user/preferences/`
- `POST /api/recommender/user/preferences/`
- `PATCH /api/recommender/user/preferences/{id}/`
- `DELETE /api/recommender/user/preferences/{id}/`
- `GET /api/recommender/user/preferences/insights/`

## 4.8 AI Guide + AI Puja Samagri
- `POST /api/ai/chat/` — unified AI guide chat
- `POST /api/ai/puja-samagri/` — puja-specific samagri response (pattern-guarded)
- `GET /api/ai/guide/` — guide info endpoint

## 4.9 Chat
- `GET /api/chat/rooms/`
- `GET /api/chat/rooms/{id}/`
- `GET /api/chat/rooms/{room_id}/messages/`
- `POST /api/chat/rooms/{room_id}/messages/`
- `POST /api/chat/messages/{id}/mark-read/`
- `POST /api/chat/rooms/initiate/` — initiate pre-booking/booking room
- `POST /api/chat/quick-chat/` — quick AI guide fallback chat
- `GET /api/chat/history/`

### Chat WebSocket
- `ws(s)://<host>/ws/chat/{roomId}/?token=<jwt>`

## 4.10 Payments
- `POST /api/payments/create/`
- `POST /api/payments/initiate/`
- `GET /api/payments/check-status/{booking_id}/`
- `GET /api/payments/exchange-rate/`
- `GET /api/payments/khalti/verify/` (query params from gateway)
- `GET /api/payments/esewa/verify/` (query params from gateway)

(Refund and admin payout endpoints exist but excluded from mobile scope.)

## 4.11 Video
- `GET /api/video/room/{booking_id}/`
- `POST /api/video/create-token/`
- `POST /api/video/generate-link/{booking_id}/`
- `POST /api/video/room/{booking_id}/join/`

## 4.12 Kundali
- `POST /api/kundali/generate/`
- `GET /api/kundali/list/`
- `GET /api/kundali/public-stats/`

## 4.13 Panchang
- `GET /api/panchang/data/` (date/location params if provided)

## 4.14 Notifications
- `GET /api/notifications/`
- `GET /api/notifications/{id}/`
- `PATCH /api/notifications/{id}/` (mark read, etc.)
- `DELETE /api/notifications/{id}/`
- `POST /api/notifications/mark-all-read/`

---

## 5) Mobile Navigation Blueprint (No Admin)

## 5.1 Bottom Tabs (Customer)
- Home
- Pandits
- Bookings
- Shop
- Profile

## 5.2 Bottom Tabs (Pandit)
- Dashboard
- Bookings
- Services
- Messages
- Profile

## 5.3 Common Stack
- Auth stack
- Booking flow stack
- Payment flow stack
- Chat room
- Video room
- AI Guide modal/page

---

## 6) Integration Notes for React Native

- Reuse same bearer token strategy as web.
- For file/image upload use `multipart/form-data`.
- Maintain unified cart locally (and sync with checkout payload).
- Chat/Video require robust reconnection handling.
- Use endpoint wrappers (like web `src/lib/api.ts`) in a dedicated RN API layer.

---

## 7) Admin Endpoints Explicitly Excluded in Mobile

Do not include routes under:
- `/api/admin/*`
- `/api/users/admin/*`
- `/api/pandits/admin/*`
- `/api/payments/admin/*`
- `/api/reviews/admin-reviews/`

---

## 8) Suggested Build Order

1. Auth + profile
2. Pandit discovery + profile
3. Booking + payment + my bookings
4. Shop + wishlist + checkout + orders
5. Chat + notifications
6. Video puja
7. Kundali + panchang
8. AI guide + puja-samagri

---

If you want, next step I can generate a second doc with exact React Native folder structure, API client modules, DTO types, and Redux/Zustand store slices for these endpoints.
