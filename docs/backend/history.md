# History

[Home](../Home.md) › [Backend](index.md) › History

> How formatted logs are stored, listed, searched, bookmarked, exported and cleared — and why search behaves the way it does.

| | |
| --- | --- |
| **Source** | `app/Services/HistoryService.php`, `app/Http/Controllers/HistoryController.php`, `app/Models/FormattedLog.php` |
| **Owner** | backend |
| **Last verified** | 2026-11-16 against `e89b491` |

History is per-user, automatic and opt-out-by-nothing at the code level: every successful format by an authenticated user writes a row. Guests' formats are not stored.

## Storage

Rows live in `formatted_logs` (see [Schema](schema.md#formatted_logs)). `FormattedLog` uses `SoftDeletes`: `destroy` and `clear` set `deleted_at`; rows remain in the table. `raw_log` is stored verbatim — clearing history is not a scrub of past LLM/provider logs.

## Listing

`GET /history` → `payloadForUser()` returns `{ recent: [...], saved: [...] }`, newest first, up to 50 entries each split by `is_saved`. Each entry:

```json
{ "id": 12, "summary": "…", "title": "…", "preview": "first 120 chars of raw_log, newlines squished",
  "createdAt": "ISO-8601", "detectedLogType": "…", "fieldCount": 7, "isSaved": false }
```

The same payload shape is returned by `toggle-save`, `destroy` and `clear`, so the UI can re-render from one response.

## Search

`GET /history/search` — validated by `HistorySearchRequest`: `query` required, trimmed, 2–100 chars; `limit` integer 1–50 (default 20); `scope` `all|recent|saved`.

**Implementation** (`HistoryService::searchEntries`): a case-insensitive substring match —

```sql
WHERE user_id = ?
  [AND is_saved = 0|1]
  AND (title LIKE '%q%' OR summary LIKE '%q%' OR detected_log_type LIKE '%q%' OR raw_log LIKE '%q%')
ORDER BY created_at DESC
LIMIT ?
```

It is **not** a MySQL full-text index and there is none; earlier internal docs (and `docs/CHANGELOG.md`) wrongly claimed `MATCH … AGAINST`. `raw_log` is `TEXT`, so `LIKE %q%` cannot use the B-tree indexes present — it is a sequential scan per query, fine at single-user scale.

Results: `{ query, results: [...], meta: { limit, count, scope } }`; each result adds a `collection` field (`saved` | `recent`). The React dialog renders them under All/Recent/Saved tabs with a 250 ms debounce (`use-search.ts`).

## Bookmarking, export, clearing

- `PATCH /history/{id}/toggle-save` flips `is_saved`.
- `GET /history/export` streams the 1000 newest entries as pretty-printed JSON (`structlogr-history-{user}-{timestamp}.json`).
- `DELETE /history/{id}` soft-deletes one; `DELETE /history` soft-deletes all of the user's rows. There is no undelete UI.

All endpoints 404 (not 403) for entries owned by someone else. There is no `verified` middleware anywhere; `auth` only.

## Related

- [API surface](api.md#history-api-auth) — route-level contract
- [Schema](schema.md) — columns and indexes used here
- [Frontend overview](../frontend/index.md) — the hooks and dialog that consume this

## Backlinks

<!-- wiki:backlinks:start -->
| Page | Summary |
| --- | --- |
| [StructLogr wiki](../Home.md) | StructLogr turns raw log text into structured JSON with an LLM; this wiki is its map — what exists, where it lives, and what's known-broken. |
| [Architecture overview](../architecture/overview.md) | The runtime shape of StructLogr — components, the format request flow, who owns what data, and how it deploys. |
| [Archive](../archive/index.md) | Historical planning documents for the UI/UX overhaul and feature work, October 2025 — kept for reference, no longer maintained. |
| [API surface](api.md) | Every HTTP route in the app — who can call it, what it takes, what it returns. |
| [Database schema](schema.md) | Tables, columns, indexes and access patterns — what persists each request and what doesn't. |
<!-- wiki:backlinks:end -->
