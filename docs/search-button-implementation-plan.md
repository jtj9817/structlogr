# Search Button Implementation Plan

## Phase 1 – Define Search Behaviour & Data Contract
GOAL: Establish what the search experience should return so the backend contract matches the existing UI expectations.
CONTEXT: Review `resources/js/components/app-header.tsx`, `resources/js/pages/FormatterPage.tsx`, `resources/js/hooks/use-history.ts`, and `app/Models/FormattedLog.php` to align the search intent with available data.
TASK: Document the searchable fields, target audience (authenticated users vs guests), request parameters, and response structure that the frontend will consume.
REQUIREMENTS
- Capture which `FormattedLog` attributes (`title`, `summary`, `preview`, timestamps, save state) must be searchable/returned.
- Specify query validation rules (minimum length, supported filters, optional limit) and default behaviour when the query is empty.
- Define a consistent JSON payload that TypeScript types can mirror without using `any`.
- Outline fallback UX for unauthenticated users (disable, show modal explaining login requirement, or provide public search scope).
GUIDELINES:
- Apply Polya’s first steps (understand + devise plan) by diagramming request/response flow before coding.
- Adhere to Laravel 12 conventions when mapping model fields and ensure no sensitive user data leaks.
- Verify that the new contract can be represented with strict TypeScript interfaces in `resources/js/types/`.

## Phase 2 – Implement Laravel Search Endpoint
GOAL: Provide a secure, validated backend endpoint that returns structured search results for the header search action.
CONTEXT: Update `routes/web.php` (or a dedicated routes file if needed) to expose `/history/search`, add a controller method in a new `App\Http\Controllers\HistorySearchController` (or extend `HistoryController` if cohesive), create `app/Http/Requests/HistorySearchRequest.php`, and extend `App\Services\HistoryService`.
TASK: Wire a GET endpoint that authorises the current user, validates query inputs, executes an Eloquent search restricted to the authenticated user’s `FormattedLog` records, and returns the contract from Phase 1 with graceful error handling.
REQUIREMENTS
- Route name should follow kebab-case (`history.search`) and remain behind `auth` middleware.
- Validation must enforce string query length, optional `limit`, and safe defaults (e.g., default limit 20, max 50).
- Service query must constrain by `user_id`, support partial matches on `title`, `summary`, and derived preview text, and sort by recency.
- Responses use HTTP 200 for success, 204 for empty results, 401/403 for unauthenticated access, and 422 for validation errors.
- Add a dedicated Pest feature test in `tests/Feature/History/SearchHistoryTest.php` covering success, empty result, unauthorised, and foreign record isolation.
GUIDELINES:
- Use dedicated DTO/array transformers in the service to keep controllers lean and reusable.
- Sanitize user input using bound parameters to avoid SQL injection.
- Apply Polya’s third step (carry out the plan) by iterating with tests: write failing tests, implement functionality, re-run tests.

## Phase 3 – Frontend Integration & UX Completion
GOAL: Connect the header search button to a fully functioning search experience that consumes the new endpoint.
CONTEXT: Update `resources/js/components/app-header.tsx` to trigger a search modal or command palette, add a new component in `resources/js/components/search/search-command-menu.tsx`, introduce a strict type definition in `resources/js/types/search.ts`, and create a hook (e.g., `resources/js/hooks/use-search.ts`) for data fetching and state management.
TASK: Implement the UI interactions (open/close modal, keyboard shortcut, debounce input), call the backend via `router.get` or a dedicated fetch helper, manage loading/error states, and render results with saved/recent badges that match existing history cards.
REQUIREMENTS
- Ensure TypeScript `strict` compliance by defining `SearchResult` and related types—no `any` usage.
- Reuse existing styling primitives (Buttons, Inputs, Command components if present) with Tailwind classes and Radix UI patterns.
- For guests, either disable the button with tooltip messaging or direct them to login; ensure graceful degradation.
- Handle request cancellation/debouncing to avoid race conditions; surface errors through the Inertia error bag or inline messaging.
- Provide aria labels, focus trapping, and keyboard navigation for accessibility.
GUIDELINES:
- Follow React 19 and Inertia 2.0 best practices—prefer hooks over legacy state patterns, and keep network calls within hooks/actions.
- Keep imports grouped (external → internal → types) and alphabetised.
- Apply Polya’s reflection step by validating the UX against the documented contract and adjusting copy/edge cases before concluding.

## Phase 4 – Validation, QA, and Documentation
GOAL: Verify correctness end-to-end and document the new feature for future contributors.
CONTEXT: Extend the test suite (`tests/Feature/History/SearchHistoryTest.php`, potential frontend tests under `resources/js/__tests__/` if Vitest is configured), update developer docs (`docs/` index or README sections), and ensure CI scripts cover the new behaviour.
TASK: Write automated tests for backend logic, optional component tests or storybook notes for the frontend, update docs with usage instructions, and run quality checks (`./vendor/bin/sail artisan test`, `npm run types`, `npm run lint`).
REQUIREMENTS
- Capture regression cases (empty query rejection, exceeding limit, unauthenticated access) in tests.
- Document manual QA steps (e.g., search for saved log titles, verify guest tooltip) in `docs/` or existing QA checklists.
- Ensure Laravel Pint and frontend formatting pass to keep the repo consistent.
- Confirm zero console errors and no TypeScript warnings after integration.
GUIDELINES:
- Use Polya’s final review stage: re-evaluate assumptions, compare outcomes with original goals, and log follow-up tasks if gaps remain.
- Provide clear commit guidance (summary line, testing notes) for future PRs.
