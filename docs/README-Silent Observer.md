# README – Silent Observer (Visitor experience browsing)

This document describes the update that allows **unauthenticated** (silent) visitors to browse experience content: list all experiences and view a single experience’s details. No login or JWT is required for these two endpoints.

---

## What changed

### 1. Public visitor experience APIs

Two existing visitor routes were made **public** by removing the `requireAuth` middleware:

| Endpoint | Method | Auth required | Description |
|----------|--------|----------------|-------------|
| `/api/visitor/experiences` | GET | **No** | Return all experiences (list). |
| `/api/visitor/experiences/:id` | GET | **No** | Return one experience by id (detail). |

All other visitor routes (bookings, payments, reviews, reschedule, refund, `/me`) still use `requireAuth` and require a valid JWT.

### 2. Files touched

- **`eTourism/backend/routes/visitor.js`**  
  - `router.get('/experiences', getExperiences);` — no `requireAuth`.  
  - `router.get('/experiences/:id', getExperienceById);` — no `requireAuth`.  
  - All other routes unchanged (still protected).

- **`eTourism/backend/controllers/visitorController.js`**  
  - No logic change.  
  - `getExperiences` calls `Experience.findAll({})` and returns JSON; on error returns 500.  
  - `getExperienceById` calls `Experience.findById(id)`; if not found returns 404, else 200 with the experience; on server/DB error returns 500.

### 3. Behaviour summary

- **Data source**: Both endpoints read from the **Experience** model (PostgreSQL `experiences` table).  
- **Response format**: JSON.  
- **Errors**:  
  - 404 when the experience id does not exist (GET by id only).  
  - 500 on server or database errors (with `message` and optional `error` in the body).

---

## How to call (no auth)

Base URL example: `http://localhost:5000/api` (or your backend base).

- **List all experiences**  
  `GET /api/visitor/experiences`  
  No headers required. Response: array of experience objects.

- **Get one experience**  
  `GET /api/visitor/experiences/:id`  
  No headers required. Response: single experience object, or 404 if not found.

---

## Booking and payment (unchanged)

Creating bookings, viewing bookings, rescheduling, refunds, and all payment endpoints still **require login** (JWT in `Authorization: Bearer <token>`). Unauthenticated requests to those routes receive **401**. This was verified by tests and an HTTP check.

---

*This update is referred to as “Silent Observer” because visitors can observe (browse) experience content without signing in.*
