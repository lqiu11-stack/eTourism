# EH-05 Backend Implementation Summary

## Feature
EH-05: Booking Preferences for eHost

As an eHost, the host can configure booking preference rules so that bookings follow host comfort and safety expectations.

## Scope and Constraints Followed
- Frontend was not changed.
- No new database table was created.
- Existing `experiences.gender_preference` column is reused for booking preference.
- Existing `experiences.max_visitors` is reused for group size limit.
- Backend logic is implemented in existing controller and route files.

## What Was Implemented

### 1) eHost can configure and read booking preferences
- Added `GET /api/ehost/experiences/:id/booking-preferences`.
- Added `PATCH /api/ehost/experiences/:id/booking-preferences`.
- Preferences currently supported:
  - `gender_preference`
  - `max_visitors`
- Response also includes:
  - booking cutoff rule (`before_experience_start`)
  - cancellation policy (14+ days: 100%, 7-13 days: 50%, below 7 days: 0%)

### 2) Gender preference normalization and validation
- Added canonical values:
  - `any`
  - `female_only`
  - `male_only`
  - `no_all_male_groups`
  - `no_all_female_groups`
- Added alias normalization (for example, `women_only` -> `female_only`).
- Invalid values are rejected with `400`.

### 3) Preferences are enforced during visitor booking
- Updated `POST /api/visitor/bookings` with additional rule checks:
  - `qty_normal` and `qty_discounted` must be non-negative integers.
  - Total tickets must be greater than 0.
  - Total tickets must not exceed `experience.max_visitors`.
  - Booking is rejected if the experience has already started.
  - If `gender_preference` is restricted (not `any`), request must provide group gender information.
- Supported group gender input from request:
  - `group_gender_type`: `all_male` | `all_female` | `mixed`
  - or `group_gender_profile`:
    - `male_count`
    - `female_count`
    - `other_count`

## Important Data Note
- The current `users` table has no gender column.
- Therefore, EH-05 restriction is enforced using group gender information submitted in booking request payload.
- If user-profile-based gender matching is required later, a new user column can be added and backend rules can be upgraded accordingly.

## Updated Files
- `eTourism/backend/controllers/ehostController.js`
  - Added booking preference read/update handlers.
  - Added gender preference normalization and validation.
  - Extended experience update to support `max_visitors` updates in the same flow.
- `eTourism/backend/routes/ehost.js`
  - Added:
    - `GET /experiences/:id/booking-preferences`
    - `PATCH /experiences/:id/booking-preferences`
- `eTourism/backend/controllers/visitorController.js`
  - Added preference enforcement in booking creation.
  - Added group gender parsing and validation logic.
- `eTourism/backend/tests/ehostController.test.js`
  - Added tests for preference read/update and invalid preference value.
- `eTourism/backend/tests/visitorController.test.js`
  - Added tests for quantity validation, booking cutoff, and preference restriction behavior.

## API Examples

### Update booking preferences
`PATCH /api/ehost/experiences/10/booking-preferences`

Request body:
```json
{
  "gender_preference": "no_all_male_groups",
  "max_visitors": 6
}
```

### Get booking preferences
`GET /api/ehost/experiences/10/booking-preferences`

### Create booking with group gender type
`POST /api/visitor/bookings`

Request body:
```json
{
  "experience_id": 10,
  "qty_normal": 2,
  "qty_discounted": 0,
  "contact_name": "Alice",
  "contact_email": "alice@example.com",
  "agreed_to_terms": true,
  "group_gender_type": "mixed"
}
```

## Test Verification
- Command executed:
  - `node --test tests/ehostController.test.js tests/visitorController.test.js`
- Result:
  - 89 passed
  - 0 failed

## Notes
- This implementation keeps compatibility with existing schema and routes.
- No frontend contract was changed in this task.
