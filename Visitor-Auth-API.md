# Visitor Registration, Login and Password Reset API

---

## 1. Register

**Purpose**: Create a new visitor account. The client must send email, password, account name, and date of birth; the password is stored as a bcrypt hash.

**Request**
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Content-Type**: `application/json`

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Email address; must be unique |
| password | string | Yes | Login password (sent in plain text; server hashes with bcrypt) |
| name | string | Yes | Account / display name |
| date_of_birth | string | Yes | Date of birth; recommended format `YYYY-MM-DD` |

**Success** (HTTP 201)
- Returns `token` (JWT for authenticated APIs) and `user` (new user info, no password).

**Errors**
- `400`: Missing or invalid fields.
- `409`: Email already registered.
- `503`: Server missing `DATABASE_URL` or `JWT_SECRET`.
- `500`: Server error.

---

## 2. Login

**Purpose**: Log in with email and password to obtain a JWT. Only visitor accounts can use this endpoint; ehost login is disabled here.

**Request**
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Content-Type**: `application/json`

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Registered email |
| password | string | Yes | Login password |

**Success** (HTTP 200)
- Returns `token` (JWT) and `user` (user info, no password hash). For protected APIs, send `Authorization: Bearer <token>` in the request header.

**Errors**
- `400`: Missing email or password.
- `401`: Invalid email or password.
- `403`: Ehost account; login not allowed via this endpoint.
- `503`: Server environment not configured.
- `500`: Server error.

---

## 3. Password Reset

**Purpose**: User verifies identity by email (account must exist), then sets a new password and confirms it by entering it twice to complete the reset.

**Request**
- **Method**: `POST`
- **Path**: `/api/auth/reset-password`
- **Content-Type**: `application/json`

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Registered email (used to identify the account) |
| newPassword | string | Yes | New password |
| confirmPassword | string | Yes | Must match newPassword |

**Success** (HTTP 200)
- Returns `{ "ok": true }` when the password has been updated.

**Errors**
- `400`: Missing required fields, or newPassword and confirmPassword do not match.
- `404`: No account found for this email.
- `503`: Server missing `DATABASE_URL`.
- `500`: Server error.

---

## Example Requests

**Register**
```json
POST /api/auth/register
{ "email": "visitor@example.com", "password": "yourPassword", "name": "John Doe", "date_of_birth": "1990-05-20" }
```

**Login**
```json
POST /api/auth/login
{ "email": "visitor@example.com", "password": "yourPassword" }
```

**Password Reset**
```json
POST /api/auth/reset-password
{ "email": "visitor@example.com", "newPassword": "newSecret123", "confirmPassword": "newSecret123" }
```

---

*This document describes the eTourism backend auth APIs for visitor registration, login, and password reset.*
