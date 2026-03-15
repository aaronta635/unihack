# StudyGo (UniHack 2026)

**Learn. Play. Conquer.** — An interactive study game with course-based quizzes, 3D gameplay, AI tutor, and real-time Arena battles.

**Live site:** [https://unihack-xi.vercel.app/](https://unihack-xi.vercel.app/) — you can use the app there without running anything locally.

---

## Overview

StudyGo is a full-stack educational quiz platform:

- **Dashboard** — Browse schools and courses, view leaderboards, manage weeks.
- **Solo play** — 3D checkpoint game (`GamePlay`) or battle-style quiz (`GameFight`) with MCQ questions from the database.
- **Arena** — Real-time 1v1 matches over WebSocket (Socket.io); questions loaded from the same API.
- **Auth** — Sign up / log in via backend (Supabase); optional Admin/Student role.
- **AI tutor** — Chat and text-to-speech (OpenAI) for study hints.
- **Content** — Admins can upload PDFs; backend generates MCQ questions and stores them in Supabase.

---

## Tech Stack

| Layer    | Stack |
|----------|--------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS, Framer Motion, Three.js, Socket.io-client |
| **Backend**  | Node.js, Express, Supabase (auth + Postgres), OpenAI, Socket.io, Multer, pdf-parse |
| **Deploy**   | Frontend: Vercel (or similar). Backend: Render (or similar). DB: Supabase |

---

## Project Structure

```
unihack-2026/
├── frontend/                 # Next.js app (port 3001 in dev)
│   ├── app/                  # App Router pages
│   │   ├── page.tsx          # Landing + login/signup
│   │   ├── Dashboard/        # Dashboard, courses, leaderboard
│   │   ├── GamePlay/         # 3D checkpoint quiz (GameCanvas3D)
│   │   ├── GameFight/        # Battle quiz (GameCanvasFight)
│   │   └── Arena/            # Real-time 1v1 Arena
│   ├── components/           # UI, game canvases, dashboard
│   ├── lib/                  # API client, auth context, arena socket
│   └── .env.example
├── backend/                  # Express API (port 3000)
│   ├── bin/www               # Server entry
│   ├── routes/               # auth, scores, upload, tutor, etc.
│   ├── middleware/           # requireAuth, optionalAuth, requireAdmin
│   ├── arenaSocket.js        # Socket.io arena + question fetch
│   ├── supabase.js           # Supabase anon client (auth)
│   ├── supabaseClient.js     # getSupabase / getSupabaseAdmin
│   ├── scripts/              # Seed SQL, test scripts
│   └── .env                  # Not committed; use .env.example pattern
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project (for auth + DB)
- (Optional) OpenAI API key for tutor chat/speech
- (Optional) LiveKit for future real-time features

### 1. Backend

```bash
cd backend
# Create .env with the variables listed below (no .env.example is committed)
npm install
npm start
```

Runs at **http://localhost:3000**.

**Backend environment variables** (in `backend/.env`):

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default 3000) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | For admin ops (e.g. role update) |
| `OPENAI_API_KEY` | For tutor chat and TTS |
| `FT_MODEL_BEST_FRIEND` | (Optional) Fine-tuned model for tutor |

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:3000 (no trailing slash)
npm install
npm run dev
```

Runs at **http://localhost:3001**.

**Frontend environment variables** (in `frontend/.env.local` or Vercel):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL, e.g. `https://your-backend.onrender.com` or `http://localhost:3000`. **No trailing slash.** |
| `NEXT_PUBLIC_WS_URL` | (Optional) WebSocket URL for Arena if different from API host |
| `NEXT_PUBLIC_APP_LOGIN_URL` | (Optional) Login redirect path (default `/`) |

**Important:** `NEXT_PUBLIC_*` is baked in at **build time**. After changing it (e.g. on Vercel), redeploy so the client uses the correct API URL.

### 3. Database (Supabase)

- Create tables for `scores`, `questions`, `player_stats`, etc. (see backend usage and any migration/seed scripts).
- Run seed SQL for sample questions, e.g. `backend/scripts/seed-questions-two-weeks.sql` in the Supabase SQL Editor.
- Enable Email auth (or your chosen auth method) in Supabase Dashboard.

---

## API Summary

| Method | Path | Description |
|--------|------|-------------|
| **Auth** | | |
| POST | `/auth/signup` | Register (email, password, display_name) |
| POST | `/auth/login` | Login; returns `user` + `session` (access_token, refresh_token) |
| GET | `/auth/me` | Current user (Bearer token) |
| PATCH | `/auth/me/role` | Set role to `admin` or `student` (Bearer) |
| **Scores & questions** | | |
| POST | `/api/scores` | Submit score (optional Bearer for user link + stats) |
| GET | `/api/leaderboard` | Leaderboard entries |
| GET | `/api/questions?course_id=...&week_number=...` | MCQ list for a course/week |
| GET | `/api/stats` | Player stats (Bearer) |
| PATCH | `/api/stats` | Allocate stat point (Bearer) |
| **Content** | | |
| POST | `/upload/pdf` | Upload PDF + generate questions (Bearer, admin) |
| **Tutor** | | |
| POST | `/tutor/chat` | AI chat reply |
| POST | `/tutor/speech` | Text-to-speech (returns audio blob) |

Swagger docs (when running backend): **http://localhost:3000/api-docs**.

---

## Game Data Flow

- **GamePlay** (3D) and **GameFight** (battle) load questions from **GET /api/questions** when `course_id` and `week_number` are set; otherwise they use in-app demo questions.
- **Arena** uses the same backend: Socket.io server fetches questions from the DB (via the same Supabase `questions` table) when a room is created.

---

## Deployment

- **Frontend:** Build with `npm run build`; set `NEXT_PUBLIC_API_URL` to your production backend URL and redeploy (e.g. Vercel).
- **Backend:** Set all env vars on the host (e.g. Render); ensure CORS allows your frontend origin (default `cors()` allows all; tighten if needed).
- **Auth:** Ensure Supabase URL/keys match the environment; no trailing slash on `NEXT_PUBLIC_API_URL` to avoid broken paths like `//auth/login`.

---

## License

Private / UniHack 2026.
