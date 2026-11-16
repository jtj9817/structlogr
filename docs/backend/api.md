# API surface

[Home](../Home.md) › [Backend](index.md) › API surface

> Every HTTP route in the app — who can call it, what it takes, what it returns.

| | |
| --- | --- |
| **Source** | `routes/web.php`, `routes/settings.php`, `routes/auth.php`, `bootstrap/app.php`, `app/Http/Controllers/` |
| **Owner** | backend |
| **Last verified** | 2026-11-16 against `e89b491` |
| **Open tickets** | SLOG-001 |

Two response styles coexist:

- **Inertia pages** — HTML + Inertia props (`/`, `/settings/*`, auth pages).
- **JSON API** — `{ data: … }` envelope, consumed by React hooks via `fetch` with an `X-CSRF-TOKEN` header (history endpoints under `/history*`).

State-changing requests go through Laravel's `web` middleware group (CSRF enforced). There is no general rate limiter; only the email-verification and password-change routes add `throttle:6,1`.

## Public routes

| Method | URI | Name | Handler | Notes |
| --- | --- | --- | --- | --- |
| GET | `/` | `home` | `LogFormatterController@show` | Inertia `FormatterPage`; passes flash `formattedLog`/`success` and, for authed users, `history` + `historyRoutes` |
| POST | `/format` | `formatter.format` | `LogFormatterController@format` | Validates `raw_log` (string, required), `llm_model` (`in:deepseek-chat,gemini-2.5-flash,kimi-k2-turbo-preview,GLM-4.5-Air,GLM-4.6`, default `deepseek-chat`), optional `preferences.*`. PRG redirect to `home` with flash. Failures re-render back with `llm_model`/`raw_log` errors |
| GET | `/up` | — | Laravel health check | Built-in |
| GET/POST/GET | `/debug/csrf-status`, `/debug/csrf-test`, `/debug/session-info` | `debug.*` | Closures in `routes/web.php` | **Unauthenticated; leak session id, token preview and session config — see SLOG-001** |

## History API (`auth`)

All under `Route::middleware('auth')->prefix('history')->name('history.')` (`routes/web.php:63-71`). Entries belonging to other users return **404** (`authorizeEntry()`). `toggle-save`, `destroy` and `clear` respond with the refreshed history payload.

| Method | URI | Name | Notes |
| --- | --- | --- | --- |
| GET | `/history` | `history.index` | `{ data: { recent: [...], saved: [...] } }`, newest first, up to 50 entries |
| GET | `/history/search?query=&scope=&limit=` | `history.search` | `scope` in `all|recent|saved`, `limit` 1–50 (default 20), `query` 2–100 chars trimmed (`HistorySearchRequest`). `{ data: { query, results, meta: { limit, count, scope } } }` |
| GET | `/history/export` | `history.export` | Streams `structlogr-history-{user}-{Ymd_His}.json` download; up to 1000 most recent entries |
| GET | `/history/{formattedLog}` | `history.show` | `{ data: { id, raw_log, formatted_log } }` |
| PATCH | `/history/{formattedLog}/toggle-save` | `history.toggle-save` | Flips `is_saved` |
| DELETE | `/history/{formattedLog}` | `history.destroy` | Soft-deletes the entry |
| DELETE | `/history` | `history.clear` | Soft-deletes **all** of the user's entries |

Search executes a substring `LIKE '%query%'` match across `title`, `summary`, `detected_log_type` and `raw_log` — **not** a MySQL full-text index; there is none (see [History](history.md)).

## Settings (`auth`, `routes/settings.php`)

| Method | URI | Name | Notes |
| --- | --- | --- | --- |
| GET | `/settings` | — | Redirects to `/settings/profile` |
| GET/PATCH/DELETE | `/settings/profile` | `profile.edit|update|destroy` | Name/email; delete removes the account |
| GET/PUT | `/settings/password` | `password.edit|update` | PUT adds `throttle:6,1` |
| GET | `/settings/appearance` | `appearance.edit` | Inertia page (theme: light/dark/system) |
| GET | `/settings/two-factor` | `two-factor.show` | 2FA setup/codes (Fortify) |
| GET/PATCH | `/settings/preferences` | `preferences.show|update` | JSON blob; see [Schema](schema.md#userspreferences) |

## Auth (`routes/auth.php`)

Guest routes: register, login, forgot/reset password. Authenticated: `verify-email` (signed, `throttle:6,1`), `email/verification-notification` (`throttle:6,1`), `logout`. Verification is not enforced on any app route — `verified` middleware is used nowhere.

## Adding an endpoint

1. Register the route in the matching `routes/*.php` file (`web.php` for app routes, inside the `auth` group if it needs an account).
2. Add a controller method under `app/Http/Controllers` (or `Settings/`).
3. Return an Inertia `Response` for pages, or `response()->json(['data' => …])` for the fetch API.
4. TypeScript route helpers under `resources/js/routes/` regenerate automatically via the Wayfinder Vite plugin (`formVariants: true`) on `npm run dev` / `npm run build` — do not edit them by hand.

## Related

- [History](history.md) — the service layer behind the history API
- [Schema](schema.md) — tables the API reads and writes
- [Architecture overview](../architecture/overview.md) — request flow end to end

## Backlinks

<!-- wiki:backlinks:start -->
| Page | Summary |
| --- | --- |
| [StructLogr wiki](../Home.md) | StructLogr turns raw log text into structured JSON with an LLM; this wiki is its map — what exists, where it lives, and what's known-broken. |
| [Architecture overview](../architecture/overview.md) | The runtime shape of StructLogr — components, the format request flow, who owns what data, and how it deploys. |
| [How formatting works](formatter.md) | What happens between pasting a log and seeing structured JSON — schema, prompt, provider call, validation, retry, persistence. |
| [History](history.md) | How formatted logs are stored, listed, searched, bookmarked, exported and cleared — and why search behaves the way it does. |
| [Database schema](schema.md) | Tables, columns, indexes and access patterns — what persists each request and what doesn't. |
| [Frontend](../frontend/index.md) | The React 19 + Inertia single-page UI — pages, hooks, shared data, and how it talks to the backend. |
| [Frontend overview](../frontend/overview.md) | How the React/Inertia UI is organized — pages, data flow, hooks, keyboard shortcuts, and CSRF handling. |
<!-- wiki:backlinks:end -->
