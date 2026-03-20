# Backend Code Review — CircleRecs

## Summary

Overall this is a well-structured NestJS application with solid foundational choices (global JWT guard, whitelist validation pipe, helmet, httpOnly refresh cookies, Prisma with scoped selects). The main blocking issues are a security vulnerability in the Google OAuth callback, a missing rate-limit on the AI generation endpoint, and several medium-severity type safety and correctness gaps that should be closed before going to production.

---

## Issues

### SECURITY

- **[severity: high] Security — Access token exposed in OAuth redirect URL**
  File: `src/auth/auth.controller.ts`, line 83
  ```
  return res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
  ```
  The JWT access token is appended as a query parameter. Query strings appear in server logs, browser history, Referer headers sent to third-party scripts, and are trivially extracted by any analytics or tracking pixel on the callback page. Use a short-lived one-time code stored in Redis instead, or pass the token only via the existing httpOnly `refresh_token` cookie and have the frontend call `/auth/me` to obtain user context.

- **[severity: high] Security — `POST /recommendations/generate` has no rate limiting**
  File: `src/recommendations/recommendations.controller.ts`, line 15; `src/recommendations/ai.service.ts`
  The global throttler is 60 req/min, which allows a single authenticated user to trigger 60 expensive AI API calls per minute. Each call fetches DB rows, calls an LLM, and writes to the DB. Add a tighter per-user or per-endpoint throttle (`@Throttle`) on this route — e.g., 3–5 requests per minute.

- **[severity: medium] Security — `PATCH /media/entries/:id` spreads the raw DTO into the Prisma update**
  File: `src/media/media.service.ts`, lines 98–106
  ```typescript
  return this.prisma.mediaEntry.update({
    where: { id: entryId },
    data: {
      ...dto,
      startedAt: dto.startedAt ? new Date(dto.startedAt) : undefined,
      completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
    },
  ```
  Spreading the entire DTO into the `data` object means any property that survives `ValidationPipe`'s whitelist will be written directly to the DB row. The DTO already has `whitelist: true` enforced globally, which is good, but this pattern is fragile — a future developer adding a field to `UpdateEntryDto` for a different purpose would silently allow it to be persisted. Enumerate the fields explicitly, the same way `addEntry` does.

- **[severity: medium] Security — Google Strategy silently falls back to placeholder credentials**
  File: `src/auth/strategies/google.strategy.ts`, lines 14–16
  ```typescript
  clientID: configService.get<string>('GOOGLE_CLIENT_ID') ?? 'placeholder',
  clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') ?? 'placeholder',
  ```
  Falling back to `'placeholder'` means the strategy registers without error in production if the env vars are missing. `configService.getOrThrow()` should be used for both, consistent with how `JWT_SECRET` is handled in the JWT strategy.

- **[severity: medium] Security — `GET /friends/search` accepts an unbounded, unvalidated query string**
  File: `src/friends/friends.controller.ts`, line 37; `src/users/users.service.ts`, line 21
  The `query` parameter has no length validation and no minimum length guard. A single-character query against `contains` with `mode: 'insensitive'` will perform a full table scan on a large users table. Add `@MinLength(2) @MaxLength(50) @IsString()` on the parameter or a dedicated DTO, and consider adding an index on the username/displayName columns.

- **[severity: low] Security — `UpdateProfileDto` is defined as a plain interface in the service, not a class-validator DTO**
  File: `src/users/users.service.ts`, lines 5–9; `src/users/users.controller.ts`, line 4
  Because `UpdateProfileDto` is a TypeScript `interface` (not a `class`), `class-validator` decorators cannot be attached to it. The controller receives a `@Body() body: UpdateProfileDto` but it is never validated by the global `ValidationPipe` — any payload will pass through. This means fields like `displayName`, `bio`, and `username` have no length or character constraints enforced at the HTTP boundary. Move this to a proper `class` in its own DTO file and add appropriate decorators (`@IsOptional()`, `@IsString()`, `@MinLength`, `@MaxLength`, `@Matches`).

---

### CORRECTNESS

