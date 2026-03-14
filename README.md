# CircleRecs

A social media tracking app for Books, Movies, and TV Shows. Connect with friends, track what you're watching/reading, and get AI-powered recommendations.

## Tech Stack

- **Frontend**: React 18 + Vite, SCSS, Redux Toolkit, React Router v6
- **Backend**: Node.js + NestJS (TypeScript), Prisma ORM
- **Database**: PostgreSQL (Docker)
- **Cache**: Redis (Docker)
- **Auth**: JWT + Google OAuth
- **AI**: Claude API or OpenAI (recommendations — configurable via `AI_PROVIDER`)
- **Media APIs**: OMDb (movies/shows), Google Books API

---

## Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) v18+
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (for Postgres + Redis)
- Git

---

## 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/CircleRecs.git
cd CircleRecs
```

---

## 2. Install dependencies

```bash
npm run install:all
```

---

## 3. Set up environment variables

### Backend — create `backend/.env`

Copy the example file and fill in your values:

```bash
cp backend/.env.example backend/.env
```

Then open `backend/.env` and fill in:

```env
# Database (leave as-is for local Docker setup)
DATABASE_URL="postgresql://circlerecs_user:password@localhost:5433/circlerecs"

# JWT secrets — make up any random 32+ character strings
JWT_SECRET="your-random-secret-min-32-chars"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="a-different-random-secret-min-32-chars"
JWT_REFRESH_EXPIRES_IN="7d"
COOKIE_SECRET="another-random-secret-min-32-chars"

# Google OAuth — from https://console.cloud.google.com
# APIs & Services → Credentials → Create OAuth 2.0 Client ID
GOOGLE_CLIENT_ID="xxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxx"
GOOGLE_CALLBACK_URL="http://localhost:3000/api/auth/google/callback"

# AI Provider — choose "claude" or "openai"
AI_PROVIDER="claude"

# Anthropic Claude — https://console.anthropic.com (used when AI_PROVIDER=claude)
ANTHROPIC_API_KEY="sk-ant-xxxx"

# OpenAI — https://platform.openai.com/api-keys (used when AI_PROVIDER=openai)
OPENAI_API_KEY="sk-proj-xxxx"

# OMDb API — free key from https://www.omdbapi.com/apikey.aspx
OMDB_API_KEY="xxxxxxxx"

# Google Books API — from https://console.cloud.google.com
# Enable "Books API" → Credentials → Create API Key
GOOGLE_BOOKS_API_KEY="AIzaxxxx"

# Server config (leave as-is for local dev)
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
REDIS_URL="redis://localhost:6379"
```

### Frontend — create `frontend/.env`

```bash
cp frontend/.env.example frontend/.env
```

Then open `frontend/.env` and fill in:

```env
VITE_API_BASE_URL="http://localhost:3000/api"
VITE_GOOGLE_CLIENT_ID="xxxx.apps.googleusercontent.com"
```

> `VITE_GOOGLE_CLIENT_ID` is the same Client ID from your Google OAuth setup.

---

## 4. API Keys — where to get them

| Key | Where to get | Cost |
|-----|-------------|------|
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → Create OAuth 2.0 Client ID | Free |
| `GOOGLE_BOOKS_API_KEY` | [console.cloud.google.com](https://console.cloud.google.com) → Enable "Books API" → Credentials → Create API Key | Free |
| `AI_PROVIDER` | Set to `claude` or `openai` in your `.env` | — |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys — use when `AI_PROVIDER=claude` | Pay per use |
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) — use when `AI_PROVIDER=openai` | Pay per use |
| `OMDB_API_KEY` | [omdbapi.com/apikey.aspx](https://www.omdbapi.com/apikey.aspx) | Free (1,000 req/day) |

### Google OAuth setup tip

When creating the OAuth 2.0 Client ID, add these to **Authorized redirect URIs**:
```
http://localhost:3000/api/auth/google/callback
```

---

## 5. Start the database and cache

Make sure Docker Desktop is running, then:

```bash
npm run db:up
```

This starts PostgreSQL (port 5433) and Redis (port 6379) in Docker containers.

---

## 6. Run database migrations

```bash
npm run db:migrate
```

This creates all the tables in the database.

---

## 7. Start the app

```bash
npm run dev
```

This starts both frontend and backend concurrently:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api

---

## Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend + backend together |
| `npm run dev:be` | Start backend only |
| `npm run dev:fe` | Start frontend only |
| `npm run db:up` | Start Docker containers (Postgres + Redis) |
| `npm run db:down` | Stop Docker containers |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio (DB browser) at http://localhost:5555 |
| `npm run build` | Build frontend + backend for production |
| `npm run install:all` | Install all dependencies (root + backend + frontend) |

---

## Project structure

```
CircleRecs/
├── backend/          # NestJS API
│   ├── src/
│   │   ├── auth/         # JWT + Google OAuth
│   │   ├── users/        # User profiles
│   │   ├── media/        # Books, movies, TV tracking
│   │   ├── friends/      # Friend requests + connections
│   │   ├── recommendations/  # AI recommendations (Claude or OpenAI)
│   │   ├── stats/        # Year in review + stats
│   │   ├── redis/        # Redis cache (username lookup)
│   │   └── prisma/       # Database client
│   └── prisma/
│       └── schema.prisma # Database schema
├── frontend/         # React + Vite app
│   └── src/
│       ├── pages/        # Route pages
│       ├── components/   # Shared components
│       ├── store/        # Redux state
│       └── styles/       # SCSS variables + global styles
├── docker-compose.yml
└── package.json      # Root scripts
```
