# TaskFlow — Task Management System

A full-stack Task Management System built as a technical test for PT Tenaga Kanggo Indonesia. Users can register, login, and manage their personal tasks with full CRUD operations, status filtering, and title search.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express.js |
| Frontend | React 18 + Vite |
| Database | MySQL 8 |
| Authentication | JWT + bcrypt |
| Styling | Tailwind CSS |
| HTTP Client | Axios |
| Containerization | Docker + Docker Compose |

---

## Key Features

- **Authentication** — Register, login, logout with JWT. Token stored in localStorage.
- **Protected Routes** — Task pages are inaccessible without a valid token.
- **Task CRUD** — Create, read, update, delete tasks in a modal UI.
- **Task Ownership** — Users can only see, edit, and delete their own tasks.
- **Status Filter** — Filter tasks by All / Pending / In Progress / Done.
- **Title Search** — Search by keyword via query param.
- **Overdue Detection** — Tasks past their deadline are highlighted red.
- **Error Handling** — Friendly error messages on all failures including expired tokens.
- **Responsive UI** — Clean grid layout that works on mobile and desktop.

---

## Quick Start

> **Prerequisites:** Node.js 18+, Docker Desktop

```bash
# 1. Install all dependencies (root + backend + frontend)
npm run install:all

# 2. Configure environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit backend/.env — change JWT_SECRET to a random string

# 3. Run everything with one command
npm run dev
```

This single `npm run dev` command will:
- Start **MySQL 8** via Docker Compose
- Start **Express backend** (port 5000) via Docker Compose
- Start **React Vite frontend** (port 5173) locally

Open **http://localhost:5173** in your browser.

> **Note:** Docker containers keep running after you press Ctrl+C (only frontend stops).  
> To stop all Docker services: `npm run docker:down`

---

## Available Scripts

Run these from the **root** of the project:

| Command | Description |
|---|---|
| `npm run install:all` | Install dependencies for root + backend + frontend |
| `npm run dev` | **Full dev** — Docker (MySQL + backend) + local frontend |
| `npm run dev:frontend` | Frontend only (Vite dev server) |
| `npm run dev:backend` | Backend only (nodemon, needs local MySQL) |
| `npm run dev:local` | Backend + frontend locally — no Docker (needs local MySQL) |
| `npm run docker:up` | Start Docker Compose services in background |
| `npm run docker:down` | Stop and remove Docker Compose services |
| `npm run docker:build` | Rebuild Docker images |
| `npm run docker:logs` | Follow logs from Docker services |
| `npm run test` | Run backend tests (Jest + Supertest, no DB required) |
| `npm run tunnel:backend` | Expose backend via ngrok (optional, see below) |

---

## Run with Docker (MySQL + Backend)

Docker Compose handles MySQL 8 and the backend API together. The backend waits for MySQL to pass its health check before starting.

**Setup:**
```bash
# Copy root env (for Docker Compose variable substitution)
cp .env.example .env
# Edit .env — change JWT_SECRET at minimum

# Start MySQL + backend
npm run docker:up

# Follow logs to verify both services started
npm run docker:logs
```

**Verify backend is running:**
```bash
curl http://localhost:5000/api/health
# {"success":true,"message":"API is running"}
```

**Stop services:**
```bash
npm run docker:down

# Also delete the MySQL data volume (full reset)
docker compose down -v
```

**Rebuild after backend code changes:**
```bash
npm run docker:build && npm run docker:up
```

> For active backend development (with hot-reload), use `npm run dev:local` instead — it runs backend via `nodemon` locally and skips Docker for the API.

---

## Run Frontend

Frontend always runs locally via Vite:

```bash
# Install and start
npm run dev:frontend

# Or from the frontend folder directly
cd frontend && npm install && npm run dev
```

Frontend runs on **http://localhost:5173** and proxies API calls to `http://localhost:5000/api` by default.

To point to a different backend, edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Run Everything Locally (No Docker)

If you have MySQL installed locally and don't want Docker:

**1. Import schema:**
```bash
mysql -u root -p < backend/schema.sql
```

**2. Configure backend:**
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your MySQL credentials
```

**3. Start backend + frontend together:**
```bash
npm run dev:local
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=kanggo_tasks

JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=24h

