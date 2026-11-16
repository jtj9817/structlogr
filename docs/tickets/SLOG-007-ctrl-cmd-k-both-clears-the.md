---
key: SLOG-007
title: Ctrl/Cmd+K both clears the formatter textarea and opens search
type: Bug
status: Open
priority: High
component: frontend
labels: [ux, data-loss]
assignee: Unassigned
reporter: Claude
created: 2026-11-16
updated: 2026-11-16
parent:
blocks: []
blocked_by: []
relates_to: [SLOG-006]
---

# SLOG-007: Ctrl/Cmd+K both clears the formatter textarea and opens search

[Home](../Home.md) › [Tickets](index.md) › SLOG-007

## Summary

For an authenticated user whose focus is anywhere outside an input, Ctrl/Cmd+K deletes the entire formatter textarea content **and** opens the search dialog simultaneously — silent data loss of the user's pasted log.

## Description

Two independent `keydown` listeners bind the same chord:

1. `FormatterPage.tsx:563-608` registers `commonShortcuts.clear` (`use-keyboard-shortcuts.ts:102-106` → `{ key: 'k', ctrlKey: true }`). Its action is `handleClearInput`, which sets `raw_log` to `''` unconditionally (`FormatterPage.tsx:550-552`) — no confirmation, no undo, works regardless of focus context.
2. `app-header.tsx:91,131-151` registers `searchHistoryShortcut` `{ key: 'k', ctrlKey: true }` on `window`, active only when logged in, but **skipping only when focus is inside an `INPUT`/`TEXTAREA`** (`:137-140`).

So when focus is anywhere except the textarea/input (e.g. the page body, a button, the history sidebar): the page handler wipes `raw_log` and the header handler opens the search dialog in the same keystroke. The recent `fix(a11y): match Cmd on macOS for primary-modifier shortcuts` (`4197a7f`) made both fire on ⌘+K on macOS as well.

Docs were corrected in the 2026-11-16 pass to describe the conflict; the code is unfixed.

## Findings

### 1. One chord, two actions — the destructive one always wins for text already entered

- **Severity:** P1
- **Files:**
  - `resources/js/pages/FormatterPage.tsx:550-552,579-582,563-608`
  - `resources/js/hooks/use-keyboard-shortcuts.ts:101-106`
  - `resources/js/components/app-header.tsx:91-100,131-151`

#### Expected Behavior

A single action per chord: either Ctrl/Cmd+K opens search (and the page-level "clear input" chord is reassigned or removed), or opening search never coexists with an unconditional destructive handler on the same keys. Data in the textarea must not be discarded without an explicit, recoverable gesture.

## Acceptance Criteria

- [ ] Pressing Ctrl/Cmd+K (focus outside an input) opens search and leaves `raw_log` untouched — or the clear-input chord is moved to a non-conflicting key and documented
- [ ] No path wipes `raw_log` as a side effect of a search chord
- [ ] Keyboard shortcut modal and tooltips show the resolved behaviour
- [ ] Escape behaviour unchanged; `npm run types` and manual test pass

## Backlinks

<!-- wiki:backlinks:start -->
<!-- wiki:backlinks:end -->
