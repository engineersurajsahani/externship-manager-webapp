# Externship Manager — Frontend (React)

This README covers local setup for the frontend app in `frontend-react` (React + Tailwind).

## Prerequisites

- Node.js (v16+ recommended)
- npm (or yarn)
- Backend API running (see `../backend/README.md`) — default backend base URL: `http://localhost:5050/api`

## Configure

The frontend checks `process.env.REACT_APP_API_URL` to override the API base URL. Example (create a `.env` file in `frontend-react/`):

```
REACT_APP_API_URL=http://localhost:5050/api
```

If not set, the frontend defaults to `http://localhost:5050/api`.

## Install

```bash
cd frontend-react
npm install
```

## Run

```bash
cd frontend-react
npm start
```

The app will run on `http://localhost:3000` by default.

## Seeded demo accounts (from backend seed)

After running the backend seed script (`backend/seed-enhanced.js`), the demo credentials include:

- `admin@example.com` / `admin123`
- `pm@example.com` / `pm123456`
- `tl@example.com` / `tl123456`
- `intern1@example.com` / `intern123`

Use these to sign in via the app (the login page expects a token in `localStorage` or an API-backed login flow).

## Tips

- If you change the API base URL, restart the frontend dev server.
- If chat messages don't appear for other users, ensure you're authenticated and assigned to the same project; message visibility is restric