CORS_ORIGIN=http://localhost:5173
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Server port |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `DB_HOST` | Yes | — | MySQL host |
| `DB_PORT` | No | `3306` | MySQL port |
| `DB_USER` | Yes | — | MySQL user |
| `DB_PASSWORD` | Yes | — | MySQL password |
| `DB_NAME` | Yes | — | Database name |
| `JWT_SECRET` | Yes | — | Signing secret — use a long random string |
| `JWT_EXPIRES_IN` | No | `24h` | Token expiry (e.g. `1h`, `7d`) |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed frontend origin |

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Optional: Expose Backend with ngrok

ngrok lets you create a temporary public URL for your local backend — useful for demos on a different device or sharing with others.

> **ngrok is not required for local development.** Skip this section if running everything locally.

**1. Install ngrok:**  
Download from [ngrok.com](https://ngrok.com/download) and follow the install instructions for your OS.

**2. Authenticate (one-time):**
```bash
ngrok config add-authtoken YOUR_NGROK_AUTH_TOKEN
```

**3. Start tunnel:**
```bash
npm run tunnel:backend
# or directly:
ngrok http 5000
```

**4. Copy the forwarding URL** from the ngrok output, e.g.:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:5000
```

**5. Update frontend env** with the ngrok URL:
```env
# frontend/.env
VITE_API_URL=https://abc123.ngrok-free.app/api
```

**6. Restart frontend:**
```bash
npm run dev:frontend
```

**Important notes:**
- The ngrok URL changes every time the tunnel restarts (on the free plan)
- Update `frontend/.env` and restart frontend whenever the URL changes
- Also update `CORS_ORIGIN` in `backend/.env` to the ngrok URL if you hit CORS errors
- Never use ngrok tunnels in production

---

## Project Structure

```
kanggo-task-management/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js               # MySQL connection pool
│   │   ├── controllers/
│   │   │   ├── authController.js   # register, login
│   │   │   └── taskController.js   # CRUD + filter + search
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT verify middleware
│   │   │   ├── errorHandler.js     # 404 + global error handler
│   │   │   └── rateLimiter.js      # express-rate-limit config
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   └── tasks.js
│   │   ├── utils/
│   │   │   └── response.js         # Consistent JSON response helpers
│   │   └── validators/
│   │       ├── authValidator.js    # express-validator rules
│   │       └── taskValidator.js
│   ├── tests/
│   │   └── auth.test.js            # Jest + Supertest unit tests
│   ├── app.js                      # Express app setup
│   ├── server.js                   # Server entry point
│   ├── schema.sql                  # Database schema
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js            # Axios instance + interceptors
│   │   │   ├── auth.js             # Auth API calls
│   │   │   └── tasks.js            # Task API calls
│   │   ├── components/
│   │   │   ├── ConfirmModal.jsx    # Delete confirmation dialog
│   │   │   ├── Navbar.jsx
│   │   │   ├── PrivateRoute.jsx    # Route guard
│   │   │   ├── TaskCard.jsx        # Single task display
│   │   │   └── TaskModal.jsx       # Create/edit task form
│   │   ├── constants/
│   │   │   └── copy.js             # All UI text — easy to translate
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Global auth state (React Context)
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── TasksPage.jsx
│   │   ├── App.jsx                 # Router setup
│   │   ├── index.css               # Tailwind directives
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── .env.example
│   └── package.json
│
├── package.json                    # Root scripts (run from here)
├── docker-compose.yml
├── .env.example                    # Docker Compose env vars
├── .gitignore
└── README.md
```

---

## Security Features

| Feature | Implementation |
|---|---|
| Password hashing | `bcryptjs` with salt rounds 12 |
| HTTP security headers | `helmet` middleware |
| CORS | Origin restricted via `CORS_ORIGIN` env var |
| Rate limiting | `express-rate-limit` — 20 req/15 min on auth, 200 req/15 min general |
| Payload size limit | `express.json({ limit: '10kb' })` |
| JWT expiration | Configurable via `JWT_EXPIRES_IN` env var |
| SQL injection prevention | `mysql2` parameterized queries (prepared statements) |
| Task ownership | Every task mutation checks `user_id === req.user.id` |
| No password in response | Password hash never returned in any API response |
| Global error handler | Stack traces never leak to client in production |

---

## API Endpoints

All task endpoints require `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login, returns JWT | No |
| GET | `/api/health` | Health check | No |

### Tasks

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/tasks` | List user's tasks | Yes |
| GET | `/api/tasks?status=pending` | Filter by status | Yes |
| GET | `/api/tasks?search=keyword` | Search by title | Yes |
| GET | `/api/tasks?status=done&search=foo` | Combined filter + search | Yes |
| POST | `/api/tasks` | Create task | Yes |
| PUT | `/api/tasks/:id` | Update task | Yes |
| DELETE | `/api/tasks/:id` | Delete task | Yes |

---

## API Examples

### POST /api/auth/register

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": 1, "name": "John Doe", "email": "john@example.com" }
  }
}
```

### POST /api/auth/login

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": 1, "name": "John Doe", "email": "john@example.com" }
  }
}
```

### GET /api/tasks

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "success": true,
  "message": "Tasks retrieved successfully",
  "data": [
    {
      "id": 1,
      "title": "Fix login bug",
      "description": "Token refresh not working",
      "status": "in-progress",
      "deadline": "2026-06-01",
      "created_at": "2026-05-29T10:00:00.000Z",
      "updated_at": "2026-05-29T10:00:00.000Z"
    }
  ]
}
```

