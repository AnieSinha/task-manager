# TaskForge — Full-Stack Task Manager

A role-based task management system with a React frontend and Node.js backend.

---

## Project Structure

```
task-manager/
├── backend/      # Node.js/Express API
├── frontend/     # React app (TaskForge UI)
├── README.md
└── requirements.txt
```

---

## Frontend Setup

```bash
cd frontend
cp .env.example .env          # Set your API URL if needed
npm install
npm start                     # Runs on http://localhost:3000
```

### Build for production
```bash
npm run build
```

---

## Backend Setup

```bash
cd backend
npm install
npm start                     # Runs on http://localhost:5000
```

Make sure your `.env` in `backend/` has DB credentials and `JWT_SECRET`.

---

## Frontend Features

- **Auth** — JWT-based login & signup
- **Dashboard** — stats overview, recent tasks, priority breakdown
- **Tasks Table** — filter by priority/status, inline status updates, assign tasks
- **Kanban Board** — drag & drop cards across status columns
- **Assignments** — view unassigned tasks, assign to team members

---

## API Endpoints Used

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id/status` | Update status |
| POST | `/api/task-assignments` | Assign task |
| GET | `/api/users` | List users (for assignment) |
| GET | `/api/stories` | List stories (for task creation) |

> **Note:** `GET /api/users` and `GET /api/stories` may need to be added to your backend if not present. The frontend gracefully handles their absence.

---

## Environment Variables

### Frontend (`frontend/.env`)
```
REACT_APP_API_URL=http://localhost:5000/api
```

### Backend (`backend/.env`)
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_manager
DB_USER=your_user
DB_PASS=your_password
JWT_SECRET=your_secret_key
```
