# Project Submission and Review Dashboard (Monorepo)

A full-stack monorepo application built with:
- **Client:** Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui-ready architecture.
- **Server:** Express.js REST API, TypeScript, PostgreSQL, and Prisma ORM.

---

## 📁 Repository Structure

```text
ph-task/
├── client/                     # Next.js App Router (Frontend)
│   ├── app/                    # App Router pages and layouts
│   ├── components/ui/          # Reusable UI component primitives
│   ├── lib/                    # Client utility functions & API client
│   ├── .env.example            # Client placeholder environment variables
│   ├── package.json
│   ├── tailwind.config.ts / css
│   └── tsconfig.json
│
├── server/                     # Express.js API (Backend)
│   ├── prisma/
│   │   ├── schema.prisma       # Database models, enums & constraints
│   │   └── seed.ts             # Safe idempotent mentor seed script
│   ├── src/
│   │   ├── config/             # Typed environment configuration
│   │   ├── middlewares/        # Middlewares (CORS, validation, auth)
│   │   ├── routes/             # Route controllers and endpoints
│   │   ├── services/           # Prisma client singleton
│   │   ├── app.ts              # Express application factory & health check
│   │   └── server.ts           # Server entry point
│   ├── .env.example            # Server placeholder environment variables
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore                  # Root gitignore excluding secrets & build outputs
├── package.json                # Root monorepo scripts
└── README.md
```

---

## ⚙️ Environment Configuration

Both `client/` and `server/` require local configuration files. Copy the provided `.env.example` templates:

### 1. Server Configuration (`server/.env`)
```bash
cp server/.env.example server/.env
```
Populate the placeholder variables with your credentials:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
DATABASE_URL="postgresql://postgres:password@localhost:5432/ph_dashboard?schema=public"
JWT_SECRET=super_secret_jwt_signing_key_min_32_chars
JWT_EXPIRES_IN=1d

# Optional: Mentor Seed credentials for initial setup
INITIAL_MENTOR_EMAIL=mentor@example.com
INITIAL_MENTOR_PASSWORD=change_this_secure_password_123
INITIAL_MENTOR_NAME=Senior Mentor
```

### 2. Client Configuration (`client/.env.local`)
```bash
cp client/.env.example client/.env.local
```
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🚀 Running the Applications

### Prerequisites
- Node.js `v20+` or `v22+`
- PostgreSQL database instance (local PostgreSQL service, Docker, or hosted like Neon/Supabase)

### Root Monorepo Commands
From the project root:
```bash
# Run both backend and frontend concurrently
npm run dev

# Or run separately:
npm run dev:server   # Starts Express backend on http://localhost:5000
npm run dev:client   # Starts Next.js frontend on http://localhost:3000

# Type-check both workspaces
npm run check
```

---

## 🗄️ Database Setup & Seed Guide

### 1. Generate Prisma Client
```bash
cd server
npm run prisma:generate
```

### 2. Run Database Migrations
Prisma will compare `schema.prisma` against your database and apply migrations:
```bash
cd server
npm run prisma:migrate
```

### 3. Safe Mentor Account Seed
To seed the initial mentor account (uses `INITIAL_MENTOR_*` environment variables safely without hardcoded secrets and skips if the email already exists):
```bash
cd server
npm run prisma:seed
```

---

## 🩺 Health Check Endpoint
The server provides a standard health check endpoint:
- **URL:** `GET http://localhost:5000/health`
- **Response:**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-20T07:30:00.000Z"
  }
  ```
