# TaskFlow — Task Management System

A full-stack Task Management System built as a technical test for PT Tenaga Kanggo Indonesia. Users can register, login, and manage tasks with full CRUD, Kanban board, comments, activity timeline, and role-based access.

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
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Containerization | Docker + Docker Compose |

---

## Key Features

- **Authentication** — Register, login, logout with JWT. Token stored in localStorage.
- **Protected Routes** — Task pages are inaccessible without a valid token.
- **Role System** — `admin` creates and manages tasks; `user` views and updates tasks they own or are assigned to.
- **Task CRUD** — Create, read, update, delete tasks with confirmation modal.
- **Kanban Board** — Visual board with Pending / In Progress / Done columns. Drag cards to change status or reorder within a column.
- **Status Filter** — Filter by All / Pending / In Progress / Done.
- **Advanced Filters** — Filter by deadline (overdue, this week, no deadline) and assignment (assigned, unassigned, assigned to me).
- **Title Search** — Search tasks by keyword.
- **Pagination** — 9 tasks per page; page/filter/search state synced to URL query params.
- **Task Comments** — Add, edit, delete comments on each task.
- **Activity Timeline** — Audit log of every task action inside Task Detail view.
- **Attachment URL** — Tasks can store an optional URL; images render as a preview thumbnail.
- **User Profile** — Edit name and change password from the profile page.
- **Skeleton Loading** — Skeleton UI shown on initial data fetch.
- **Overdue Detection** — Tasks past deadline are highlighted red.
- **Responsive UI** — Works on mobile and desktop.

---

## Quick Start

> **Prerequisites:** Node.js 18+, Docker Desktop

```bash
# 1. Install all dependencies (root + backend + frontend)
npm run install:all

# 2. Copy and configure environment
cp .env.example .env
# Edit .env — change JWT_SECRET to a random string

# 3. Run everything with one command
npm run dev
```

`npm run dev` starts:
- **MySQL 8** via Docker Compose
- **Express backend** on port 5000 via Docker Compose
- **Vite frontend** on port 5173 locally

Open **http://localhost:5173**

> Docker containers keep running after Ctrl+C (only frontend stops).  
> Stop Docker: `npm run docker:down`

---

## Available Scripts

Run from the **project root**:

| Command | Description |
|---|---|
| `npm run install:all` | Install dependencies for root + backend + frontend |
| `npm run dev` | Start MySQL + backend (Docker) + frontend (local) |
| `npm run dev:frontend` | Frontend only (Vite dev server) |
| `npm run dev:local` | Backend + frontend locally — no Docker |
| `npm run docker:up` | Start Docker Compose services in background |
| `npm run docker:down` | Stop Docker Compose services |
| `npm run docker:build` | Rebuild Docker images |
| `npm run docker:logs` | Follow Docker service logs |
| `npm run seed` | Populate database with demo data |
| `npm run test` | Run backend unit tests |

---

## Docker Setup (MySQL + Backend)

```bash
# Copy root env for Docker Compose
cp .env.example .env

# Start services
npm run docker:up

# Verify backend
curl http://localhost:5000/api/health
# → {"success":true,"message":"API is running"}

# Stop
npm run docker:down

# Full reset (deletes all data)
docker compose down -v
```

---

## Run Frontend

```bash
npm run dev:frontend
```

Frontend proxies API calls to `http://localhost:5000/api` by default.  
Override in `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Run Without Docker

```bash
mysql -u root -p < backend/schema.sql
cp backend/.env.example backend/.env
# Edit backend/.env with your MySQL credentials
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
| `JWT_SECRET` | Yes | — | Signing secret — use 32+ random chars |
| `JWT_EXPIRES_IN` | No | `24h` | Token expiry |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed frontend origin |

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Project Structure