### POST /api/tasks

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "title": "Write unit tests",
  "description": "Cover auth endpoints",
  "status": "pending",
  "deadline": "2026-06-10"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": { "id": 2, "title": "Write unit tests", "status": "pending", "deadline": "2026-06-10", "..." : "..." }
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "Task title is required",
  "errors": [
    { "field": "title", "message": "Task title is required" }
  ]
}
```

**Common HTTP status codes:**

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Bad request |
| 401 | Unauthenticated |
| 403 | Forbidden (wrong owner) |
| 404 | Not found |
| 409 | Conflict (e.g. email taken) |
| 422 | Validation error |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## New Features (v2)

### Activity Timeline / Audit Trail
Every task action is logged to `task_activities`: `task_created`, `task_updated`, `status_changed`, `task_assigned`, `comment_added`, `task_completed`, `task_reopened`. Viewable inside **Task Detail** → *Activity Timeline* section.

- `GET /api/tasks/:id/activities` — returns ordered timeline for a task
- Access: super_admin sees all; admin sees division tasks; user sees own/assigned tasks

### Ticket Comments
Full comment CRUD on each task. `POST /api/tasks/:id/comments` also logs an activity and triggers a notification to related users.

- `GET /api/tasks/:id/comments`
- `POST /api/tasks/:id/comments`
- `PUT /api/tasks/:id/comments/:commentId` — owner only
- `DELETE /api/tasks/:id/comments/:commentId` — owner or super_admin

### User Notifications
Bell icon in navbar with unread badge (polls every 60s). Dropdown shows last 50 notifications. Events: `task_assigned`, `comment_added`, `status_changed`, `task_completed`, `task_reopened`. Actor is never notified about their own action.

- `GET /api/notifications` — list (max 50, newest first)
- `GET /api/notifications/unread-count` — badge count
- `PUT /api/notifications/:id/read` — mark one read
- `PUT /api/notifications/read-all` — mark all read

### Dashboard Analytics
Summary cards displayed at the top of the Tasks page. Data is role-scoped.

- super_admin: total tasks by status + overdue + total users + total divisions
- admin: division tasks by status + assigned to me
- user: created by me + assigned to me + by status

`GET /api/dashboard/summary`

### Kanban Board
Toggle between **List** and **Board** view in the Tasks page header. Board shows 3 columns (Pending / In Progress / Done). Drag a card between columns to update status. On failure the UI reverts and shows an error toast. Built with `@dnd-kit/core`.

### Attachment URL Support
Tasks can store an optional `attachment_url`. Validated as a valid URL on backend and frontend. In Task Detail modal:
- If URL is an image (`.jpg`, `.jpeg`, `.png`, `.webp`), a preview thumbnail is shown
- **Open Attachment** link opens the URL in a new tab

### Completion Duration
- `completed_at` is set automatically when status changes to `done`; cleared when reopened
- Response includes `completion_duration_label` ("Completed in 2 hours 15 minutes")
- Response includes `open_duration_label` ("Open for 3 days 4 hours") when not done

### Role-Based Task Visibility
`GET /api/tasks` now respects roles:
- `super_admin`: sees all tasks
- `admin`: sees all tasks in their division
- `user`: sees tasks they created **or** are assigned to

### New Endpoint: GET /api/users
Returns users visible to the caller (for assignee dropdown in task form):
- super_admin: all users
- admin: users in their division
- user: only themselves

---

## Demo Data

The project includes a seed script that populates the database with demo divisions, users, and tasks so reviewers can test all features immediately without creating data manually.

### Run Seed

```bash
# From root
npm run seed

