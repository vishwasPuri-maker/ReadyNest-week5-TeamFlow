# TeamFlow — Multi-Tenant SaaS Platform

A production-style, multi-tenant SaaS for **project & task management** with role-based access,
real-time updates, analytics, file uploads, and a full audit trail.

Built for the ReadyNest Week 5 — Full Stack task.

---

## ✨ Features

| Requirement | Implementation |
|---|---|
| **JWT + Refresh Token** | Short-lived access token (15m) + rotating refresh token (7d) stored in DB, delivered via httpOnly cookie |
| **Multi-Tenant Architecture** | Shared DB with `organizationId` on every tenant-owned row; middleware auto-scopes all queries + per-org Socket rooms |
| **Role-Based Access (Admin/Member)** | `Membership.role` + `requireRole()` middleware guarding destructive/admin actions |
| **CRUD (real use case)** | Projects & Tasks with full create/read/update/delete |
| **Dashboard + Analytics** | Totals, tasks-by-status (pie), tasks-by-priority (bar), completion rate, overdue count |
| **Real-time** | Socket.io — task create/update/delete broadcast live to the org |
| **Pagination / Search / Filter / Sort** | Query params on all list endpoints (`page`, `limit`, `search`, `sortBy`, `sortOrder`, `status`, `priority`, `projectId`) |
| **File Upload** | Cloudinary (per-tenant folders), 5MB limit, multipart |
| **Audit / Activity Logs** | Every mutation recorded in `ActivityLog`, viewable in-app |
| **Responsive UI** | Tailwind, works on mobile + desktop |
| **Security (bonus)** | Helmet, CORS, per-IP + per-route rate limiting, bcrypt hashing, Zod validation |
| **Background Jobs (bonus)** | `node-cron` — daily overdue-task **digest emails** to org admins + nightly expired-token cleanup; admin-only manual trigger for demos |
| **Auth extras** | Email verification + password reset via Gmail SMTP (Nodemailer) |
| **Global error handling (bonus)** | Central error middleware normalises Zod/ApiError/unknown errors |

---

## 🧱 Tech Stack

**Frontend** — Next.js 14 (App Router) · React 18 · Tailwind CSS · TanStack Query · Recharts · socket.io-client
**Backend** — Node.js · Express · TypeScript · Prisma ORM · Socket.io · Zod
**Database** — PostgreSQL (Neon)
**Cloud** — Vercel (frontend) · Render (backend) · Cloudinary (files)

---

## 📂 Structure

```
readyNest/
├── backend/          Express + Prisma API
│   ├── prisma/       schema.prisma, migrations, seed
│   └── src/
│       ├── config/       env, prisma, cloudinary
│       ├── middleware/   auth (JWT + RBAC), error handler
│       ├── modules/      auth, projects, tasks, users(members), analytics, uploads
│       ├── sockets/      Socket.io setup (per-org rooms)
│       └── utils/        jwt, audit, pagination, ApiError
└── frontend/         Next.js app
    └── src/
        ├── app/          login, register, dashboard, projects, tasks, members, activity
        ├── components/   AppShell, ui, Pagination
        ├── context/      AuthContext
        └── lib/          api (axios + refresh), socket, types
```

See [docs/ER-DIAGRAM.md](docs/ER-DIAGRAM.md) for the database schema.

## 🔌 API Overview

Base URL: `/api`

**Auth** — `POST /auth/register` · `POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout` · `GET /auth/me`
**Projects** — `GET /projects` · `POST /projects` · `GET/PATCH /projects/:id` · `DELETE /projects/:id` (admin)
**Tasks** — `GET /tasks` · `POST /tasks` · `GET/PATCH/DELETE /tasks/:id`
**Members** — `GET /members` · `POST /members` (admin) · `PATCH /members/:id/role` (admin) · `DELETE /members/:id` (admin)
**Analytics** — `GET /analytics/dashboard` · `GET /analytics/activity`
**Uploads** — `POST /uploads` (multipart `file`)
**Jobs (admin)** — `GET /jobs` · `POST /jobs/:name/run` (`token-cleanup` | `overdue-digest`) — manually trigger background jobs

### Inventory / Store domain (B2B e-commerce)

The same multi-tenant core also powers a **store/inventory** use case (Store Owner = ADMIN, Cashier = MEMBER):

**Products** — `GET /products` (search/filter `?lowStock=true`) · `POST /products` (owner) · `PATCH /products/:id` (owner) · `POST /products/:id/restock` (owner) · `DELETE /products/:id` (owner)
**Orders (sales)** — `POST /orders` (concurrency-safe sale) · `GET /orders` · `GET /orders/:id`
**Sales analytics** — `GET /store/analytics` (revenue, orders, top sellers, low-stock)

> **Concurrency:** `POST /orders` uses an atomic conditional stock decrement so
> two cashiers can never oversell the last unit. The full strategy + a
> reproducible 20-parallel-order proof are in
> [docs/CONCURRENCY.md](docs/CONCURRENCY.md). Run the proof:
> `node backend/scripts/concurrency-test.mjs`

Import [docs/TeamFlow.postman_collection.json](docs/TeamFlow.postman_collection.json) into Postman to try them all
(the login request auto-saves the access token).

---

## ☁️ Deployment

- **Database**: Neon (already used in dev).
- **Backend → Render**: uses [backend/render.yaml](backend/render.yaml). Set env vars from `.env.example`; build `npm install && npx prisma generate && npm run build`, start `npm start`. Run `npx prisma migrate deploy` on release.
- **Frontend → Vercel**: import `frontend/`, set `NEXT_PUBLIC_API_URL` to the Render URL.
- Point backend `CLIENT_URL` at the Vercel domain (CORS + cookies).

---

## 🔐 Multi-Tenancy & Security Notes

- Every tenant table carries `organizationId`; the authenticated org comes from the JWT, and **all** queries filter by it — a user can never read or write another org's rows.
- Sockets authenticate with the access token and join `org:<id>` rooms, so real-time events never cross tenants.
- Refresh tokens are rotated on every use and revocable (stored server-side).
- Admin-only actions are enforced server-side via `requireRole('ADMIN')`, not just hidden in the UI.
# ReadyNest-week5-TeamFlow