```
kanggo-task-management/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                    # MySQL connection pool
│   │   ├── controllers/
│   │   │   ├── authController.js        # register, login
│   │   │   ├── taskController.js        # CRUD + filters + pagination
│   │   │   ├── commentController.js     # Comment CRUD
│   │   │   ├── activityController.js    # Activity timeline read
│   │   │   ├── dashboardController.js   # Dashboard summary
│   │   │   └── userController.js        # User list + profile
│   │   ├── middleware/
│   │   │   ├── auth.js                  # JWT verify middleware
│   │   │   ├── role.js                  # Role-based access middleware
│   │   │   ├── errorHandler.js          # 404 + global error handler
│   │   │   └── rateLimiter.js           # express-rate-limit config
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── tasks.js                 # Tasks + comments + activities
│   │   │   ├── users.js                 # User list + profile
│   │   │   └── dashboard.js
│   │   ├── utils/
│   │   │   ├── activityHelper.js        # Non-blocking activity logger
│   │   │   ├── durationHelper.js        # Task duration formatting
│   │   │   ├── taskAccess.js            # Role-based task access helper
│   │   │   └── response.js              # Consistent JSON response helpers
│   │   ├── validators/
│   │   │   ├── authValidator.js
│   │   │   ├── taskValidator.js
│   │   │   └── commentValidator.js
│   │   └── scripts/
│   │       └── seed.js                  # Idempotent demo data seeder
│   ├── tests/
│   │   └── auth.test.js                 # Jest + Supertest unit tests
│   ├── app.js
│   ├── server.js                        # DB retry + server start
│   ├── schema.sql                       # Database schema (fresh install)
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js                 # Axios instance + auth interceptor
│   │   │   ├── auth.js
│   │   │   ├── tasks.js
│   │   │   ├── comments.js
│   │   │   ├── activities.js
│   │   │   └── users.js
│   │   ├── components/
│   │   │   ├── ActivityTimeline.jsx     # Task activity log
│   │   │   ├── CommentSection.jsx       # Task comments
│   │   │   ├── ConfirmModal.jsx
│   │   │   ├── KanbanBoard.jsx          # Drag-and-drop board
│   │   │   ├── Navbar.jsx
│   │   │   ├── PasswordInput.jsx        # Eye toggle password field
│   │   │   ├── PasswordStrength.jsx     # Password strength indicator
│   │   │   ├── PrivateRoute.jsx
│   │   │   ├── Skeleton.jsx             # Loading skeleton components
│   │   │   ├── TaskCard.jsx
│   │   │   ├── TaskDetailModal.jsx      # Task detail with comments + timeline
│   │   │   └── TaskModal.jsx            # Create/edit task form
│   │   ├── constants/
│   │   │   └── copy.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── ProfilePage.jsx          # Edit name + change password
│   │   │   ├── RegisterPage.jsx
│   │   │   └── TasksPage.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── .env.example
│   └── package.json
│
├── package.json                         # Root scripts
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## Database Schema

```
users          id, name, email, password, role ENUM('admin','user'), division_id, created_at, updated_at
tasks          id, title, description, status ENUM('pending','in-progress','done'), deadline,
               user_id (FK), assigned_to_user_id (FK), division_id, attachment_url, completed_at, created_at, updated_at
task_activities id, task_id (FK), user_id (FK), action, field_name, old_value, new_value, created_at
task_comments  id, task_id (FK), user_id (FK), comment, created_at, updated_at
```

---

## Role System

| Role | Access |
|---|---|
| `admin` | Create tasks, assign to users, delete any visible task, see all tasks |
| `user` | View/edit tasks they created or are assigned to, delete their own tasks |

New registrations default to `user` role. Role is managed by an administrator.

---

## Postman Collection

A ready-to-import Postman Collection is included in the repository.

**File:** `docs/postman/TaskFlow_API.postman_collection.json`

**How to import:**
1. Open Postman → click **Import**
2. Select the file `docs/postman/TaskFlow_API.postman_collection.json`
3. The collection appears with all folders and variables pre-configured

**How to use:**
1. Run **Login (Admin)** or **Login (User)** request first
2. The token is **automatically saved** to `{{token}}` variable via the Tests script
3. All protected endpoints use `Bearer {{token}}` — no manual copy-paste needed
4. After `POST Create Task`, the `task_id` is also saved automatically

**Collection Variables:**

| Variable | Default | Description |
|---|---|---|
| `base_url` | `http://localhost:5000` | Backend URL |
| `token` | _(auto-filled on login)_ | JWT token |
| `task_id` | _(auto-filled on create)_ | Task ID for update/delete |
| `comment_id` | _(auto-filled on add comment)_ | Comment ID |

---

## API Endpoints

All endpoints except auth require `Authorization: Bearer <token>`.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/health` | Health check |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | List tasks (paginated when `?page=` provided) |
| GET | `/api/tasks?status=pending` | Filter by status |
| GET | `/api/tasks?search=keyword` | Search by title |
| GET | `/api/tasks?page=1&limit=9` | Paginated list |
| GET | `/api/tasks?deadline=overdue` | Filter by deadline |
| GET | `/api/tasks?assigned=me` | Filter by assignment |
| POST | `/api/tasks` | Create task (admin only) |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

**Pagination response:**
```json
{
  "success": true,
  "data": {
    "tasks": [...],
    "pagination": { "page": 1, "limit": 9, "total": 20, "totalPages": 3 }
  }
}
```

### Comments

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks/:id/comments` | List comments for a task |
| POST | `/api/tasks/:id/comments` | Add comment |
| PUT | `/api/tasks/:id/comments/:cid` | Edit own comment |
| DELETE | `/api/tasks/:id/comments/:cid` | Delete own comment (or admin) |