# Or from backend folder
cd backend && npm run seed
```

The seed is **idempotent** — safe to run multiple times. It skips records that already exist.

### Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@taskflow.test` | `password123` |
| User | `user@taskflow.test` | `password123` |
| User | *(your registered account)* | *(your password)* |

### Seeded Data Summary

- **2 Seed Users** — 1 admin, 1 user
- **4 Tasks** — all created by admin, assigned to passyah11

### Reset Demo Data

To fully reset the database and re-seed:

```bash
# Stop and remove Docker volumes (deletes all data)
docker compose down -v

# Restart fresh
npm run dev

# Wait for backend to be healthy, then seed
npm run seed
```

> ⚠️ `docker compose down -v` deletes all data permanently. Only use in local development.

---

## Running Tests

```bash
# From root
npm run test

# Or from backend folder
cd backend && npm test
```

Tests use Jest + Supertest with a mocked DB — no real MySQL needed.

**Test coverage:**
- Register validation (missing name, invalid email, short password)
- Login validation (missing email, invalid credentials)
- Protected route returns 401 without token
- Protected route returns 401 with malformed token

---

## Manual Testing Checklist

**Authentication**
- [ ] Register with valid data → redirected to task list
- [ ] Register with duplicate email → error message shown
- [ ] Register with short password → validation error shown
- [ ] Login with correct credentials → redirected to task list
- [ ] Login with wrong password → error message shown
- [ ] Access `/tasks` without login → redirected to login page
- [ ] Click Logout → token cleared, redirected to login

**Task CRUD**
- [ ] Create task with only title → success toast, task appears
- [ ] Create task with all fields → success toast, task appears
- [ ] Create task with empty title → validation error shown
- [ ] Edit task title → success toast, title updated
- [ ] Edit task status to Done → status badge updates
- [ ] Delete task → confirmation dialog appears
- [ ] Confirm delete → task removed, success toast

**Filter & Search**
- [ ] Click "Pending" filter → only pending tasks shown
- [ ] Click "In Progress" filter → only in-progress tasks shown
- [ ] Click "Done" filter → only done tasks shown
- [ ] Click "All" filter → all tasks shown
- [ ] Search by partial title → matching tasks shown
- [ ] Clear search → all tasks shown again
- [ ] Combine filter + search → both applied correctly

**Security**
- [ ] User A cannot see User B's tasks
- [ ] PUT `/api/tasks/:id` with User A's token on User B's task → 403
- [ ] DELETE `/api/tasks/:id` with wrong user → 403

---

## Screenshots

> Screenshots will be added after the app is running locally.

| Page | Screenshot |
|---|---|
| Login | _(coming soon)_ |
| Register | _(coming soon)_ |
| Task List | _(coming soon)_ |
| Add Task Modal | _(coming soon)_ |
| Edit Task Modal | _(coming soon)_ |
| Delete Confirmation | _(coming soon)_ |

---

## Video Demo

> [Video demo link will be added here]

Duration: ≤ 15 minutes  
Covers: Register → Login → Create tasks → Filter → Search → Edit → Delete → Logout

---

## Future Improvements

Features intentionally left out of scope but planned for production:

- **Refresh Token** — Token rotation to improve security without forcing re-logins.
- **Role-Based Access Control** — Admin role for user management.
- **Admin Dashboard** — Overview metrics (tasks by status, user count, etc.).
- **Admin Approval Flow** — New accounts require admin approval.
- **Audit Log** — Track who created/modified/deleted what and when.
- **Multilingual UI** — `src/constants/copy.js` is already structured to support i18n.
- **Pagination** — `page` + `limit` query params for large task lists.
- **Email Notifications** — Deadline reminders via email.
- **Deployment** — CI/CD to Render (backend) + Vercel (frontend).

---

## Security Notes

- Never commit `.env` files — only `.env.example` is committed.
- Change `JWT_SECRET` to a cryptographically random string (32+ chars) in production.
- `CORS_ORIGIN` restricts which frontend origins can call the API — update it when using ngrok.
- Rate limiting defaults are lenient for development — tighten in production.
- Set `NODE_ENV=production` in production to prevent stack traces leaking in API responses.
- MySQL credentials in `docker-compose.yml` defaults are for local development only.
