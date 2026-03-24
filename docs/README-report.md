# User Feedback & Review System — Update Report

This document describes the backend additions for **review invitations (tokens), review submission, and listing reviews by experience**: implementation details, data shapes, and API contracts.

---

## 1. Feature overview

| Capability | Description |
|------------|-------------|
| Send review invitation | Generates a unique UUID token for a given user and experience, appends it to local JSON, and **simulates email** (console output includes the review link) |
| Verify token | Checks whether the token exists, is expired, or has already been used; returns the associated `user_id` and `experience_id` when valid |
| Submit review | Accepts multi-dimensional scores and text via a valid token, persists to `reviews.json`, and marks the token as used |
| List reviews for an experience | Returns all JSON reviews for an experience ID so clients or downstream services can compute averages, etc. |

---

## 2. Data structures

### 2.1 Review

Reviews are stored as an array of objects in **`eTourism/backend/data/reviews.json`**. Each record has:

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Monotonic ID (max existing `id` in file + 1) |
| `user_id` | number | Taken from the invite token; **not** trusted from arbitrary client identity fields |
| `experience_id` | number | Same as above, from the token |
| `rating` | number | Overall score, integer **1–5** |
| `host_rating` | number | Host dimension, **1–5** |
| `content_rating` | number | Content dimension, **1–5** |
| `technical_rating` | number | Technical / smoothness dimension, **1–5** |
| `recommend` | boolean | Would recommend |
| `comment` | string | Free-text comment |
| `improvement` | string | Improvement suggestions |
| `created_at` | string | ISO 8601 timestamp |

### 2.2 Token (review invitation)

Tokens are stored in **`eTourism/backend/reviewTokens.json`** (backend root, next to `package.json`). Each record has:

| Field | Type | Description |
|-------|------|-------------|
| `token` | string | UUID |
| `user_id` | number | Invited user |
| `experience_id` | number | Target experience |
| `expired_at` | string | Expiry time (ISO) |
| `used` | boolean | Set to `true` after a successful review submission |

---

## 3. Files and layout

Implementation lives under **`eTourism/backend/`**:

```
eTourism/backend/
├── controllers/
│   └── reviewController.js    # send-email, verify, submit, list by experience
├── routes/
│   ├── reviews.js             # routes under /api/reviews
│   ├── experiences.js         # /api/experiences/:id/reviews
│   └── index.js               # mounts /reviews, /experiences
├── utils/
│   ├── reviewTokenStore.js    # read/write reviewTokens.json, markTokenUsed
│   ├── reviewInviteToken.js   # shared token validation (exists / expired / used)
│   └── reviewStore.js         # data/reviews.json I/O, filter by experience
├── data/
│   └── reviews.json           # created at runtime (data/ created on first write)
└── reviewTokens.json          # created at runtime (first invitation)
```

**Documentation (this file):** `docs/README-report.md` at the repository root (sibling of `eTourism/`).

**Notes:**

- `data/reviews.json` and backend-root `reviewTokens.json` are listed in **`eTourism/backend/.gitignore`** so real tokens and review payloads are not committed.
- HTTP routes are mounted under the global **`/api`** prefix (see `server.js`: `app.use('/api', routes)`).

---

## 4. API reference

### 4.1 `POST /api/reviews/send-email`

**Purpose:** Create an invitation token, append it to `reviewTokens.json`, and print a simulated email (including the review page URL) to the console.

**Request body (JSON):**

```json
{
  "user_id": 1,
  "experience_id": 2
}
```

**Validation:** `user_id` and `experience_id` must be positive integers; user and experience must exist in the database (`User.findById`, `Experience.findById`).

**Success:** `201` with `message` and `expired_at`. The link embedded in the email is:

`${REVIEW_FRONTEND_URL}?token=<uuid>` (default base: `http://localhost:3000/review`)

