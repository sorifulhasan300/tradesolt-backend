# ⚙️ TradeSlot — Backend API Engine

> **TradeSlot Backend** is a robust RESTful API service powering the TradeSlot booking ecosystem. It features multi-channel message normalization (WhatsApp & Web Chatbot), an automated 30-minute travel buffer calculation engine, role-based access control (RBAC), Better Auth integration, and Stripe Connect payouts with automatic platform fee capture.

---

## ⚡ Quick Overview

The backend serves as the **core orchestrator** for booking requests, schedule conflict prevention, channel message intake, and automated payments:

```
                            ┌───────────────────────────┐
                            │    Inbound Booking        │
                            │   (WhatsApp / Web Chat)   │
                            └─────────────┬─────────────┘
                                          │
                                          ▼
                            ┌───────────────────────────┐
                            │ Multi-Channel Normalizer  │
                            └─────────────┬─────────────┘
                                          │
                                          ▼
                            ┌───────────────────────────┐
                            │ ⏱️ 30-Min Buffer Engine   │
                            └─────────────┬─────────────┘
                                          │
                                          ▼
                            ┌───────────────────────────┐
                            │ 💳 Stripe Connect Payouts  │
                            │  & Flat Platform Fee      │
                            └───────────────────────────┘
```

---

## ✨ Core Features & Modules

- **🔄 Multi-Channel Booking Intake**: Normalizes incoming messages from WhatsApp, Web Chatbot, and other communication channels into a unified schema `(sender, channel, content, timestamp)`.
- **⏱️ Automated 30-Minute Travel Buffer Engine**: Automatically injects a fixed 30-minute buffer before and after each booked slot to prevent travel overlap.
- **💳 Stripe Connect Integration**: 
  - Express account onboarding links for traders.
  - Automated application fee deduction on payment completion.
  - Direct trader payouts.
- **🛡️ Role-Based Access Control (RBAC)**: Enforces access rules for 4 platform roles: `CUSTOMER`, `TRADER`, `BUSINESS_ADMIN`, and `PLATFORM_ADMIN`.
- **📍 Daily Work Area Manager**: Allows traders to define their single-day active zone and service area.
- **📩 SMTP OTP Authentication**: Email OTP dispatch via Nodemailer and Better Auth authentication middleware.

---

## 🛠️ Tech Stack & Dependencies