- **[severity: medium] Correctness — Race condition in username uniqueness check**
  File: `src/users/users.service.ts`, lines 49–59; `src/auth/service.ts`, lines 50–57
  The pattern "check if taken in Redis → confirm in DB → write to DB" is not atomic. Two concurrent registrations with the same username can both pass the Redis check before either commits. The Redis set is also seeded at boot, not updated transactionally with the DB write. The DB has a `@@unique` constraint on `username`, which will catch the race at the DB level and throw a Prisma error (`P2002`), but this error is not caught — it will surface as a 500 instead of a 409. Catch Prisma's `P2002` error in `register` and `updateProfile` and convert it to a `ConflictException`.

- **[severity: medium] Correctness — `generate` recommendations deletes unsaved recs before AI call, not after**
  File: `src/recommendations/recommendations.service.ts`, lines 22–39
  The existing unsaved recommendations are deleted (`deleteMany`) *before* the AI call succeeds. If the AI call fails, the user's existing recommendations are gone with no replacement. Move the `deleteMany` inside the transaction after the AI call returns, or wrap the whole operation (delete + create) in a single `$transaction`.

- **[severity: medium] Correctness — `findOrCreateGoogleUser` has a username collision loop without a bound or transaction**
  File: `src/auth/auth.service.ts`, lines 141–155
  ```typescript
  while (await this.prisma.user.findUnique({ where: { username } })) {
    username = `${baseUsername}${++count}`;
  }
  ```
  This is an unbounded loop that issues one DB query per iteration. Under concurrent sign-ups with the same email prefix it can loop many times, and it is not atomic — another request can claim the same username between the check and the `create`. The DB unique constraint will throw a `P2002` that is not caught here. Catch the `P2002` on `prisma.user.create` and retry, or generate a UUID suffix instead of an incrementing counter.

- **[severity: low] Correctness — `refresh` endpoint does not validate the cookie is present**
  File: `src/auth/auth.controller.ts`, lines 44–47
  If `req.cookies['refresh_token']` is `undefined`, `AuthService.refresh` passes `undefined` to `jwtService.verify`. The `catch {}` block will swallow the resulting error and throw `UnauthorizedException`, which is the correct final result, but the flow is unnecessarily opaque. An explicit check before calling the service makes intent clear.

- **[severity: low] Correctness — `getYearStats` uses UTC month but dates may be stored in local time**
  File: `src/stats/stats.service.ts`, lines 38–39
  ```typescript
  const month = new Date(e.completedAt).getUTCMonth();
  ```
  The boundary dates are constructed with `new Date(\`${year}-01-01T00:00:00.000Z\`)` (UTC), which is consistent. However, if a user in UTC-5 marks something as completed at 11 PM on December 31, it is stored as January 1 UTC, and the item will count against the wrong year in the stats. This is a product decision, but the mixed approach (UTC boundaries, UTC month extraction) should be documented or aligned with a time-zone strategy.

---

### TYPE SAFETY

- **[severity: medium] TypeScript — `noImplicitAny: false` disables a critical safety check**
  File: `tsconfig.json`, line 21
  `noImplicitAny: false` combined with the many `(req.user as any)` casts and `: any` annotations means the compiler provides almost no safety over untyped code paths. Add a strongly-typed `AuthenticatedRequest` interface that extends `Express.Request` with `user: SafeUser`, or extend the `Express.User` namespace. This would eliminate all `as any` casts in controllers.

- **[severity: medium] TypeScript — `req.user as any` repeated across multiple controllers**
  Files: `src/users/users.controller.ts` lines 12, 27; `src/recommendations/recommendations.controller.ts` lines 11, 16, 20, 25; `src/stats/stats.controller.ts` lines 11, 16
  These controllers use `@Req() req: Request` and then immediately cast `req.user as any` instead of using the `@CurrentUser()` decorator that already exists and is used correctly in other controllers (`media.controller.ts`, `friends.controller.ts`). This is an inconsistency that bypasses all type checking. Replace the `@Req()` pattern with `@CurrentUser() user: { id: string }` (or the fuller safe user type) throughout.

- **[severity: low] TypeScript — `let details: any = null` in `upsertMedia`**
  File: `src/media/media.service.ts`, lines 31–36
  The `details` variable is typed as `any`, losing all type safety from `OmdbSearchResult | BookSearchResult`. Use a union type or a narrowed assignment for each branch.

