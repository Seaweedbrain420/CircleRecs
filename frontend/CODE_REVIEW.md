# Frontend Code Review — CircleRecs

## Summary

A well-structured React/Redux/TypeScript SPA with clean separation of concerns, but it contains several correctness bugs (fire-and-forget dispatches, a race condition in the token refresh queue, missing validation bounds, falsy-zero rating display), two moderate TypeScript safety gaps (`err: any`, `(entry as any)`), and a handful of UX and maintainability issues worth addressing before a production release.

---

## Issues

### Correctness

- **[severity: high]** **Correctness — token-refresh queue never retries on success (`src/services/api.ts`, lines 38–46)**
  When a 401 fires while a refresh is already in progress, incoming requests are pushed onto `failedQueue`. The resolve callback receives the new token, and the `.then()` block sets `Authorization` and retries the request — but only if `processQueue` is called with `error = null`. If the fulfilled branch (line 54) runs successfully, `processQueue(null, newToken)` is called. However, if `refreshTokenThunk` resolves to a non-fulfilled action (e.g. RTK returns a rejected action object instead of throwing), execution falls through the `try` block without calling `processQueue` at all, leaving every queued request permanently pending. Add an `else` branch after the `if (refreshTokenThunk.fulfilled.match(result))` check that calls `processQueue(new Error('Refresh failed'), null)` and rejects the original request.

- **[severity: high]** **Correctness — fire-and-forget dispatches lose errors silently (`src/pages/LoginPage.tsx` line 18, `src/pages/RegisterPage.tsx` line 32)**
  `dispatch(loginThunk(...))` and `dispatch(registerThunk(...))` are called without `await`. The Redux state error field does update, but any navigation side-effect that depends on the promise completing (e.g. redirect after login) would be triggered before the thunk settles. More critically, if future code adds a `.then()` or `await` expectation on these calls, the unhandled promise will swallow errors silently. Prefix both calls with `await` for consistency with every other thunk call in the codebase, and to make the intent explicit.

- **[severity: high]** **Correctness — `parseInt` used without a radix, and no range validation on user-entered rating (`src/components/media/AddEntryModal.tsx` line 36, `src/components/media/MediaCard.tsx` lines 89, 91)**
  `parseInt(rating)` without a second argument (radix `10`) is a well-known footgun — values like `"09"` can be parsed as octal in older engines. More importantly, neither file validates that the parsed integer is actually in the range 1–10 before dispatching. A user who types `"0"`, `"11"`, or `"-1"` and submits bypasses the HTML `min`/`max` attributes (which are client-only hints) and sends an out-of-range value to the API. Use `parseInt(rating, 10)` and clamp/reject values outside `[1, 10]`.

- **[severity: medium]** **Correctness — rating of `0` is never displayed (`src/components/media/MediaCard.tsx` line 199)**
  The rating badge renders only when `entry.userRating` is truthy: `{entry.userRating && ...}`. Because `0` is falsy in JavaScript, a rating of `0` would be silently hidden. The correct guard is `{entry.userRating != null && ...}`. (Given the 1–10 constraint this edge case may be rare, but it is still a logic bug.)

- **[severity: medium]** **Correctness — `handleTypeChange` in SearchPage can trigger a stale search (`src/pages/SearchPage.tsx` lines 36–41)**
  `handleTypeChange` fires a search using `debouncedQuery` (the debounced value). If the user changes the type while still mid-type, `debouncedQuery` may lag behind `query` by up to 400 ms, causing a search with the old query string. The type-change search should use the current `query` value (or wait for the next debounce cycle) rather than the debounced snapshot.

- **[severity: medium]** **Correctness — `respondRequestThunk` success is not checked before acting (`src/pages/FriendsPage.tsx` lines 47–55)**
  `handleRespond` always calls `dispatch(fetchFriendsThunk())` and shows a success toast when `accept === true`, regardless of whether `respondRequestThunk` actually succeeded. If the request fails (network error, 409, etc.) the UI still says "Friend request accepted". Mirror the pattern used in `handleSendRequest` — check `respondRequestThunk.fulfilled.match(result)` before acting.

- **[severity: medium]** **Correctness — `removeFriendThunk` result is not checked before toasting (`src/pages/FriendsPage.tsx` lines 57–60)**
  Same issue as above: `toast('Friend removed')` is called unconditionally even if the thunk fails.

- **[severity: medium]** **Correctness — `DashboardPage` filters `IN_PROGRESS` client-side after fetching only `IN_PROGRESS` from the API (`src/pages/DashboardPage.tsx` lines 24, 30)**
  The thunk fetches `{ status: 'IN_PROGRESS' }`, which correctly limits the server response. But the fetched data is stored in `state.media.library`, which is the same array used by `LibraryPage`. This means navigating to the dashboard silently replaces the full library with only in-progress items. If a user opens the Dashboard first and then opens the Library, it will briefly show only in-progress entries until `LibraryPage` re-fetches. This is a shared-state mutation problem. Consider using a separate Redux slice key (e.g. `dashboardInProgress`) or local component state for the dashboard subset.

