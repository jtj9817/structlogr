---
key: SLOG-002
title: csrf_debug shared on every Inertia response (session id, token preview)
type: Bug
status: Open
priority: High
component: backend
labels: [security]
assignee: Unassigned
reporter: Claude
created: 2026-11-16
updated: 2026-11-16
parent:
blocks: []
blocked_by: []
relates_to: [SLOG-001]
---

# SLOG-002: csrf_debug shared on every Inertia response (session id, token preview)

[Home](../Home.md) › [Tickets](index.md) › SLOG-002

## Summary

`HandleInertiaRequests::share()` attaches a `csrf_debug` object containing the session id and a CSRF-token preview to **every** Inertia response — including production traffic for guests and authenticated users — even though nothing in the frontend reads it.

## Description

`app/Http/Middleware/HandleInertiaRequests.php:42-51` builds:

```php
$csrfDebug = [
    'token_available' => !empty(csrf_token()),
    'session_encrypted' => config('session.encrypt'),
    'session_id' => session()->getId(),
    'token_length' => strlen(csrf_token()),
    'token_preview' => substr(csrf_token(), 0, 8) . '...',
    'session_cookie' => config('session.cookie'),
    'has_csrf_header' => $request->headers->has('X-CSRF-TOKEN'),
    'has_x_requested_with' => $request->headers->has('X-Requested-With'),
];
```

…and attaches it as `'csrf_debug' => $csrfDebug` in every response's shared props (`:88`). A `config('app.debug')` guard exists only around the parallel `Log::debug` call (`:54-68`) — the props themselves are shared unconditionally. `grep -rn "csrf_debug" resources/js` returns no usages; the prop is dead weight that discloses session internals to any script running on the page (and to anyone who can view response HTML/JSON before hydration).

## Findings

### 1. Session id and token preview leak on every page load

- **Severity:** P1
- **Files:**
  - `app/Http/Middleware/HandleInertiaRequests.php:42-51,88`

Anyone able to execute script in the page (XSS, browser extension context) or read raw responses receives `session_id` and the first 8 characters of the token without needing the meta tag.

#### Expected Behavior

`share()` returns only the data the frontend consumes (`name`, `quote`, `auth.user`, `sidebarOpen` + parent share); session internals are not serialized into page props.

## Acceptance Criteria

- [ ] `csrf_debug` is no longer present in Inertia shared props (or only when `app.debug === true`)
- [ ] Frontend builds and tests pass with the prop absent (it is never read)
- [ ] Logging of CSRF diagnostics either keeps the `app.debug` gate or is removed

## Backlinks

<!-- wiki:backlinks:start -->
<!-- wiki:backlinks:end -->
