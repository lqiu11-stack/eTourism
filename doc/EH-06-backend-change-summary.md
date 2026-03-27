# EH-06 Backend Implementation Summary

## Feature
EH-06: Available Calendar for eHost

As an eHost, the host can manage available booking dates and daily time slots so visitors can only book when the host is free.

## Scope and Constraints Followed
- Frontend was not changed.
- No new database table was created.
- Existing `experiences.date_time` is reused as the slot start time.
- Existing `experiences.duration_minutes` is reused as the slot duration.
- Backend logic is implemented in existing controller and route files.

## Design Under Existing Schema
- The current schema does not provide a separate calendar/slot table.
- Under the “simple way” requirement, each experience record represents one schedulable slot.
- Slot management is implemented by updating/clearing `date_time` and updating `duration_minutes` on existing experiences.
- Batch unavailable dates are processed by clearing matching experience slots (`date_time = NULL`) when there are no active bookings.

## What Was Implemented

### 1) eHost can add, edit, and delete available time slots
- Added `GET /api/ehost/calendar/slots` to list current slots.
  - Supports optional query filters:
    - `from_date`
    - `to_date`
- Added `POST /api/ehost/calendar/slots` to assign a slot to an experience.
- Added `PUT /api/ehost/calendar/slots/:id` to update slot start time and duration.
- Added `DELETE /api/ehost/calendar/slots/:id` to remove an existing slot (`date_time` is cleared).

### 2) Batch set unavailable dates
- Added `POST /api/ehost/calendar/unavailable-dates`.
- Request body accepts:
  - `unavailable_dates` (array of `YYYY-MM-DD`)
- For the requested dates:
  - Slots with active bookings (`confirmed` or `pending`) are preserved and returned as blocked.
  - Slots without active bookings are cleared.

### 3) System prevents overlapping time slots
- Overlap validation is added when creating/updating slots.
- For the same eHost, a new slot is rejected if time range overlaps with any existing non-deleted slot.
- Overlap response:
  - HTTP `409`
  - conflict slot info in response payload.

### 4) Visitors can only book available slots
- `POST /api/visitor/bookings` now rejects booking when:
  - Experience status is not available for booking (`status !== approved`).
  - Experience has no assigned slot (`date_time` is `NULL`).
- Existing “already started” validation remains in place.

## Updated Files
- `eTourism/backend/controllers/ehostController.js`
  - Added calendar slot helpers and handlers:
    - `getCalendarSlots`
    - `createCalendarSlot`
    - `updateCalendarSlot`
    - `deleteCalendarSlot`
    - `setUnavailableDates`
  - Added overlap check and date/duration validation.
- `eTourism/backend/routes/ehost.js`
  - Added:
    - `GET /calendar/slots`
    - `POST /calendar/slots`
    - `PUT /calendar/slots/:id`
    - `DELETE /calendar/slots/:id`
    - `POST /calendar/unavailable-dates`
- `eTourism/backend/controllers/visitorController.js`
  - Added slot availability checks in `createBooking`.
- `eTourism/backend/tests/ehostController.test.js`
  - Added tests for:
    - slot list
    - slot create/update
    - overlap rejection
    - slot delete protection with active bookings
    - batch unavailable date processing
- `eTourism/backend/tests/visitorController.test.js`
  - Added tests for:
    - rejecting booking on unavailable slot status
    - rejecting booking when no slot is assigned

## API Examples

### Create/assign a slot
`POST /api/ehost/calendar/slots`

Request body:
```json
{
  "experience_id": 10,
  "date_time": "2026-07-01T10:00:00.000Z",
  "duration_minutes": 90
}
```

### Update a slot
`PUT /api/ehost/calendar/slots/10`

Request body:
```json
{
  "date_time": "2026-07-01T13:00:00.000Z",
  "duration_minutes": 60
}
```

### Batch set unavailable dates
`POST /api/ehost/calendar/unavailable-dates`

Request body:
```json
{
  "unavailable_dates": ["2026-07-01", "2026-07-02"]
}
```

### List slots in date range
`GET /api/ehost/calendar/slots?from_date=2026-07-01T00:00:00.000Z&to_date=2026-07-31T23:59:59.000Z`

## Test Verification
- Command executed:
  - `node --test tests/ehostController.test.js tests/visitorController.test.js`
- Result:
  - 101 passed
  - 0 failed

## Notes
- This implementation follows the “no new table” requirement and keeps compatibility with current schema.
- Because there is no dedicated calendar table, EH-06 works in a single-slot-per-experience model.