### Activity Timeline

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks/:id/activities` | Get activity log for a task |

Actions logged: `task_created`, `task_updated`, `status_changed`, `task_assigned`, `task_completed`, `comment_added`

### Users

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List all users with role=user (for assignee dropdown) |
| GET | `/api/users/me` | Get current user profile |
| PUT | `/api/users/me` | Update name |
| PUT | `/api/users/me/password` | Change password |

---

## API Response Format

**Success:**
```json
{ "success": true, "message": "...", "data": { ... } }
```

**Error:**
```json
{ "success": false, "message": "...", "errors": [{ "field": "title", "message": "..." }] }
```

**Common status codes:**

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (wrong role or ownership) |
| 404 | Not found |
| 409 | Conflict (e.g. email taken) |
| 422 | Validation error |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## Security

| Feature | Implementation |
|---|---|
| Password hashing | `bcryptjs` salt rounds 12 |
| HTTP headers | `helmet` middleware |
| CORS | Restricted via `CORS_ORIGIN` env var |
| Rate limiting | 20 req/15 min (auth), 200 req/15 min (general) |
| Payload size | `express.json({ limit: '10kb' })` |
| JWT expiry | Configurable via `JWT_EXPIRES_IN` |
| SQL injection | `mysql2` parameterized queries |
| Password in response | Never returned in any API response |
| Error leakage | Stack traces never sent in production |

---

## Demo Data

```bash
npm run seed
```

The seed is **idempotent** — safe to run multiple times.

### Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@taskflow.test` | `password123` |
| User | `user@taskflow.test` | `password123` |
| User | *(your registered account)* | *(your password)* |

### Seeded Data

- 2 users: 1 admin, 1 user
- 20 tasks across pending / in-progress / done statuses (all created by admin, assigned to user)

### Reset

```bash
docker compose down -v && docker compose up -d
npm run seed
```

---

## Running Tests

```bash
npm run test
```

Tests use Jest + Supertest with a mocked database — no real MySQL needed.

**Coverage:**
- Register: missing name, invalid email, short password
- Login: missing email, wrong credentials
- Protected route: 401 without token, 401 with malformed token

---

## Manual Testing Checklist

**Auth**
- [ ] Register with valid data → redirected to tasks
- [ ] Register with duplicate email → error shown
- [ ] Register with weak password → validation error
- [ ] Login → redirected to tasks
- [ ] Login with wrong password → error shown
- [ ] Access `/tasks` without login → redirected to login
- [ ] Logout → token cleared, redirected to login

**Task CRUD**
- [ ] Admin: create task, assign to user → appears in board
- [ ] Edit task title, description, status, deadline
- [ ] Drag card to different column → status updates
- [ ] Delete task → confirmation dialog → removed
- [ ] User: cannot see "+ Add Task" button
- [ ] User: can delete tasks assigned to them

**Filter & Search**
- [ ] Status filter (Pending / In Progress / Done / All)
- [ ] Deadline filter (Overdue / This Week / No Deadline)
- [ ] Assignment filter (Has Assignee / Unassigned / Assigned to Me)
- [ ] Search by title keyword
- [ ] Combine filters → all applied
- [ ] URL reflects filter state (shareable link)

**Pagination**
- [ ] Navigate pages with Prev/Next
- [ ] Page numbers clickable
- [ ] Count shows "1–9 of 20"

**Comments & Timeline**
- [ ] View task → Comments section + Activity Timeline visible
- [ ] Add comment → appears immediately
- [ ] Edit own comment → updates inline
- [ ] Delete own comment → removed
- [ ] Activity shows task_created, status_changed, task_assigned, task_completed

**Profile**
- [ ] Click profile icon in navbar → /profile
- [ ] Name field pre-filled and editable
- [ ] Email field shown but disabled
- [ ] Role shown but disabled
- [ ] Change password with strength indicator
- [ ] Confirm password mismatch → inline error

---

## Screenshots

| Page | Screenshot |
|---|---|
| Login | _(add screenshot)_ |
| Register | _(add screenshot)_ |
| Kanban Board | _(add screenshot)_ |
| Task Detail (with comments + timeline) | _(add screenshot)_ |
| Profile Page | _(add screenshot)_ |

---

## Video Demo

> [Video demo link — add after recording]

Duration: ≤ 15 minutes  
Covers: Register → Login → Create task → Assign → Kanban drag → Filter → Search → Comments → Profile → Logout

---

## Security Notes

- Never commit `.env` — only `.env.example` is in the repository.
- Change `JWT_SECRET` to a cryptographically random string (32+ chars) in production.
- `CORS_ORIGIN` restricts allowed frontend origins — update when using ngrok or deploying.
- Rate limiting defaults are lenient for local development.
- Set `NODE_ENV=production` to suppress stack traces in API error responses.
