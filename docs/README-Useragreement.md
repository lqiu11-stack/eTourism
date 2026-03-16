# User Agreement — Feature Documentation

This document describes the **User Agreement** feature in the eTourism project: APIs, backend and frontend flows, and the structure of the agreement content.

---

## 1. Overview

- **Agreement required before registration**: Visitors must read the user agreement and click **Accept All** before they can complete registration; registration cannot proceed without acceptance.
- **Display and recording**: The registration flow fetches the agreement title and body from the backend and displays them. After the user accepts, registration is completed and an acceptance record may be stored in the backend (e.g. for audit).
- **Refusing the agreement**: The user may choose **Refuse All**; no registration request is sent, and the frontend only shows that the agreement must be accepted to register.

---

## 2. Backend

### 2.1 Routes and mounting

- Route file: `eTourism/backend/routes/agreements.js`
- Mounted in `eTourism/backend/routes/index.js` as: `router.use('/agreements', agreementsRoutes)`
- Base path (under `/api`): `/api/agreements`

### 2.2 API reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/agreements` | Fetch the current user agreement title and body (no auth required) |
| POST | `/api/agreements/accept` | Record that a user has accepted the agreement (requires the registered user’s `userId`) |

**GET /api/agreements**

- Response body: `{ title: string, content: string }`
- `title`: Agreement title (e.g. "eTourism User Agreement & Terms of Service")
- `content`: Full agreement text; plain text, suitable for frontend layout and line breaks

**POST /api/agreements/accept**

- Request body: `{ userId: number }`
- Validation: `userId` must be a positive integer and the user must exist
- Success: Inserts a row into `user_agreements`, returns 201 and `{ message, record }`
- Failure: 400 (invalid parameter or user not found) or 500 (server error)

### 2.3 Controller and model

- **Controller**: `eTourism/backend/controllers/agreementController.js`
  - `getAgreement`: Returns `AGREEMENT_TITLE` and `AGREEMENT_CONTENT` (see “Agreement content structure” below)
  - `acceptAgreement`: Validates `userId`, checks user exists, then calls `AgreementAcceptance.create(userId)` to persist
- **Model**: `eTourism/backend/models/AgreementAcceptance.js`
  - `create(user_id)`: Inserts into `user_agreements` with `(user_id)`, returns `id`, `user_id`, `agreed_at`

### 2.4 Registration and mandatory agreement check

- Registration endpoint: `POST /api/auth/register`
- Controller: `register` in `eTourism/backend/controllers/authController.js`
- Request body must include: `email`, `password`, `name`, `date_of_birth`, and **`agreeTerms`**
- **Rule**: Registration continues only when `agreeTerms === true`; otherwise the API returns **400** with:
  - `{ error: "You must agree to the user agreement to register" }`
- The frontend should send `agreeTerms: true` only after the user clicks **Accept All**.

### 2.5 Database schema

- Table: `user_agreements`
- Schema script: `eTourism/backend/database/user_agreements.sql`

