# Frontend overview

[Home](../Home.md) › [Frontend](index.md) › Frontend overview

> How the React/Inertia UI is organized — pages, data flow, hooks, keyboard shortcuts, and CSRF handling.

| | |
| --- | --- |
| **Source** | `resources/js/`, `app/Http/Middleware/HandleInertiaRequests.php`, `vite.config.ts` |
| **Owner** | frontend |
| **Last verified** | 2026-11-16 against `e89b491` |
| **Open tickets** | SLOG-002, SLOG-006, SLOG-007 |

## Stack and entry

React 19 + TypeScript 5.7+, Inertia.js 2.0, Tailwind 4, Radix UI + shadcn-style components, Vite 7. Entry `resources/js/app.tsx` boots `createInertiaApp`; pages are auto-discovered (`./pages/**/*.tsx`). Wayfinder (`@laravel/vite-plugin-wayfinder`, `formVariants: true`) generates typed route helpers and actions into `resources/js/routes/` and `resources/js/actions/` on dev/build — **never edit those by hand**; change the Laravel routes and rebuild.

SSR build exists (`npm run build:ssr`, entry `resources/js/ssr.tsx`).

## Pages

| Page | Route | Notes |
| --- | --- | --- |
| `FormatterPage.tsx` | `/` | The whole app on one screen (~1,150 lines): input textarea with char/line counters, sample logs, format submit, output viewer, history sidebar, preferences/settings panels, shortcuts modal |
| `welcome.tsx` | — | Laravel starter-kit leftover; **no route renders it** — see SLOG-006 |
| `auth/*.tsx` | `/login`, `/register`, … | Login, register, 2FA challenge, password reset, verification prompt |
| `settings/*.tsx` | `/settings/*` | profile, password, appearance, two-factor, preferences |

## Shared Inertia data

`HandleInertiaRequests::share()` adds on every response: `name`, `quote`, `auth.user` (id, name, email, `avatar` (always null — no column), `email_verified_at`, `two_factor_enabled`, `created_at`, `updated_at`, `preferences`), `sidebarOpen`, and `csrf_debug` — the last is **shared but never read by the frontend** and leaks `session_id` + token preview; see SLOG-002.

## Data flow

- **Page data** flows server → client as Inertia props; there is no bespoke page API.
- **History & search** call the JSON endpoints (`/history*`) via `fetch` in `use-history.ts` / `use-search.ts`, always with `Accept: application/json`, `X-Requested-With: XMLHttpRequest`, and `X-CSRF-TOKEN` read from `<meta name="csrf-token">` (`use-history.ts:22-34`). On 419, `use-csrf-handler` reacts (logs + optional reload); it is wired as a hook, not an axios interceptor.
- **Preferences** (`use-preferences.ts`, `use-settings.ts`): optimistic local state + `PATCH /settings/preferences`, merged over the same defaults as the backend.
- **LLM model choice** persists in `localStorage["llm-model-preference"]` (`use-llm-model.ts`), default `deepseek-chat`, validated against the same five aliases the backend accepts.

## Keyboard shortcuts (as implemented)

Defined in `resources/js/hooks/use-keyboard-shortcuts.ts` and bound in `FormatterPage.tsx:563-608` (`matchesKeyboardShortcut` maps `ctrlKey` to ⌘ on macOS):

| Keys | Action |
| --- | --- |
| Ctrl/Cmd + Enter | Submit form |
| Ctrl/Cmd + K | Clear input (page-level handler) — **but the header binds the same chord to open Search; see SLOG-007** |
| Ctrl/Cmd + / | Show keyboard shortcuts modal |
| Alt + I / Alt + O | Focus input / output |
| Escape | Close any open panel |

The header search dialog is `window` keydown in `app-header.tsx`, active only for authed users and skipped when focus is in an `INPUT`/`TEXTAREA` (`app-header.tsx:131-151`). There is **no** Ctrl/Cmd+H, Ctrl/Cmd+L, or `?` binding (the README claims otherwise — fixed there).

## Conventions a newcomer should keep

- Type-safe routing only: `import { home } from '@/routes'` — never string URLs (Wanted: matches the Wayfinder setup).
- Pages thin, hooks own effects: every side-effectful `useEffect` pairs with cleanup.
- New history UI consumes the same `{ data: … }` envelope; keep `useHistory`'s return shape stable for `history-sidebar` and `history-entry-card`.

## Related

- [API surface](../backend/api.md) — the endpoints these hooks call
- [Log format](../domain/log-format.md) — the JSON rendered in the output pane
- [Keyboard shortcut defect](../tickets/SLOG-007-ctrl-cmd-k-both-clears-the.md) — known conflict on the main chord

## Backlinks

<!-- wiki:backlinks:start -->
<!-- wiki:backlinks:end -->
