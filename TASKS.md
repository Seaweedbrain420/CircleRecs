# CircleRecs - Task Checklist

Track our progress here. Check off items as we complete them.

---

## Phase 1 – Infrastructure

- [x] Create monorepo root files: `.gitignore`, `docker-compose.yml`
- [x] Bootstrap NestJS in `backend/` — all deps installed (Prisma v5, JWT, Passport, bcrypt, etc.)
- [x] Configure `main.ts` (CORS, Helmet, ValidationPipe, cookie-parser, global `/api` prefix)
- [x] Configure `app.module.ts` (ConfigModule global, ThrottlerModule)
- [x] Write Prisma `schema.prisma` with all models (User, Media, MediaEntry, FriendRequest, Friendship, Recommendation)
- [x] Bootstrap Vite + React in `frontend/` (TypeScript template)
- [x] Install frontend dependencies (Redux Toolkit, React Router, Axios, SASS, Tailwind v4, Radix UI)
- [x] Configure ShadCN — `components.json`, `lib/utils.ts`, `Button` component, CSS variables
- [x] Set up Redux store (`authSlice`, `uiSlice`, `store/index.ts`)
- [x] Axios API client with Bearer token + 401 refresh interceptor (`services/api.ts`)
- [x] All type definitions (`user.types.ts`, `media.types.ts`)
- [x] Wire Redux Provider into `main.tsx`, React Router in `App.tsx`
- [x] Start Docker containers (`docker compose up -d`) — port 5433 (local postgres on 5432)
- [x] Run first Prisma migration — all 6 tables created ✓

---

## Phase 2 – Authentication

- [x] **Frontend**: Build `LoginPage` with aurora animated gradient background
- [x] **Frontend**: Build `RegisterPage`
- [x] **Frontend**: `ProtectedRoute` wrapper + session restore on mount (refresh cookie)
- [x] **Backend**: Build `PrismaService` (global singleton)
- [x] **Backend**: Build `AuthModule` — register, login, logout, refresh (bcrypt + JWT)
- [x] **Backend**: Implement `JwtStrategy` + global `JwtAuthGuard` + `@Public()` decorator
- [x] **Backend**: Implement `GoogleStrategy` (Passport Google OAuth 2.0) + find-or-create user
- [x] **Backend**: Refresh token in httpOnly cookie; access token in response body only
- [x] **Tested**: POST /api/auth/register ✓ and POST /api/auth/login ✓ returning user + JWT

---

## Phase 3 – Core Media Tracking

- [x] **Backend**: Build `OmdbService` (movie + TV show search + detail fetch)
- [x] **Backend**: Build `GoogleBooksService` (book search — works without API key too)
- [x] **Backend**: Build `MediaModule` (search, add entry, update entry, delete entry, get library)
- [x] **Backend**: `getFriendActivity` — recent entries from all friends
- [x] **Frontend**: Build `AppLayout` — sidebar nav + user info + sign out
- [x] **Frontend**: Build `SearchPage` with debounced input + type toggle + results
- [x] **Frontend**: Build `SearchResultCard` + `AddEntryModal`
- [x] **Frontend**: Build `MediaCard` component (cover, status badge, rating)
- [x] **Frontend**: Build `LibraryPage` with type tabs + status filter + grid
- [x] **Frontend**: Implement `mediaSlice` with all thunks
- [ ] ⚠️ **API Keys needed**: Add real keys to `backend/.env` — `OMDB_API_KEY` (free at omdbapi.com) + `GOOGLE_BOOKS_API_KEY` (optional, works without it)

---

## Phase 4 – Friends

- [ ] **Backend**: Build `FriendsModule` (send/accept/reject request, list friends, remove friend)
- [ ] **Frontend**: Build `FriendsPage` (user search, pending requests, friends list)
- [ ] **Frontend**: Build `FriendCard` + `FriendActivity` components
- [ ] **Frontend**: Implement `friendsSlice`

---

## Phase 5 – AI Recommendations

- [ ] **Backend**: Build `ClaudeService` with prompt construction + JSON parsing
- [ ] **Backend**: Build `RecommendationsService` (aggregate context, call Claude, cache results)
- [ ] **Backend**: Build `RecommendationsModule` + endpoints
- [ ] **Frontend**: Build `RecommendationsPage` with dismiss/save actions + "Refresh" button
- [ ] **Frontend**: Build `RecommendationCard` component
- [ ] **Frontend**: Implement `recommendationsSlice`
- [ ] **Frontend**: Add top-3 recommendation preview section to `DashboardPage`

---

## Phase 6 – Dashboard + Stats

- [ ] **Backend**: Build `StatsModule` (year-in-review aggregations via Prisma)
- [ ] **Frontend**: Install Recharts
- [ ] **Frontend**: Build `YearInReviewPage` (stat cards + monthly bar chart + genre breakdown)
- [ ] **Frontend**: Build `DashboardPage` with 3 carousels (In Progress, Friends Activity, Recommended)

---

## Phase 7 – Polish

- [x] **Frontend**: Dark / light mode toggle wired to `uiSlice`
- [ ] **Frontend**: Build `ProfilePage` (public view + self-edit modal)
- [ ] **Frontend**: Loading skeletons on all async sections
- [ ] **Frontend**: Global toast notifications for success/error
- [ ] **Frontend**: `NotFoundPage` (404)
- [ ] **Backend**: Helmet + ThrottlerModule already configured ✓
- [ ] **Backend + Frontend**: `.env.example` files ✓ already written

---

## Phase 8 – Deployment Prep

- [ ] Write `README.md` with full local setup instructions
- [ ] End-to-end local smoke test (register → add media → friend → recommend → stats)
- [ ] Push to GitHub repository

---

## Backlog / Future Features

- [ ] Email notifications (friend requests, new recommendations)
- [ ] Activity feed / social timeline
- [ ] Reading/watching goals (e.g., "50 books in 2026")
- [ ] Import from Goodreads / Letterboxd
- [ ] Mobile responsive refinement
- [ ] Push notifications (PWA)
