# Search Button Phase 1 Specification

This document captures the outcomes from Phase 1 of the search-button plan. It defines the behaviour, server contract, validation rules, and UX fallbacks needed to complete the feature using the current Laravel + Inertia stack.

## 1. Domain Review
- `FormattedLog` fields relevant to search (see `app/Models/FormattedLog.php` and migrations):
  - `id`, `user_id`, timestamps, soft-deletes.
  - Content fields: `title` (nullable `string`, indexed), `summary` (nullable `string`), `raw_log` (`text`), `detected_log_type` (`string`), `formatted_log` (`json`), `field_count` (`unsignedInteger`), `is_saved` (`boolean`).
- `HistoryService::payloadForUser()` currently transforms entries into two buckets (`recent`, `saved`) exposing `summary`, `title`, `preview`, `createdAt`, `detectedLogType`, `fieldCount`, `isSaved`.
- Front-end history consumers (`useHistory`, `HistorySidebar`, etc.) read the shape defined in `resources/js/types/history.ts`.

## 2. Search Goals
- Surface a lightweight “personal log search” scoped to the authenticated user.
- Support quick filtering by words appearing in `title`, `summary`, or `raw_log`, prioritising recently created entries.
- Reuse existing history card UI so users can open an entry, copy data, or navigate to history.
- Provide fast feedback inside the header-triggered command palette/modal, with keyboard navigation.

## 3. HTTP Contract
- **Route**: `GET /history/search`
- **Name**: `history.search`
- **Middleware**: `auth`, `verified` (implicit if current `history` group already applies email verification), `throttle:60,1`.
- **Query Parameters**:
  - `query` (`string`, required): user-entered search string. Minimum 2 characters after trimming.
  - `limit` (`int`, optional): maximum results to return. Defaults to 20; caps at 50.
  - `scope` (`string`, optional): enum `all | recent | saved`. Defaults to `all`. Determines whether to filter by `is_saved`.
- **Successful Response (HTTP 200)**:
  ```json
  {
      "data": {
          "query": "timeout",
          "results": [
              {
                  "id": 123,
                  "title": "Timeout at gateway",
                  "summary": "HTTP 504 observed in api-gateway",
                  "preview": "2025-10-22 08:22:11 [error] Gateway timeout after 30s ...",
                  "detectedLogType": "http",
                  "createdAt": "2025-10-22T08:22:11Z",
                  "fieldCount": 18,
                  "isSaved": true,
                  "collection": "saved"
              }
          ],
          "meta": {
              "limit": 20,
              "count": 1,
              "scope": "all"
          }
      }
  }
  ```
- **Empty Result**: return HTTP 200 with `"results": []` (avoid 204 so the UI can distinguish empty vs no response body).
- **Validation Failures**: HTTP 422 with Inertia-friendly error bag (`errors.query`).
- **Unauthenticated**: HTTP 401 redirection handled by middleware; for API fetches return JSON 401.

## 4. Validation & Defaults
- Trim `query`; reject if length < 2 or > 100 characters.
- Set `limit = min(max($request->integer('limit', 20), 1), 50)`.
- `scope` accepts `all`, `recent`, `saved`; default `all`.
- When the query is missing or invalid, respond with 422 and message “Enter at least 2 characters to search your history.”
- When users have no matching entries, return empty array with the same meta block for consistent client handling.

## 5. Response Mapping
- Reuse the transformer logic from `HistoryService::payloadForUser()` so consumers receive consistent fields.
- `collection` indicates whether an entry originated from the saved or recent bucket (`saved` if `is_saved === true`, otherwise `recent`).
- `preview` should mirror formatting in `HistoryService` (squished single-line excerpt limited to 120 characters).
- `detectedLogType` and `fieldCount` allow the UI to show existing badges/tooltips.

### TypeScript Definitions (to be added in Phase 3)
```ts
export type SearchScope = 'all' | 'recent' | 'saved';

export interface SearchResult {
    id: number;
    title: string | null;
    summary: string | null;
    preview: string;
    detectedLogType: string | null;
    createdAt: string;
    fieldCount: number;
    isSaved: boolean;
    collection: 'recent' | 'saved';
}

export interface SearchResponse {
    query: string;
    results: SearchResult[];
    meta: {
        limit: number;
        count: number;
        scope: SearchScope;
    };
}
```

## 6. UX & Access States
- **Authenticated Users**: button opens command palette/modal. On submit:
  - show loading indicator, debounce input (e.g., 250 ms) to avoid spamming.
  - if no results, display “No matches in your history yet” with hint to refine query.
  - allow navigation (enter to load entry, ⌘K to reopen, arrow keys to move, escape to close).
- **Guests**: search button disabled; tooltip “Sign in to search your history.” Optionally redirect to login when clicked.
- **Errors**: show inline toast/banner “Search failed—try again later.” Provide retry action.

## 7. Backend Implementation Notes
- **Simplest MySQL Strategy**: use a plain `LIKE`-based query scoped to the user.
  ```php
  FormattedLog::query()
      ->forUser($user->id)
      ->when($scope === 'saved', fn ($query) => $query->where('is_saved', true))
      ->when($scope === 'recent', fn ($query) => $query->where('is_saved', false))
      ->where(function ($query) use ($searchTerm) {
          $like = '%'.$searchTerm.'%';
          $query->where('title', 'like', $like)
                ->orWhere('summary', 'like', $like)
                ->orWhere('detected_log_type', 'like', $like)
                ->orWhere('raw_log', 'like', $like);
      })
      ->latest()
      ->limit($limit)
      ->get();
  ```
  - This approach works with the existing schema, leverages the `title` index, and keeps the implementation straightforward.
  - `raw_log` is a `TEXT` column; although `LIKE` scans can be slower, limiting results and scoping by `user_id` keeps the query manageable. We can revisit dedicated indexes or full-text search if performance becomes an issue.
- Transform results using a dedicated method (e.g., `HistoryService::transformEntry`) shared with existing payload logic to avoid duplication.

## 8. Polya Checkpoints
1. **Understand the problem**: Identified data sources (`FormattedLog`), UI expectations, and user states.
2. **Devise a plan**: Chose a minimal route, validation rules, and `LIKE`-based search compatible with current MySQL setup.
3. **Carry out**: This spec provides the blueprint for Phase 2 & 3 implementation, ensuring backend and frontend align.
4. **Review**: Before coding, compare upcoming implementations against this document to confirm all constraints (auth scope, typing, UX) are respected; adjust if new requirements appear.
