# Meeting Link Configuration Design

## Goals and Scope

### Goals
- Allow an eHost to configure a meeting link template (platform, URL, optional password) for an upcoming experience.
- Suggest common platforms in the UI (Google Meet, Zoom, WhatsApp, Other).
- Only expose the meeting link to visitors who have successfully booked (enforced via booking status `confirmed`).

### Out of Scope
- Creating meetings via third-party APIs (OAuth / auto-provisioning).
- Sending meeting links via email/SMS notifications.
- Refactoring the existing booking/payment workflow (this feature relies on the existing status field).

## Database Design

### Table: experience_meeting_links
Stores a single meeting link template per experience (1:1). A single experience typically shares the same meeting link for all confirmed visitors.

Columns:
- `id`: primary key
- `experience_id`: foreign key to `experiences.id` with a unique constraint (1:1)
- `platform`: platform name (customizable)
- `meeting_url`: meeting URL
- `meeting_password`: optional password
- `created_at / updated_at`: audit timestamps

Migration script:
- [20260311_meeting_link_configuration.sql](20260311_meeting_link_configuration.sql)

## Backend Design

### Authentication and Authorization
JWT payload already includes `role`. This implementation passes `role` through to `req.userRole` in the auth middleware and adds `requireRole()` for route-level authorization.

- Authentication: `Authorization: Bearer <JWT>`
- Authorization:
  - eHost endpoints: `requireRole('ehost')`
  - visitor endpoints: `requireRole('visitor')`

Relevant file:
- [auth.js](eTourism/backend/middleware/auth.js)

### API Design

#### 1) eHost: Get meeting link configuration for an experience
- Method: `GET`
- Path: `/api/ehost/experiences/:id/meeting-link`
- Auth: eHost
- Response:
  - `{ success: true, data: null }` (not configured)
  - `{ success: true, data: { platform, meeting_url, meeting_password, ... } }`

Implementation:
- [getExperienceMeetingLink](eTourism/backend/controllers/ehostController.js)
- [ehost.js](eTourism/backend/routes/ehost.js)

#### 2) eHost: Save (upsert) meeting link configuration for an experience
- Method: `PUT`
- Path: `/api/ehost/experiences/:id/meeting-link`
- Auth: eHost
- Body:
  - `platform` (required)
  - `meeting_url` (required)
  - `meeting_password` (optional)
- Constraints:
  - Only upcoming experiences are allowed (`experience.date_time > now()`).
- Response: `{ success: true, data: {...} }`

Implementation:
- [ExperienceMeetingLink.upsertByExperienceId](eTourism/backend/models/ExperienceMeetingLink.js)
- [upsertExperienceMeetingLink](eTourism/backend/controllers/ehostController.js)

#### 3) visitor: Get meeting link for a booking (only for confirmed bookings)
- Method: `GET`
- Path: `/api/visitor/bookings/:id/meeting-link`
- Auth: visitor
- Rules:
  - Must be the booking owner (`booking.visitor_id === req.userId`)
  - Must be successfully booked (`booking.status === 'confirmed'`)
  - Return 404 if the eHost has not configured the meeting link yet
- Response:
  - `{ platform, meeting_url, meeting_password }`

Implementation:
- [getBookingMeetingLink](eTourism/backend/controllers/visitorController.js)
- [visitor.js](eTourism/backend/routes/visitor.js)

## Frontend Design

### eHost: Meeting Link Configuration page
- Route: `/ehost/meeting-links`
- Capabilities:
  - Load eHost experiences (`GET /api/ehost/experiences`)
  - Load existing meeting link configuration (`GET /api/ehost/experiences/:id/meeting-link`)
  - Save platform/URL/password (`PUT /api/ehost/experiences/:id/meeting-link`)
  - Platform dropdown with suggestions (Google Meet / Zoom / WhatsApp / Other)

Implementation:
- [EhostMeetingLinks.jsx](eTourism/client/src/Pages/MeetingLinks/EhostMeetingLinks.jsx)

### visitor: Booking list and booking detail
- List route: `/visitor/bookings`
- Detail route: `/visitor/bookings/:id`
- Meeting link rendering:
  - Calls `GET /api/visitor/bookings/:id/meeting-link`
  - 403: show an informational message indicating the link is only available after a successful booking
  - 404: show an informational message indicating the link is not configured yet

Implementation:
- [VisitorBookings.jsx](eTourism/client/src/Pages/Bookings/VisitorBookings.jsx)
- [VisitorBookingDetail.jsx](eTourism/client/src/Pages/Bookings/VisitorBookingDetail.jsx)

### Login and Token storage
- Uses the existing login page `/` and integrates with `POST /api/auth/login` (email/password).
- Stores the token in `localStorage.authToken`, then routes by `user.role`:
  - `ehost` → `/ehost/meeting-links`
  - otherwise (default visitor) → `/visitor/bookings`

Implementation:
- [LoginPage.jsx](eTourism/client/src/Pages/Login/LoginPage.jsx)
- [apiClient.js](eTourism/client/src/api/apiClient.js)

## Mapping to the Use Case
- “eHost can input and save a link” → eHost upsert API + configuration page
- “suggests services such as Google Meet, Zoom, or WhatsApp” → platform dropdown suggestions
- “only shared with visitors who have successfully booked” → visitor meeting-link API enforces `booking.status === 'confirmed'`

## Runtime Configuration
- Frontend uses `VITE_API_BASE_URL` to point to the backend API (defaults to `http://localhost:5000/api`).
- Backend requires `DATABASE_URL` and `JWT_SECRET` (and payment-related env vars if the payment flow is used).

