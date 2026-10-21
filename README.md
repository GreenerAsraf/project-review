# ProjectPilot — Project Submission and Review Dashboard

A modern, production-grade full-stack platform built for student project submissions and mentor reviews. Developed with an Express.js & TypeScript REST backend, Next.js 16 App Router frontend, PostgreSQL database with Prisma ORM, JWT-based role-based access control, and strict Zod validation.

---

## 🌐 Live Deployments

- **Frontend (Next.js 16 on Vercel):** [https://project-review-ashen.vercel.app/](https://project-review-ashen.vercel.app/)
- **Backend (Express + TS on Render):** [https://project-review-us52.onrender.com/](https://project-review-us52.onrender.com/)
- **Database (PostgreSQL on Neon):** Hosted AWS `ap-southeast-1`

---

## 🚀 Key Features

### 🎓 Student Experience
- **Public Student Registration & Authentication:** Secure signup and login returning signed JWT tokens. Public registration is strictly scoped to the `STUDENT` role.
- **Interactive Project Submission:** Modal form capturing Project Name, Repository URL, optional Live URL, and Project Description.
- **Client & Server URL Validation:** Immediate regex/URL feedback with full server-side Zod validation against malicious schemes (`javascript:`, etc.).
- **URL Normalization & Duplicate Prevention:** Normalizes repository URLs (trimming, lowercasing, stripping trailing slashes and `.git`) with database-level compound uniqueness (`[studentId, repoUrl]`).
- **Student Dashboard:** Real-time personal submissions list showing submission date, links, and current status (`PENDING`, `APPROVED`, or `REJECTED`).

### 🧑‍🏫 Mentor Dashboard
- **Role-Gated Access:** Restricted strictly to users with the `MENTOR` role; forbidden (`403`) for students.
- **Aggregated Real-Time Statistics:** Dynamic count cards calculating total, pending, approved, and rejected submissions directly via Prisma database aggregations.
- **Server-Side Pagination & Filtering:** Efficient server-side query filters for `PENDING`, `APPROVED`, and `REJECTED` states, with customizable `page` and `pageSize` without loading all rows into memory.
- **Status Review Actions:** One-click Approve / Reject actions with instant status badge updates and feedback.

### 🛡️ Security & Architecture
- **JWT & Role-Based Authorization:** Identity derived purely from signed tokens; user ID or role submitted in request bodies is never trusted.
- **Password Security:** Salted hashing with `bcryptjs` (salt rounds: 12). Password hashes are never exposed in any API response.
- **API Rate Limiting:** In-memory rate limiting applied on authentication routes (20 req / 15 min) and submission creation routes (5 req / 15 min).
- **Graceful Error Handling:** Centralized error handling sanitizes database errors and returns structured errors without leaking stack traces or credentials.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, Lucide Icons |
| **Backend** | Express.js 5, Node.js 20+, TypeScript, CORS, Express Rate Limit |
| **Database & ORM**| PostgreSQL, Prisma ORM v6 |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| **Validation** | Zod (shared validation philosophy on client and server) |
| **Testing** | Jest, Supertest, ts-jest (36 automated tests) |
| **Hosting** | Vercel (Client), Render (API), Neon (Serverless PostgreSQL) |

---

## 📁 Repository Structure

```text
ph-task/
├── client/                     # Next.js App Router (Frontend)
│   ├── app/
│   │   ├── login/              # Login page with Zod validation
│   │   ├── register/           # Student registration page
│   │   ├── student/            # Student project submission & dashboard
│   │   ├── mentor/             # Mentor review dashboard (stats + table)
│   │   └── page.tsx            # Landing hero page
│   ├── components/
│   │   ├── NavigationBar.tsx   # Global navigation bar
│   │   └── ui/                 # Reusable buttons, cards, inputs
│   ├── context/
│   │   └── AuthContext.tsx     # JWT session management & auto-redirects
│   ├── lib/
│   │   ├── api.ts              # Typed fetch client with Bearer token injection
│   │   └── utils.ts            # Class merging utility (clsx + twMerge)
│   ├── .env.example            # Client environment placeholder template
│   └── package.json
│
├── server/                     # Express.js REST API (Backend)
│   ├── prisma/
│   │   ├── schema.prisma       # Prisma models (User, Submission), Enums & Constraints
│   │   └── seed.ts             # Idempotent mentor seed script
│   ├── src/
│   │   ├── config/             # Typed environment configuration
│   │   ├── controllers/        # Auth, Submission, and Mentor controllers
│   │   ├── middlewares/        # JWT auth, role guard, Zod validator, rate limiters
│   │   ├── routes/             # API route declarations
│   │   ├── schemas/            # Zod validation schemas
│   │   ├── services/           # Prisma client singleton
│   │   ├── app.ts              # Express application factory & CORS setup
│   │   └── server.ts           # HTTP server entrypoint
│   ├── tests/                  # 36 automated Jest + Supertest suites
│   ├── .env.example            # Server environment placeholder template
│   └── package.json
│
├── render.yaml                 # Render infrastructure-as-code deployment configuration
├── package.json                # Root monorepo workspace orchestration
└── README.md
```

---

## ⚙️ Environment Configuration

Do not commit actual `.env` files. Templates with placeholders are provided in both subdirectories:

### 1. Server Environment (`server/.env`)
Create `server/.env` based on `server/.env.example`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# PostgreSQL connection URL (sslmode=require for cloud providers like Neon)
DATABASE_URL="postgresql://username:password@localhost:5432/ph_dashboard?schema=public"

# JWT configuration (use minimum 32 characters in production)
JWT_SECRET=your_jwt_signing_secret_here_at_least_32_chars
JWT_EXPIRES_IN=1d

# Optional Mentor Seed Configuration
INITIAL_MENTOR_EMAIL=mentor@projectpilot.com
INITIAL_MENTOR_PASSWORD=MentorSecurePass2026!
INITIAL_MENTOR_NAME=Senior Mentor
```

### 2. Client Environment (`client/.env.local`)
Create `client/.env.local` based on `client/.env.example`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🗄️ Database Setup & Migration Instructions

Ensure your PostgreSQL instance is running and reachable via `DATABASE_URL`.

### 1. Generate Prisma Client
```bash
cd server
npm run prisma:generate
```

### 2. Push / Sync Schema with PostgreSQL
```bash
cd server
# For development and prototyping:
npx prisma db push

# In production pipelines:
npm run prisma:deploy
```

### 3. Seed Initial Mentor Account
Run the idempotent seed script to create the initial mentor without hardcoded credentials:
```bash
cd server
npm run prisma:seed
```
*Note: If the mentor account already exists, the script safely logs a notice and skips re-creation.*

---

## 💻 Local Development Guide

### Prerequisites
- Node.js `v20.x` or `v22.x`
- npm `v10+`

### Installation
From the root repository directory:
```bash
# Install root, client, and server dependencies
npm install
npm --prefix server install
npm --prefix client install
```

### Running Both Applications
```bash
# Run server (port 5000) and client (port 3000) concurrently:
npm run dev:server   # in terminal 1
npm run dev:client   # in terminal 2
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated Testing

The backend includes 36 comprehensive automated tests across 5 test suites covering registration, authentication, token tampering, RBAC guards, URL normalization, duplicate collision handling, pagination, and full e2e workflows.

Run tests from the root directory:
```bash
npm --prefix server test
```

### Test Coverage Summary:
- **`tests/auth.test.ts`**: Student registration, password encryption, login verification, profile endpoint, role barriers.
- **`tests/submission.test.ts`**: Student project creation, URL format validation, duplicate repository rejection, personal submission queries.
- **`tests/mentor.test.ts`**: Mentor-only dashboard access, pagination metadata, status filters, status updates, student blocking.
- **`tests/security.test.ts`**: Role spoofing prevention, token expiration handling, payload injection protection, XSS URL rejection (`javascript:`), and DB constraint race conditions.
- **`tests/e2e_integration.test.ts`**: Complete 10-step student submission to mentor approval workflow.

---

## 📖 API Documentation

All routes except `/api/auth/register`, `/api/auth/login`, and `/health` require an `Authorization: Bearer <TOKEN>` header.

### Public Endpoints
| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Service health status | None |
| `POST` | `/api/auth/register` | Register a new Student | `{ name, email, password }` |
| `POST` | `/api/auth/login` | Authenticate user & get JWT | `{ email, password }` |

### Authenticated Endpoints
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/auth/me` | `STUDENT`, `MENTOR` | Get current user profile |
| `POST` | `/api/submissions` | `STUDENT` | Submit a project |
| `GET` | `/api/submissions/my` | `STUDENT` | List student's own submissions |
| `GET` | `/api/submissions/:id` | `STUDENT`, `MENTOR` | Get single submission details |
| `GET` | `/api/mentor/submissions` | `MENTOR` | Paginated & filtered submissions list + stats |
| `PATCH`| `/api/mentor/submissions/:id/status`| `MENTOR` | Approve or Reject a submission (`status: 'APPROVED' \| 'REJECTED'`) |

---

## 🔒 Security & Architectural Decisions

1. **Role Trust Model:** Client-supplied roles and user IDs in request bodies are discarded. The user's identity and role are extracted strictly from verified JWT claims via `authenticateJWT` and `requireRole` middlewares.
2. **Repository URL Normalization:** All repository URLs are trimmed, lowercased, and stripped of trailing slashes and `.git` suffixes prior to duplicate evaluation.
3. **Database-Level Unique Constraints:** In addition to application-level checks, PostgreSQL enforces a compound uniqueness constraint `@@unique([studentId, repoUrl])` to eliminate race conditions.
4. **Rate Limiting:** Protects `/api/auth/*` against brute-force attacks and `/api/submissions` against spam submissions.
5. **CORS Isolation:** CORS is configured strictly with the allowed origin passed via the `CLIENT_URL` environment variable.

---

## ☁️ Production Deployment

### Frontend (Vercel)
1. Import repository on [Vercel](https://vercel.com).
2. Set **Root Directory** to `client`.
3. Set Environment Variable:
   - `NEXT_PUBLIC_API_URL` = `https://<your-render-backend-url>/api`
4. Deploy.

### Backend (Render)
1. Create a **Web Service** on [Render](https://render.com).
2. Connect the GitHub repository.
3. Configure settings:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node server/dist/server.js` (or `npm start`)
4. Set Environment Variables:
   - `NODE_ENV` = `production`
   - `CLIENT_URL` = `https://<your-vercel-app>.vercel.app`
   - `DATABASE_URL` = `<neon-postgresql-connection-string>?sslmode=require`
   - `JWT_SECRET` = `<min-32-character-random-secret>`
   - `JWT_EXPIRES_IN` = `1d`
5. Deploy.

---

## ⚠️ Known Limitations & Future Enhancements

- **Free-Tier Spin Down:** Render's free tier spins down after 15 minutes of inactivity. Initial wake-up requests may take 30–50 seconds.
- **Token Storage Strategy:** The frontend currently stores the JWT in `localStorage` for accessibility and simplicity in assessment evaluation. In high-security production environments, upgrading to `HttpOnly`, `SameSite=Strict` secure cookies is recommended.
- **Live URL Protocol Verification:** The submission form validates URL format, but does not verify live HTTP reachability of student deployment links.
