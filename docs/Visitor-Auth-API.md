# Visitor 註冊、登入與密碼重設 API 說明  
# Visitor Registration, Login and Password Reset API

---

## 一、註冊 Register



**用途**：訪客（visitor）建立新帳號。註冊時須提供電子郵件、密碼、帳戶名稱與生日；密碼會以 bcrypt 雜湊後儲存。

**請求**
- **方法**：`POST`
- **路徑**：`/api/auth/register`
- **Content-Type**：`application/json`

**請求欄位（body）**

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| email | string | 是 | 電子郵件，不可與既有帳號重複 |
| password | string | 是 | 登入密碼（明文送出，後端以 bcrypt 雜湊儲存） |
| name | string | 是 | 帳戶名稱（顯示用） |
| date_of_birth | string | 是 | 生日，建議格式 `YYYY-MM-DD` |

**成功回應**（HTTP 201）
- 回傳 `token`（JWT，用於後續需登入的 API）與 `user`（新建立使用者基本資料，不含密碼）。

**錯誤回應**
- `400`：缺少必填欄位或格式錯誤。
- `409`：該 email 已註冊。
- `503`：伺服器未設定 `DATABASE_URL` 或 `JWT_SECRET`。
- `500`：伺服器內部錯誤。

---



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

## 二、登入 Login

### 台灣繁體中文

**用途**：以電子郵件與密碼登入，取得 JWT。僅開放 visitor 角色登入；ehost 帳號無法透過此介面登入。

**請求**
- **方法**：`POST`
- **路徑**：`/api/auth/login`
- **Content-Type**：`application/json`

**請求欄位（body）**

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| email | string | 是 | 註冊時使用的電子郵件 |
| password | string | 是 | 登入密碼 |

**成功回應**（HTTP 200）
- 回傳 `token`（JWT）與 `user`（使用者資料，不含密碼雜湊）。後續呼叫需登入的 API 時，請在 Header 帶上 `Authorization: Bearer <token>`。

**錯誤回應**
- `400`：缺少 email 或 password。
- `401`：電子郵件或密碼錯誤。
- `403`：該帳號為 ehost，不允許由此介面登入。
- `503`：伺服器未設定環境變數。
- `500`：伺服器內部錯誤。

---

### English

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

## 三、密碼重設 Password Reset

### 台灣繁體中文

**用途**：使用者先以電子郵件驗證身分（確認該 email 已註冊），再輸入新密碼並重複輸入一次以確認，完成密碼重設。

**請求**
- **方法**：`POST`
- **路徑**：`/api/auth/reset-password`
- **Content-Type**：`application/json`

**請求欄位（body）**

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| email | string | 是 | 已註冊的電子郵件（用於驗證身分） |
| newPassword | string | 是 | 新密碼 |
| confirmPassword | string | 是 | 再次輸入新密碼，須與 newPassword 一致 |

**成功回應**（HTTP 200）
- 回傳 `{ "ok": true }` 表示密碼已更新。

**錯誤回應**
- `400`：缺少必填欄位，或 `newPassword` 與 `confirmPassword` 不一致。
- `404`：找不到該 email 對應的帳號。
- `503`：伺服器未設定 `DATABASE_URL`。
- `500`：伺服器內部錯誤。

---

### English

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

## 請求範例 Example Requests

**註冊 Register**
```json
POST /api/auth/register
{ "email": "visitor@example.com", "password": "yourPassword", "name": "王小明", "date_of_birth": "1990-05-20" }
```

**登入 Login**
```json
POST /api/auth/login
{ "email": "visitor@example.com", "password": "yourPassword" }
```

**密碼重設 Password Reset**
```json
POST /api/auth/reset-password
{ "email": "visitor@example.com", "newPassword": "newSecret123", "confirmPassword": "newSecret123" }
```

---

*本文件對應 eTourism 後端 auth 介面，適用 visitor 角色之註冊、登入與密碼重設。*  
*This document describes the eTourism backend auth APIs for visitor registration, login, and password reset.*
