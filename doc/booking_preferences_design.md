# Booking Preferences (EH-05) Design

## Goals and Scope

### Goals
- Allow an eHost to configure booking rules to feel safe and comfortable during an experience.
- Support preference settings for:
  - Minimum advance booking time (e.g., must book at least N hours before start).
  - Minimum and maximum participant count per booking.
  - Cancellation policy (used for display and refund eligibility calculation).
  - Visitor group composition restrictions (e.g., reject all-male groups).
- Apply saved preferences automatically during booking creation so the system blocks non-compliant bookings.

### Out of Scope
- Retroactively re-validating or cancelling existing bookings when preferences change.
- Admin tooling for reviewing/overriding preference configurations.
- Full visitor booking UI redesign (the current visitor client has limited booking-creation UX).

## Assumptions (Explicit)
- Preferences are configured per experience (not global per eHost). This matches the existing “per experience” configuration pattern used by meeting links.
- If an experience has no saved preferences, the system applies safe defaults (no notice requirement, min=1, max=experience.max_visitors, default cancellation tiers).
- Group composition restrictions require the visitor to provide simple gender-count breakdown for the booking group (privacy-preserving counts, no per-guest PII).

## Database Design

### Table: experience_booking_preferences
Stores a single booking preference configuration per experience (1:1).

Columns:
- `id`: primary key
- `experience_id`: foreign key to `experiences.id` with a unique constraint (1:1)
- `min_notice_minutes`: integer, default 0
- `min_group_size`: integer, default 1
- `max_group_size`: integer, nullable (defaults to `experiences.max_visitors` when null)
- `group_rule`: restriction enum (see below)
- `cancellation_policy`: JSON policy definition (see below)
- `created_at / updated_at`: audit timestamps

`group_rule` values (initial set):
- `any` (default)
- `no_all_male_groups`

`cancellation_policy` JSON (initial shape):
- `type`: `tiered_refund_v1`
- `tiers`: ordered rules, evaluated by `days_before_event`:
  - `{ min_days: 14, refund_pct: 100 }`
  - `{ min_days: 7, refund_pct: 50 }`
  - `{ min_days: 0, refund_pct: 0 }`

### Booking-side fields (to enforce group rules and preserve policy at purchase time)
To enforce `group_rule`, bookings need to carry a booking-time group composition summary. To avoid policy changes affecting past bookings, store a snapshot of the cancellation policy used at booking time.

Add to `bookings`:
- `group_gender_breakdown`: JSON (or JSONB) storing counts, e.g. `{ male: 2, female: 1, other: 0, unspecified: 0 }`
- `cancellation_policy_snapshot`: JSON (or JSONB) copied from preferences at booking creation time

Migration script:
- Create a new PostgreSQL migration file in `doc/` similar to the meeting link migration style.
  - Example reference: `20260311_meeting_link_configuration.sql`

## Backend Design

### Authentication and Authorization
- Authentication: `Authorization: Bearer <JWT>`
- Authorization:
  - eHost endpoints: `requireRole('ehost')`
  - visitor endpoints: `requireRole('visitor')`
- Experience ownership is enforced by checking `experiences.ehost_id = req.userId` before allowing writes.

### Model Layer
Create a new model, following the established meeting link pattern:
- `ExperienceBookingPreference.findByExperienceId(experienceId)`
- `ExperienceBookingPreference.upsertByExperienceId({ experience_id, ...fields })`

### API Design

#### 1) eHost: Get booking preferences for an experience
- Method: `GET`
- Path: `/api/ehost/experiences/:id/booking-preferences`
- Auth: eHost
- Response:
  - `{ success: true, data: null }` (not configured)
  - `{ success: true, data: { min_notice_minutes, min_group_size, max_group_size, group_rule, cancellation_policy, ... } }`

Rules:
- 404 if the experience does not exist or is not owned by the eHost.

#### 2) eHost: Save (upsert) booking preferences for an experience
- Method: `PUT`
- Path: `/api/ehost/experiences/:id/booking-preferences`
- Auth: eHost
- Body (all optional, defaults applied server-side):
  - `min_notice_minutes`
  - `min_group_size`
  - `max_group_size`
  - `group_rule`
  - `cancellation_policy`

Validation:
- `min_notice_minutes >= 0`
- `min_group_size >= 1`
- `max_group_size` is null or `>= min_group_size`
- `group_rule` must be one of the supported enums
- `cancellation_policy` must match supported schema (`tiered_refund_v1`)

Constraints:
- Only upcoming experiences are allowed to be configured (consistent with meeting link behavior).

Response:
- `{ success: true, data: {...} }`

#### 3) visitor: Booking creation enforcement (existing endpoint)
- Method: `POST`
- Path: `/api/visitor/bookings`
- Auth: visitor

Additions to request body:
- `group_gender_breakdown` (required when the experience has `group_rule !== 'any'`)
  - `{ male: number, female: number, other: number, unspecified: number }`

Enforcement logic:
- Load the experience and its preferences (if any).
- Compute `totalTickets = qty_normal + qty_discounted`.
- Validate against:
  - Capacity: `totalTickets <= experience.max_visitors` (existing)
  - Group size bounds: `min_group_size <= totalTickets <= max_group_size`
  - Minimum notice: `experience.date_time - now >= min_notice_minutes`
  - Group composition rule:
    - `no_all_male_groups`: require `female + other + unspecified >= 1` (i.e., not all participants are male)
- Persist:
  - `group_gender_breakdown` on booking (when provided)
  - `cancellation_policy_snapshot` copied from the preferences (or defaults) so refunds use the policy active at booking time

### Refund Calculation (Cancellation Policy)
Update refund decision logic to use `booking.cancellation_policy_snapshot` when available:
- Determine `days_before_event`
- Evaluate refund percentage via tier matching
- Record refunds consistently with existing refund storage

This keeps refund outcomes stable even if the eHost changes preferences later.

## Frontend Design

### eHost: Booking Preferences Configuration page
- Route: `/ehost/booking-preferences`
- Capabilities:
  - Load eHost experiences (`GET /api/ehost/experiences`)
  - Load existing preferences (`GET /api/ehost/experiences/:id/booking-preferences`)
  - Save preference settings (`PUT /api/ehost/experiences/:id/booking-preferences`)
- Form fields (initial):
  - Minimum advance booking time (minutes/hours selector stored as minutes)
  - Minimum group size
  - Maximum group size
  - Group restriction dropdown: Any / Reject all-male groups
  - Cancellation policy selector (initially pre-defined templates based on supported policy types)

Implementation pattern:
- Mirror the UI structure used by the meeting link configuration page so behavior is consistent across eHost tools.

### visitor: Booking flow (incremental)
The current visitor client does not visibly implement booking creation via the backend API. When/if booking UI is wired:
- Display cancellation policy for the selected experience (read-only).
- If `group_rule !== 'any'`, request group gender breakdown counts before submitting the booking.
- Surface validation failures from the backend as user-friendly messages (e.g., “This experience requires bookings at least 12 hours before start.”).

## Mapping to the Use Case
- “eHost can set booking preferences” → eHost GET/PUT booking-preferences API + configuration page
- “Preferences limit visitor groups (e.g. reject all-male groups)” → `group_rule` + booking-time `group_gender_breakdown`
- “Saved preferences restrict bookings automatically” → server-side enforcement in `POST /api/visitor/bookings`

## Runtime Configuration
- No new environment variables required (policy stored in DB).
- Backend continues to require `DATABASE_URL` and `JWT_SECRET`.