```sql
CREATE TABLE IF NOT EXISTS user_agreements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  agreed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

- Run this script at least once when deploying (e.g. `psql $DATABASE_URL -f eTourism/backend/database/user_agreements.sql`); otherwise `POST /api/agreements/accept` will fail.

---

## 3. Frontend

### 3.1 Entry and flow

- Page: `eTourism/client/src/Pages/Login/LoginPage.jsx`
- The login page provides a “Don't have an account? Register” link; clicking it switches to the **registration form** view.

### 3.2 Two-step flow

1. **Step 1 — Registration form**
   - Fields: Email, Password, Name, Date of birth
   - On **Continue**, the frontend validates required fields, then calls **GET /api/agreements** for `title` and `content`
   - It does **not** call `POST /api/auth/register` at this step
   - After the agreement is loaded, the view switches to **agreement display**

2. **Step 2 — Agreement display**
   - Shows the returned `title` and `content` in a scrollable area
   - Two buttons:
     - **Accept All**: Calls **POST /api/auth/register** with `email`, `password`, `name`, `date_of_birth`, and `agreeTerms: true`; on success, may call **POST /api/agreements/accept** with `userId` to record acceptance; then stores token/user and redirects (e.g. to `/Mainpage`)
     - **Refuse All**: Does not call register; sets the error message to “You must accept the user agreement to register.” and stays on the agreement step

### 3.3 Errors and styling

- On registration or agreement API failure, the UI shows the backend `error` or `message` (e.g. under the form) using the `.error-text` class
- Agreement UI uses `.agreement-content`, `.agreement-buttons`, `.refuse-btn`, etc., defined in `eTourism/client/src/Pages/Login/style.css`

### 3.4 API base path

- The frontend uses `import.meta.env.VITE_API_BASE || "/api"` as the API base
- So:
  - Agreement content: `GET ${API_BASE}/agreements`
  - Record acceptance: `POST ${API_BASE}/agreements/accept`
  - Register: `POST ${API_BASE}/auth/register`

---

## 4. Agreement content structure

The agreement title and body are defined in `eTourism/backend/controllers/agreementController.js`:

- **Title**: `eTourism User Agreement & Terms of Service`
- **Body**: **14 sections**, aligned with eTourism (experience booking, E-host listings, payments and refunds, recording and privacy, etc.). Summary:

| § | Title | Summary |
|---|--------|---------|
| 1 | Acceptance of Terms | Registering or using the platform means accepting this agreement; otherwise you may not use or register |
| 2 | Eligibility | Must be 18+; Visitor / E-host roles and compliance with local law |
| 3 | Account Registration and Security | Accurate info, password security, one account per person, notify us of misuse |
| 4 | Use as a Visitor (Booking Experiences) | Payment and pricing, confirmations and meeting links, cancellation/reschedule and refund per booking policy |
| 5 | Use as an E-host (Hosting Experiences) | Accurate listings, compliance, no discrimination; separate E-host terms or verification may apply |
| 6 | Conduct During Live Experiences | Follow E-host’s reasonable instructions; no harassment or illegal conduct; recording for quality and disputes; participation implies consent |
| 7 | Payments and Fees | Valid payment method, currency, third-party processors (e.g. Stripe), pricing and corrections |
| 8 | Privacy and Personal Data | Processing per privacy policy; recordings may include image/voice and their use |
| 9 | Prohibited Conduct | No illegal use, impersonation, platform interference, scraping/misuse, or payment circumvention; violations may lead to account suspension |
| 10 | Intellectual Property | Platform ownership; user content licensed for use |
| 11 | Disclaimer and Limitation of Liability | “As is” service, liability caps, etc. |
| 12 | Disputes and Governing Law | Dispute resolution and governing law |
| 13 | Changes to This Agreement | How we notify of changes; continued use means acceptance |
| 14 | General | Severability, no waiver, entire agreement |

The full text is in English and matches eTourism’s booking, payment, refund, E-host/Visitor, and recording behaviour. To change the agreement, edit `AGREEMENT_TITLE` and `AGREEMENT_CONTENT` in `agreementController.js`; the API contract stays the same.

---

## 5. Deployment checklist

1. **Database**: Run `user_agreements.sql` so the `user_agreements` table exists.
2. **Backend**: `/api/agreements` and `/api/agreements/accept` are mounted; `POST /api/auth/register` enforces `agreeTerms === true`.
3. **Frontend**: `VITE_API_BASE` points to the correct API root (or use default `/api` and ensure proxy/same-origin is correct).
4. **Flow**: Register → fill form → show agreement → only **Accept All** completes registration; **Refuse All** only shows an error and does not call the register API.

This completes the documentation for the user agreement feature. If you add multi-language support, versioning, or history of acceptances, extend this document with the new endpoints and schema.
