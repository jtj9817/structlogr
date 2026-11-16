---
key: SLOG-001
title: Unauthenticated /debug/* routes leak session id and CSRF data
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
relates_to: [SLOG-002]
---

# SLOG-001: Unauthenticated /debug/* routes leak session id and CSRF data

[Home](../Home.md) › [Tickets](index.md) › SLOG-001

## Summary

Three `/debug/*` routes in `routes/web.php` return session identifiers, CSRF token previews and full session configuration to **any unauthenticated visitor**. They look like leftover local troubleshooting endpoints from the CSRF-debugging effort (October 2025) that ship in production.

## Description

Registered in the public `web` middleware group with no `auth` middleware (`routes/web.php:11-61`):

- `GET /debug/csrf-status` → `debug.csrf-status`: `csrf_token` (full token), `session_id`, session encryption/lifetime/cookie config, app env (`:12-22`).
- `POST /debug/csrf-test` → `debug.csrf-test`: CSRF validity, request headers, session id/cookie/config, token **length and first-10-chars preview** (`:24-43`).
- `GET /debug/session-info` → `debug.session-info`: session id, driver, lifetime, cookie name/domain/secure/same-site, appearance/sidebar_state cookie values (`:45-60`).

`bootstrap/app.php:11-23` adds no global protection, so these are reachable wherever the app is deployed. No test covers them; nothing references them from the frontend (`grep -rn "debug/" resources/js` returns members of route groups only).

Introduced during the CSRF debugging work present in recent history (see `1efe145`, `1891527`, `2c3de0a`).

## Findings

### 1. Session id and token disclosure without authentication

- **Severity:** P1
- **Files:**
  - `routes/web.php:11-61`
  - `bootstrap/app.php:17-23`

Full `csrf_token` is returned by `csrf-status` and a 10-character token prefix plus session id by the other two. Combined with the `session-info` cookie/domain details, this is actionable session-theft reconnaissance over any plain-HTTP deployment and unnecessary noise over HTTPS.

#### Expected Behavior

The routes do not exist in production (gated by `app.debug` or removed), and session internals are not exposed to unauthenticated callers.

## Acceptance Criteria

- [ ] `GET /debug/csrf-status`, `POST /debug/csrf-test`, `GET /debug/session-info` return 404 (or are unreachable) in a production-like environment
- [ ] No response from the application discloses `csrf_token`, its preview, or `session_id` to an unauthenticated caller
- [ ] The CSRF-debugging guidance referencing these routes (if any) is removed or updated
- [ ] A regression test asserts `/debug/csrf-status` is not publicly accessible

## Backlinks

<!-- wiki:backlinks:start -->
<!-- wiki:backlinks:end -->