- **[severity: low]** **Correctness — `useDebounce` delay changes do not reset the timer (`src/hooks/useDebounce.ts`)**
  The `useEffect` dependency array includes `delay`, so changing the delay mid-flight cancels the current timer and starts a new one. In practice the delay is always a constant, so this is harmless, but for correctness the effect should only re-run when `value` changes, not `delay`. If `delay` is intended to be configurable at runtime, the current behaviour (cancelling an in-flight debounce when delay changes) is probably not what callers want.

- **[severity: low]** **Correctness — `YearInReviewPage` allows navigating to future years (`src/pages/YearInReviewPage.tsx` line 68)**
  The "next year" button is `disabled={year >= new Date().getFullYear()}`. However, `new Date().getFullYear()` is evaluated on every render, which is fine for a button, but the user can still reach future years if the comparison uses the year at render time on December 31st and midnight flips to a new year mid-session. This is negligible in practice, but computing the max year once in a `useMemo` or constant outside the component would make the intent cleaner.

---

### TypeScript / Type Safety

- **[severity: medium]** **TypeScript — `err: any` used in multiple thunks and components**
  `addEntryThunk` (`mediaSlice.ts` line 48), `sendRequestThunk` (`friendsSlice.ts` line 41), `generateRecommendationsThunk` (`recommendationsSlice.ts` line 29), `ProfilePage` (`ProfilePage.tsx` line 48), `UsernameSetupPage` (`UsernameSetupPage.tsx` line 68) all type caught errors as `any`. The `strict` tsconfig flag is enabled, so the correct pattern is `err: unknown` with an explicit narrowing cast — the same pattern already used correctly in `loginThunk` and `registerThunk`. Replace `err: any` with `err: unknown` and cast to `{ response?: { data?: { message?: string } } }` as done in `authSlice.ts`.

- **[severity: medium]** **TypeScript — `(entry as any).user` cast defeats type safety (`src/pages/DashboardPage.tsx` line 121)**
  `friendActivity` is typed as `FriendActivityEntry[]` in `mediaSlice.ts`, which already includes a `user` property. Accessing it via `(entry as any).user` bypasses all type checking. Remove the cast; `entry.user?.displayName` is directly accessible and fully typed.

- **[severity: low]** **TypeScript — `useAppSelector` is a thin wrapper that loses the `TypedUseSelectorHook` type contract (`src/store/index.ts` line 25)**
  The custom wrapper works, but the idiomatic RTK pattern is `export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector`, which preserves the hook's full generic signature and IDE inference. The current implementation is functionally equivalent but non-standard.

---

### Security

- **[severity: medium]** **Security — `VITE_API_BASE_URL` is injected into a `window.location.href` redirect without sanitization (`src/pages/LoginPage.tsx` line 22)**
  If `VITE_API_BASE_URL` were ever set to a malicious value (e.g. via a compromised CI environment variable or a developer mistake), it could redirect users to an attacker-controlled OAuth endpoint and exfiltrate the Google OAuth code. This is low-risk in a controlled build environment, but the URL should be validated at startup (e.g. assert it starts with `https://` and matches the expected host) rather than used raw.

- **[severity: low]** **Security — `document.getElementById('root')!` uses a non-null assertion without a runtime guard (`src/main.tsx` line 8)**
  If the root element is missing (e.g. a broken `index.html`), the `!` assertion suppresses TypeScript's warning but still causes a `TypeError` at runtime with no meaningful error message. A one-line guard (`if (!el) throw new Error('Root element not found')`) would produce a clearer failure in production.

---

### React Best Practices

- **[severity: medium]** **React — `Toaster` is rendered outside `BrowserRouter` but uses hardcoded `theme="dark"` (`src/App.tsx` line 39)**
  The `Toaster` component from Sonner is placed before `BrowserRouter`, which is fine for portals. However, its `theme` is hardcoded to `"dark"`, ignoring the user's theme preference stored in Redux (`state.ui.theme`). Users who switch to light mode will still see dark toasts. Pass `theme={theme}` (the selector result already available in `App`) to keep toasts consistent.

- **[severity: medium]** **React — `ProtectedRoute` has a race condition during app startup (`src/components/layout/ProtectedRoute.tsx` line 8)**
  On a cold load, `isAuthenticated` is `false` until `refreshTokenThunk` resolves. `ProtectedRoute` immediately redirects to `/login` before the refresh completes. This means authenticated users with a valid refresh cookie will briefly see the login page flash before being redirected back. Add an `isInitializing` flag (set to `true` until `refreshTokenThunk` settles) to `authSlice` and render a loading screen in `ProtectedRoute` while it is `true`.

