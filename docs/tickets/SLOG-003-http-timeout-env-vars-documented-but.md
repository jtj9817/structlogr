---
key: SLOG-003
title: HTTP_TIMEOUT env vars documented but never read (services.http not wired)
type: Task
status: Open
priority: Medium
component: backend
labels: [docs, config]
assignee: Unassigned
reporter: Claude
created: 2026-11-16
updated: 2026-11-16
parent:
blocks: []
blocked_by: []
relates_to: []
---

# SLOG-003: HTTP_TIMEOUT env vars documented but never read (services.http not wired)

[Home](../Home.md) › [Tickets](index.md) › SLOG-003

## Summary

The README (and formerly `docs/llm-providers.md`, `docs/logging-and-debugging.md`) instructs users to set `HTTP_TIMEOUT` / `HTTP_CONNECT_TIMEOUT`, but no code path reads them: `config/services.php` has no `http` key, so `LogFormatterService` always uses its 600s / 60s fallbacks. Setting the variables does nothing.

## Description

Code reads `config('services.http.timeout', 600)` and `config('services.http.connect_timeout', 60)` in four places (`app/Services/LogFormatterService.php:68,69,81,82`). `config/services.php` contains only `postmark`, `ses`, `resend`, `slack` entries — no `http` array. `HTTP_TIMEOUT` appears nowhere in the codebase (`grep -rn "HTTP_TIMEOUT" app config resources routes compose.yaml .env.example .env.testing phpunit.xml` → no hits).

The docs were corrected in the 2026-11-16 docs pass (README §HTTP Timeout Configuration now states the actual fallback behaviour; `docs/backend/logging.md` and `docs/backend/llm-providers.md` say the same). What remains is the code/config decision: either wire the env vars or drop the pretense entirely.

## Acceptance Criteria

One of:

- [ ] `config/services.php` gains an `http` key (`'timeout' => env('HTTP_TIMEOUT', 600), 'connect_timeout' => env('HTTP_CONNECT_TIMEOUT', 60)`), `.env.example` documents both, and a feature test asserts the config values flow into the Prism client options; or
- [ ] `LogFormatterService` reads the timeouts from its own config entry (e.g. `services.llm.timeout`) with env wiring and a test, and the docs are updated to match; or
- [ ] The docs keep stating the timeouts are not env-configurable and the code is simplified to a named constant — whichever the maintainer prefers, but the README/wiki must match the code afterwards

## Backlinks

<!-- wiki:backlinks:start -->
<!-- wiki:backlinks:end -->