| Layer | Technology |
| :--- | :--- |
| **Runtime & Framework** | [Node.js](https://nodejs.org/), [Express v5](https://expressjs.com/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Database & ORM** | PostgreSQL + [Prisma ORM 7](https://www.prisma.io/) |
| **Authentication** | [Better Auth](https://www.better-auth.com/) + Custom Role Middleware |
| **Payments** | [Stripe Node SDK](https://stripe.com/) (Connect, PaymentIntents, Webhooks) |
| **Email Service** | [Nodemailer](https://nodemailer.com/) (SMTP Email Delivery) |
| **Build & Execution** | `tsup` (bundle), `tsx` (TypeScript dev runner) |

---

## 📁 Repository Structure

```
tradeslot-backend/
├── prisma/
│   ├── models/                # Modular Prisma schema models
│   │   ├── auth.prisma        # Auth session & token schemas
│   │   ├── booking.prisma     # Booking slot & travel buffer schemas
│   │   ├── enums.prisma       # Roles, booking status, communication channels
│   │   ├── message.prisma     # Multi-channel message schemas
│   │   ├── payment.prisma     # Stripe transactions & payouts
│   │   ├── user.prisma        # User profile & role schemas
│   │   └── workArea.prisma    # Trader work zone schemas
│   └── schema.prisma          # Main Prisma entry file
├── src/
│   ├── app/
│   │   └── module/            # Feature Modules
│   │       ├── auth/          # Authentication & OTP handlers
│   │       ├── booking/       # Booking engine & slot availability
│   │       ├── message/       # Multi-channel intake controller
│   │       ├── payment/       # Stripe Connect & payouts
│   │       ├── user/          # User administration & role toggles
│   │       └── workArea/      # Trader work area management
│   ├── config/                # Environment configuration & validation
│   ├── db/                    # Prisma client instance & seeds
│   ├── errors/                # Global error classes & handling middleware
│   ├── middleware/            # Auth guard, RBAC middleware & validation
│   ├── routes/                # Main router (`/api/v1`)
│   ├── app.ts                 # Express application setup
│   └── server.ts              # Server startup & database connection
├── .env.example               # Environment variables template
├── tsup.config.ts             # Production build config
└── vercel.json                # Vercel serverless deployment config
```

---

## ⚙️ Quick Start Guide

### Prerequisites
- **Node.js**: `v20+`
- **PostgreSQL Database**: Local or Cloud instance (e.g. Neon, Supabase, Render)
- **pnpm**: Installed globally

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:

```env
NODE_ENV="development"
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/tradeslot_db"

BETTER_AUTH_SECRET="your-better-auth-secret-min-32-chars"
BETTER_AUTH_URL="http://localhost:5000"

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PLATFORM_FEE_PERCENT=10

CLIENT_URL="http://localhost:3000"
BACKEND_URL="http://localhost:5000"

EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_FROM="TradeSlot <no-reply@tradeslot.com>"
```

### 3. Database Migration & Seeding
Generate Prisma client and run migrations:

```bash
# Generate Prisma Client
pnpm prisma:generate

# Run DB Migrations
pnpm prisma:migrate

# Seed Initial Test Data (Optional)
pnpm seed
```

### 4. Run Development Server
```bash
pnpm dev
```
The server will start at `http://localhost:5000`.

---

## 🔑 Environment Variables Reference

| Variable | Required | Description |
| :--- | :---: | :--- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Secret key for auth sessions |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret API key |
| `STRIPE_WEBHOOK_SECRET` | Optional | Stripe webhook signature secret |
| `EMAIL_USER` / `EMAIL_PASS` | Yes | SMTP credentials for sending OTP emails |
| `CLIENT_URL` | Yes | Frontend origin URL for CORS |

---

## 🔌 API Endpoints Summary (`/api/v1`)

### 🔐 Authentication (`/api/v1/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/sign-in` | Authenticate user with credentials |
| `POST` | `/auth/sign-up` | Register new account |
| `POST` | `/auth/send-otp` | Send email verification OTP |
| `POST` | `/auth/verify-otp` | Verify email OTP code |

### 📅 Bookings & Slots (`/api/v1/bookings`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/bookings` | List all bookings |
| `POST` | `/bookings` | Create new slot booking with travel buffer |
| `GET` | `/bookings/slots` | Get available slots for trader |
| `PATCH` | `/bookings/:id/status` | Update booking status (CONFIRMED, COMPLETED, CANCELLED) |

### 💬 Multi-Channel Messages (`/api/v1/messages`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/messages/intake` | Normalize & ingest incoming WhatsApp/Web Chatbot message |
| `GET` | `/messages/history` | Retrieve channel message conversation history |

### 📍 Trader Work Area (`/api/v1/work-area`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/work-area` | Set daily work zone location & radius |
| `GET` | `/work-area/trader/:traderId` | Get active work zone for trader |

### 💳 Stripe Connect & Payments (`/api/v1/payments`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/payments/create-connect-account` | Generate Stripe Connect onboarding link |
| `GET` | `/payments/connect-status` | Fetch trader Stripe account onboarding status |
| `POST` | `/payments/create-payment-intent` | Create booking payment intent with platform fee |

### 👤 User Administration (`/api/v1/users`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/users` | List all system users (Admin only) |
| `PATCH` | `/users/:id/role` | Change user role (`CUSTOMER`, `TRADER`, `BUSINESS_ADMIN`, etc.) |
| `PATCH` | `/users/:id/status` | Suspend or activate user account |

---

## 📜 Available Scripts

- `pnpm dev` — Run server in development watch mode via `tsx`.
- `pnpm build` — Generate Prisma client & build production bundle with `tsup`.
- `pnpm start` — Run production bundle (`dist/server.js`).
- `pnpm seed` — Run database seed script.
- `pnpm prisma:generate` — Generate Prisma client code.
- `pnpm prisma:migrate` — Apply database schema migrations.