- **[severity: medium]** **React — `LibraryPage` uses `<a href>` instead of `<Link to>` for internal navigation (`src/pages/LibraryPage.tsx` lines 51, 97)**
  Two anchor tags link to `/search` using native `<a href="/search">` and `<a href="/search">`. This triggers a full page reload, clearing Redux state and losing scroll position. Use React Router's `<Link to="/search">` instead.

- **[severity: low]** **React — Local `sentIds` state in `FriendsPage` is never cleared and can become stale (`src/pages/FriendsPage.tsx` line 22)**
  `sentIds` is a `Set<string>` of user IDs to whom a request has been sent this session. It is initialized on mount and never reset. If the component unmounts and remounts (e.g. tab navigation), the set is lost and the UI will again show "Add" for users who already have a pending request. The source of truth should be `pendingRequests` from Redux, not local state. After sending a request, the thunk returns a `FriendRequest`; consider optimistically pushing it into Redux `pendingRequests` instead of maintaining a local set.

- **[severity: low]** **React — `handleTypeChange` in SearchPage duplicates dispatch logic already covered by the debounce `useEffect` (`src/pages/SearchPage.tsx` lines 36–41)**
  When the type changes, `handleTypeChange` dispatches a search immediately using `debouncedQuery`. Then, if the user is still typing, the debounce `useEffect` will dispatch a second search when the debounced value settles. This results in a double request. Removing the immediate dispatch from `handleTypeChange` and relying solely on the `useEffect` (which already has `type` in its dependency array) would be simpler and correct.

- **[severity: low]** **React — `SearchPage` shows the "no results" message prematurely (`src/pages/SearchPage.tsx` line 92)**
  The "No results found" message conditions on `query.length >= 2`, but the debounce means the query that was actually searched may be shorter. If the user types two characters quickly and immediately deletes one, the search hasn't fired yet but `query.length >= 2` briefly satisfied before the delete. The condition should use `debouncedQuery.length >= 2` to match what was actually searched.

---

### Performance

- **[severity: low]** **Performance — `friendIds` and `pendingReceiverIds` Sets are recreated on every render (`src/pages/FriendsPage.tsx` lines 62–63)**
  These `new Set(...)` calls run on every render of `FriendsPage`. While not expensive for small friend lists, wrapping them in `useMemo` (with `friends` and `pendingRequests` as deps) is the correct pattern and future-proofs the component.

- **[severity: low]** **Performance — `unsaved` and `saved` filter calls run on every render without memoisation (`src/pages/RecommendationsPage.tsx` lines 48–49)**
  The `items.filter(...)` calls on lines 48 and 49 run unconditionally on every render. These should be wrapped in `useMemo` keyed on `items`.

---

### Readability / Maintainability

- **[severity: low]** **Readability — `TYPE_LABELS` in `RecommendationsPage` and `TYPE_ICON` in `DashboardPage` duplicate mappings defined elsewhere**
  `TYPE_LABELS` (`RecommendationsPage.tsx` line 13) and `TYPE_ICON` (`DashboardPage.tsx` line 10, also `MediaCard.tsx` line 19, `SearchResultCard.tsx` line 5, `LibraryPage.tsx` line 10) are redefined in multiple files independently. Extract them into a shared `src/lib/mediaConstants.ts` file to avoid drift if a new `MediaType` is added.

- **[severity: low]** **Readability — `set` helper in `RegisterPage` is typed as `(field: string)` rather than `(field: keyof typeof form)` (`src/pages/RegisterPage.tsx` line 22)**
  The helper factory accepts any `string`, but the `value={form[id as keyof typeof form]}` cast on line 67 is needed because the types don't align. Typing `field` as `keyof typeof form` would eliminate the cast and the `as keyof typeof form` workaround.

- **[severity: low]** **Readability — `formatError` in `UsernameSetupPage` is called twice in the render (`src/pages/UsernameSetupPage.tsx` lines 117, 120)**
  `formatError()` is a function call in JSX that runs twice per render. Compute its result once with `const formatErrorMsg = formatError()` above the return statement and reference the variable.

- **[severity: low]** **Readability — Trailing comma after `logoutThunk,` import in `AppLayout.tsx` (`src/components/layout/AppLayout.tsx` line 4)**
  `import { logoutThunk, }` has a trailing comma inside a single-item destructure. Minor style inconsistency; a linter rule (`object-curly-newline` or similar) would catch this automatically.

---

## Verdict

NEEDS CHANGES — several blocking correctness issues (token refresh queue leak, fire-and-forget dispatches, missing error checks before toasts, out-of-range rating submission) and a UX-breaking auth race condition on startup should be resolved before shipping.
