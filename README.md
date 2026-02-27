# eTourism Platform

A full-stack web application for browsing, booking, and reviewing tourism experiences. Built with React (Vite) on the frontend and Node.js/Express with PostgreSQL on the backend.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7 |
| Backend | Node.js, Express 4 |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Payments | Stripe |

---

## Project Structure

```
project-1/
└── etourism/
    ├── client/          # React + Vite frontend
    │   ├── src/
    │   │   ├── App.jsx
    │   │   └── main.jsx
    │   ├── index.html
    │   └── vite.config.js
    └── backend/         # Node.js + Express REST API
        ├── server.js
        ├── config/
        │   └── db.js
        ├── middleware/
        │   └── auth.js
        ├── models/      # PostgreSQL data models
        └── routes/      # API route handlers
```

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd project-1
```

### 2. Set up the Backend

Navigate to the backend directory and install dependencies:

```bash
cd etourism/backend
npm install
```

### 3. Set up the Frontend

Navigate to the client directory and install dependencies:

```bash
cd ../client
npm install
```

---

## Environment Variables

> **Important:** Never commit `.env` files to version control. Ensure `.env` is listed in `.gitignore` for both `backend/` and `client/`.

### Backend (`etourism/backend/.env`)

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Server
PORT=5000

# PostgreSQL (connection string)
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/etourism_db

# Authentication
JWT_SECRET=your_super_secret_jwt_key

# Payment Integration (Stripe)
STRIPE_SECRET_KEY=your_stripe_test_secret_key
```

### Frontend (`etourism/client/.env`)

Create a `.env` file in the `client/` directory. In Vite, environment variables must be prefixed with `VITE_`:

```env
# Backend API URL
VITE_API_URL=http://localhost:5000/api

# Firebase Configuration (for Google Sign-In)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

---

## Running the Application

Open two separate terminals once your dependencies are installed and `.env` files are configured.

### Backend

```bash
cd etourism/backend
npm run dev
```

The API server will start at `http://localhost:5000`. You can verify it is running by visiting `http://localhost:5000/health`.

### Frontend

```bash
cd etourism/client
npm run dev
```

The React app will start at `http://localhost:5173` (Vite default).

---

## API Overview

All API routes are prefixed with `/api`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| POST | `/api/auth/...` | Authentication (login, register) |
| GET/POST | `/api/users/...` | User management |

---

## Database Models

The backend includes the following PostgreSQL models:

- **User** — User accounts and profiles
- **Experience** — Tourism experiences and tours
- **Booking** — Experience reservations
- **Payment** — Payment transactions
- **Refund** — Refund records
- **Review** — User reviews for experiences
- **UserAgreement** — Terms & conditions tracking
- **NetworkLog** — API activity logging
- **ExperienceScore** — Rating and scoring system