**Dependencies:** Working PostgreSQL (`DATABASE_URL`) and the same DB configuration as the rest of the app. Full `server.js` startup also requires Stripe and other env vars described in existing deployment notes.

---

### 4.2 `GET /api/reviews/verify?token=<uuid>`

**Purpose:** Validate a token without mutating storage.

| HTTP | Condition |
|------|-----------|
| 400 | Missing `token` query parameter (`token query parameter is required`) |
| 404 | Token not found |
| 410 | Expired (body includes `expired_at`) |
| 409 | `used === true` |
| 200 | Valid: `valid`, `user_id`, `experience_id`, `expired_at` |

---

### 4.3 `POST /api/reviews`

**Purpose:** Submit a review; after token validation, append to `data/reviews.json` and set the matching token to `used: true`.

**Request body (JSON):**

| Field | Required | Description |
|-------|----------|-------------|
| `token` | Yes | UUID from the invitation link |
| `rating` | Yes | Integer 1–5 |
| `host_rating` | Yes | Integer 1–5 |
| `content_rating` | Yes | Integer 1–5 |
| `technical_rating` | Yes | Integer 1–5 |
| `recommend` | Yes | Boolean; `1`/`0` and `"true"`/`"false"` are also accepted |
| `comment` | No | String; defaults to empty string |
| `improvement` | No | String; defaults to empty string |

**Token errors:** Same semantics as **4.2** (400 / 404 / 410 / 409).

**Field errors:** Non–1–5 integer scores or unparseable `recommend` → **400** with a `message` naming the problem.

**Success:** `201` with `message` and `review` (full object including generated `id`, `created_at`, etc.).

**Important:** `user_id` and `experience_id` are **only** taken from the token; values in the body cannot override them, which reduces spoofed reviews.

---

### 4.4 `GET /api/experiences/:id/reviews`

**Purpose:** Return all reviews in `reviews.json` for the given experience ID.

**Path parameter:** `id` must be a positive integer; otherwise **400**.

**Success:** `200` with a payload like:

```json
{
  "experience_id": 2,
  "reviews": [ /* sorted by created_at descending */ ],
  "count": 10
}
```

Clients may aggregate `rating` (or other fields) over `reviews` to compute averages.

---

## 5. Environment variables (optional)

| Variable | Purpose | Default |
|----------|---------|---------|
| `REVIEW_FRONTEND_URL` | **Prefix** for the review page URL in emails (no query string); full link is `` `${REVIEW_FRONTEND_URL}?token=<uuid>` `` | `http://localhost:3000/review` |
| `REVIEW_TOKEN_TTL_DAYS` | Token lifetime in days | `7` |

**Example:** With defaults, the simulated email contains `http://localhost:3000/review?token=<uuid>`. For another origin or path, set `REVIEW_FRONTEND_URL` to the full prefix (e.g. `https://app.example.com/review`).

---

## 6. Error handling and consistency

- **Token validation** is centralized in `validateInviteToken` in `utils/reviewInviteToken.js`, reused by:
  - `GET /api/reviews/verify`
  - `POST /api/reviews`
- HTTP status codes and bodies for **not found / expired / already used** therefore match between verify and submit.
- Uncaught errors are logged and answered with **500** (`message: Server error`).

---

## 7. Relationship to existing code

- `models/Review.js` (PostgreSQL `reviews` table) remains in use for other flows (e.g. visitor routes). **This report documents a parallel JSON-based “email invite + file persistence” path**; the two are not automatically kept in sync. Unifying them would require a migration or dual-write strategy.
- `POST /api/reviews` and `POST /api/visitor/reviews` (if present) are different endpoints with different roles—do not confuse them when integrating.

---

## 8. Versioning and maintenance

- Implementation: `eTourism/backend` — `controllers/reviewController.js`, `routes/reviews.js`, `routes/experiences.js`, and the `utils` / `data` paths above.
- This report: **`docs/README-report.md`**. When APIs or fields change, update this file for coursework reports and team onboarding.