- **[severity: low] TypeScript — AI response is parsed from JSON without runtime validation**
  File: `src/recommendations/ai.service.ts`, line 102
  ```typescript
  const parsed: RawRecommendation[] = JSON.parse(text);
  ```
  This is a TypeScript-only assertion. If the AI returns a malformed response, misnamed fields, or wrong enum values for `type`, the data will be stored in the DB silently without error. Add runtime shape validation (e.g., check `Array.isArray(parsed)`, check each item has `type`, `title`, `reason`, and that `type` is one of `BOOK | MOVIE | TV_SHOW`).

---

### API DESIGN

- **[severity: medium] API Design — `GET /media/search` does not validate required query parameters**
  File: `src/media/media.controller.ts`, lines 22–27
  `type` and `q` are not decorated with any validation. If `q` is omitted, it is `undefined`, which is passed directly to the external API services. If `type` is an invalid enum value, the `MediaService.search` will fall through to calling `omdb.search` with `'series'` for any non-BOOK input rather than rejecting the request. Add a DTO or `@IsEnum(MediaType)` / `@IsString() @MinLength(1)` param-level validation.

- **[severity: low] API Design — `POST /auth/register` returns 201 but login-like behavior**
  File: `src/auth/auth.controller.ts`, line 29
  Registration returns a 201 with a full user object and access token (auto-login). This is a valid product choice, but there is no `@HttpCode(HttpStatus.CREATED)` annotation — NestJS defaults `@Post` to 201, which is fine here, but `login` explicitly sets `200`. The inconsistency is minor but worth noting for clarity.

- **[severity: low] API Design — No pagination on `GET /media/library`**
  File: `src/media/media.service.ts`, lines 119–129
  `getLibrary` has no `take`/`skip` and returns the entire library for a user. A power user with hundreds of entries will receive them all in one response. Add cursor-based or offset pagination.

---

### PERFORMANCE

- **[severity: medium] Performance — `getFriendActivity` issues two sequential queries that could be one**
  File: `src/media/media.service.ts`, lines 131–157
  First all friendships are fetched to extract IDs, then a second query fetches entries for those IDs. This can be collapsed into a single query using a Prisma nested `where` with a relation filter, avoiding the extra round-trip and the in-memory ID extraction.

- **[severity: low] Performance — `JwtStrategy.validate` performs a DB lookup on every authenticated request**
  File: `src/auth/strategies/jwt.strategy.ts`, line 20
  Every request that carries a JWT hits the database to re-fetch the full user row. For a read-heavy API this can be a significant source of load. Consider caching the user record in Redis by `sub` with a TTL matching or shorter than the access token lifetime, invalidating on user update.

---

### RELIABILITY / INFRASTRUCTURE

- **[severity: medium] Reliability — Redis connection errors are silently swallowed after boot**
  File: `src/redis/redis.module.ts`; `src/redis/redis.service.ts`
  The `ioredis` client is created without error event handlers. If Redis becomes unavailable after the initial bootstrap, the calls to `redis.sismember`, `redis.sadd`, and `redis.srem` in `UsersService` and `AuthService` will throw unhandled promise rejections that crash the Node process (in Node 15+). Add an `'error'` event listener on the client (e.g., `redis.on('error', ...)`) to log and suppress the crash, and add try/catch around Redis calls in the service so the app degrades gracefully by falling back to the DB.

- **[severity: low] Reliability — `ThrottlerModule` is registered globally but no `ThrottlerGuard` is applied**
  File: `src/app.module.ts`, line 18
  `ThrottlerModule.forRoot(...)` registers the configuration, but rate limiting is only enforced if `ThrottlerGuard` is also registered as an `APP_GUARD` or applied per-controller. The current `APP_GUARD` is only `JwtAuthGuard`. Without the guard, the throttler has no effect. Add `ThrottlerGuard` as a second `APP_GUARD` provider.

---

## Verdict

NEEDS CHANGES — three high/medium security issues (token in URL, missing rate-limit on AI endpoint, OAuth credential fallback), plus a missing `ThrottlerGuard` that renders the existing throttle configuration inert, and a missing DTO class that bypasses all input validation on profile updates.
