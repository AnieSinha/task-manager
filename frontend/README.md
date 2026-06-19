# TaskFlow Frontend

A React + Vite frontend wired to your FastAPI backend (`http://localhost:8000`).

It follows your real hierarchy: **Backlog → Feature → Story → Task**, plus a dashboard and JWT auth.

## Run it

```bash
npm install
npm run dev
```

This starts on **port 3000** (pinned in `vite.config.js`) because your backend's CORS config
only allows `http://localhost:3000`. Make sure your FastAPI server is running on `localhost:8000`
at the same time.

Open http://localhost:3000 — sign up, then sign in.

## What it does

- **Auth** — `/signup` and `/login`. Token is stored in `localStorage` and sent as
  `Authorization: Bearer <token>` on every authenticated request.
- **Dashboard** (`/`) — pulls `/dashboard/stats`.
- **Backlog** (`/backlog`) — list (`GET /backlog`, filterable by status/priority) and create
  (`POST /backlog`).
- **Features** — opened by clicking a backlog item. Lists `GET /features?backlog_item_id=...`,
  creates via `POST /feature`.
- **Stories** — opened by clicking a feature. Lists `GET /stories?feature_id=...`, creates via
  `POST /story`.
- **Tasks** — opened by clicking a story. Lists `GET /tasks?story_id=...` (filterable by
  status/priority), creates via `POST /tasks`.

## Current backend assumptions (important)

This build assumes you've added the **PATCH/DELETE/single-GET routes** for backlog, feature,
task, plus the assignment routes and `/users` — but **not**:

- `Story.status` field (not added) — so the Stories page has **no status control**, only delete.
- The `/login` 401 fix (not applied) — so login still returns HTTP 200 with a `message` field
  on bad credentials instead of a proper 401. The frontend already handles this by checking for
  a `token` in the response.

If you add either of those later, tell me and I'll re-enable the Story status dropdown and
tighten the login error handling.

## What's interactive now

- **Backlog** — inline status dropdown (Pending/In Progress/Done) and Delete button per row.
- **Features** — same: inline status dropdown and Delete.
- **Stories** — Delete only (no status field on the backend yet).
- **Tasks** — inline status and priority dropdowns, Delete, and an "Assign…" control per task
  that calls `POST /tasks/{id}/assign` using the list from `GET /users`. Currently assigned
  people are shown by their user ID under each task (since `/users` only returns id/name/email
  and the assignment record stores the id) — if `GET /users` isn't available yet, the assign
  control simply won't render for that session.

## Things I noticed about the backend you may want to add later

These aren't blocking, but the frontend currently can't do them because the routes don't exist:

1. **No update/delete endpoints anywhere** (`PATCH`/`PUT`/`DELETE` for backlog, feature, story,
   task). Right now nobody can mark a task "Done" or change priority after creation. This is the
   highest-value addition — at minimum `PATCH /tasks/{task_id}` to update `status`.
2. **`Story` model has no `status` column**, but `GET /stories` accepts a `status` query filter
   that can never match anything. Either add a `status` field to `Story` or drop the filter.
3. **`POST /login` returns HTTP 200 even on bad credentials** (with a `message` but no `token`,
   instead of a 401). The frontend handles this gracefully, but a proper `401` would be more
   conventional for any other client consuming this API.
4. **No "get single item" routes** (`GET /backlog/{id}`, `GET /tasks/{id}`, etc.) — the frontend
   gets by detail via list filters and passed-along navigation state instead. Single-item GETs
   would make deep-linking/refreshing a task page reliable.
5. **No task assignment endpoints exposed** even though `Task_Assignments` exists as a model —
   if you want "assign to a user" in the UI, you'll need `POST /tasks/{id}/assign` and a way to
   list users.
6. **CORS is locked to `localhost:3000`** — fine for local dev, but you'll need to update
   `allow_origins` in `main.py` before deploying the frontend anywhere else.

Let me know if you'd like help adding any of these on the backend, or if you want me to wire the
frontend up to them once they exist.
