---
key: SLOG-006
title: resources/js/pages/welcome.tsx rendered by no route
type: Task
status: Open
priority: Low
component: frontend
labels: [cleanup]
assignee: Unassigned
reporter: Claude
created: 2026-11-16
updated: 2026-11-16
blocks: []
blocked_by: []
relates_to: []
---

# SLOG-006: resources/js/pages/welcome.tsx rendered by no route

[Home](../Home.md) › [Tickets](index.md) › SLOG-006

## Summary

`resources/js/pages/welcome.tsx` (and its associated imports from `@/routes`) is a Laravel starter-kit landing page that no route or controller renders. It is dead weight in the bundle and in every listing of pages.

## Description

The only routes rendering Inertia pages:

- `/` → `LogFormatterController@show` → `inertia('FormatterPage', …)` (`app/Http/Controllers/LogFormatterController.php:15`)
- settings pages → `routes/settings.php`
- auth pages → `routes/auth.php`

`grep -rn "Welcome" routes/ app/ resources/js/app.tsx resources/js/pages/FormatterPage.tsx` returns nothing; `welcome.tsx` is unreferenced (it imports `home, login, register` from `@/routes`, none of which link to it either). README §Project Structure still lists `welcome.tsx # Landing page`, which is wrong — the landing page is `FormatterPage.tsx` at `/`.

## Acceptance Criteria

- [ ] `resources/js/pages/welcome.tsx` is deleted (or routed, if product wants it)
- [ ] Any remaining references (README "Project Structure", tests) are updated in the same change
- [ ] `npm run build` passes

## Backlinks

<!-- wiki:backlinks:start -->
| Page | Summary |
| --- | --- |
| [Frontend overview](../frontend/overview.md) | How the React/Inertia UI is organized — pages, data flow, hooks, keyboard shortcuts, and CSRF handling. |
| [SLOG-007: Ctrl/Cmd+K both clears the formatter textarea and opens search](SLOG-007-ctrl-cmd-k-both-clears-the.md) | Bug · Open |
<!-- wiki:backlinks:end -->
