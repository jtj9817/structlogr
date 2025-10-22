# Implementation Plan: History Entry Title Field

## Overview

Add a dedicated `title` field to formatted log entries that provides a concise, descriptive label for quick identification in the History panel. The title will be LLM-generated during formatting but not displayed in the main formatted output view.

---

## Phase 1: Database Schema Update

### GOAL
Add `title` column to `formatted_logs` table with proper indexing and constraints.

### CONTEXT
The `formatted_logs` table stores all formatted log entries with fields like `raw_log`, `formatted_log`, `detected_log_type`, `summary`, etc. A new `title` field is needed as a short, human-readable identifier that's separate from the detailed `summary` field. This field will be populated by LLM during formatting and used exclusively for display in the History panel.

### TASK
Create and run a database migration to add the `title` column to the existing `formatted_logs` table.

### REQUIREMENTS

**Functional:**
- `title` column must accept VARCHAR(255) for concise titles
- Column must be nullable to support existing records
- Column should be searchable (indexed)
- Existing records should have NULL titles (no backfill required)

**Non-Functional:**
- Migration must be reversible
- No data loss during migration
- Minimal downtime (add column operation is non-blocking in MySQL)

### GUIDELINES

#### File: `database/migrations/YYYY_MM_DD_HHMMSS_add_title_to_formatted_logs_table.php`

**Action:** Create new migration file

**Structure:**
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('formatted_logs', function (Blueprint $table) {
            $table->string('title', 255)->nullable()->after('detected_log_type');
            $table->index('title');
        });
    }

    public function down(): void
    {
        Schema::table('formatted_logs', function (Blueprint $table) {
            $table->dropIndex(['title']);
            $table->dropColumn('title');
        });
    }
};
```

**Rationale:**
- `string('title', 255)` - VARCHAR(255) sufficient for concise titles
- `nullable()` - Allows existing records to have NULL, no backfill needed
- `after('detected_log_type')` - Logical column ordering (type → title → summary)
- `index('title')` - Enable fast searches/filters in future
- `dropIndex` in down() - Must drop index before dropping column

**Execution:**
```bash
./vendor/bin/sail artisan make:migration add_title_to_formatted_logs_table
# Edit the generated file with the structure above
./vendor/bin/sail artisan migrate
```

**Verification:**
```bash
./vendor/bin/sail mysql
> DESCRIBE formatted_logs;
> SHOW INDEXES FROM formatted_logs;
```

Confirm `title` column exists with VARCHAR(255), nullable, and has an index.

---

## Phase 2: Backend Service Layer

### GOAL
Update `LogFormatterService` to request, extract, and persist the `title` field from LLM responses.

### CONTEXT
The `LogFormatterService` (`app/Services/LogFormatterService.php`) orchestrates LLM-based log formatting. It uses Prism SDK v2 to send requests to various LLM providers (DeepSeek, Gemini, etc.) with a structured output schema. The schema currently includes fields like `detected_log_type`, `summary`, `entities`, `metrics`, and `sections`. The service extracts these fields from the LLM response and stores them in the `formatted_logs` table.

### TASK
Add `title` field to the structured output schema, extract it from LLM responses, and persist it to the database.

### REQUIREMENTS

**Functional:**
- `title` must be added to Prism schema definition
- `title` should be a required field in LLM response (with fallback)
- `title` must be extracted and stored in database
- `title` should be 5-50 characters, concise and descriptive
- If LLM fails to provide title, fallback to truncated summary or "Untitled Log Entry"
- `title` should be included in API responses for history endpoints

**Non-Functional:**
- No breaking changes to existing API responses
- Maintain backward compatibility (title can be null)
- Preserve existing retry logic and error handling
- No performance degradation

### GUIDELINES

#### File: `app/Services/LogFormatterService.php`

**Action 1:** Update schema definition in `format()` method

**Location:** Around line ~150-200 (where schema is defined)

**Current schema structure:**
```php
$schema = [
    'type' => 'object',
    'properties' => [
        'detected_log_type' => [...],
        'summary' => [...],
        'entities' => [...],
        'metrics' => [...],
        'sections' => [...]
    ],
    'required' => ['detected_log_type', 'summary', 'entities', 'metrics', 'sections']
];
```

**Add title property:**
```php
$schema = [
    'type' => 'object',
    'properties' => [
        'detected_log_type' => [
            'type' => 'string',
            'description' => 'The detected type of log entry'
        ],
        'title' => [
            'type' => 'string',
            'description' => 'A concise, descriptive title for this log entry (5-50 characters). Should capture the key action or event. Examples: "Failed Login Attempt", "Database Connection Error", "User Registration Completed"',
            'minLength' => 5,
            'maxLength' => 50
        ],
        'summary' => [
            'type' => 'string',
            'description' => 'A detailed summary of the log entry'
        ],
        // ... rest of properties
    ],
    'required' => [
        'detected_log_type',
        'title',
        'summary',
        'entities',
        'metrics',
        'sections'
    ]
];
```

**Rationale:**
- Place `title` after `detected_log_type` for logical ordering
- Provide clear description with examples to guide LLM
- Set length constraints (5-50 chars) for UI consistency
- Mark as required to ensure LLM always provides it

**Action 2:** Extract title from LLM response

**Location:** After successful LLM response parsing (around line ~250-300)

**Current extraction pattern:**
```php
$formattedData = $response->structured_output;
$detectedLogType = $formattedData['detected_log_type'] ?? null;
$summary = $formattedData['summary'] ?? null;
// ... other fields
```

**Add title extraction with fallback:**
```php
$formattedData = $response->structured_output;
$detectedLogType = $formattedData['detected_log_type'] ?? null;
$title = $formattedData['title'] ?? null;

if (!$title || strlen($title) < 5) {
    if ($summary && strlen($summary) > 0) {
        $title = Str::limit($summary, 47, '...');
    } else {
        $title = 'Untitled Log Entry';
    }
    Log::warning('LogFormatterService: Missing or invalid title, using fallback', [
        'provided_title' => $title,
        'fallback_used' => true
    ]);
}

$summary = $formattedData['summary'] ?? null;
// ... other fields
```

**Rationale:**
- Extract title immediately after detected_log_type
- Validate minimum length (5 chars)
- Fallback to truncated summary (47 chars + '...' = 50)
- Final fallback to "Untitled Log Entry"
- Log warnings for debugging
- Use `Str::limit()` helper for safe truncation

**Action 3:** Persist title to database

**Location:** Database insert operation (around line ~350-400)

**Current insert pattern:**
```php
$formattedLog = FormattedLog::create([
    'user_id' => $userId,
    'raw_log' => $rawLog,
    'formatted_log' => $formattedData,
    'detected_log_type' => $detectedLogType,
    'summary' => $summary,
    'field_count' => $fieldCount,
    // ... other fields
]);
```

**Add title to insert:**
```php
$formattedLog = FormattedLog::create([
    'user_id' => $userId,
    'raw_log' => $rawLog,
    'formatted_log' => $formattedData,
    'detected_log_type' => $detectedLogType,
    'title' => $title,
    'summary' => $summary,
    'field_count' => $fieldCount,
    // ... other fields
]);
```

**Rationale:**
- Insert title between detected_log_type and summary
- Matches database column ordering
- Title is guaranteed to have value due to fallback logic

#### File: `app/Models/FormattedLog.php`

**Action:** Add `title` to fillable array

**Location:** `$fillable` property (around line ~20-40)

**Current:**
```php
protected $fillable = [
    'user_id',
    'raw_log',
    'formatted_log',
    'detected_log_type',
    'summary',
    'field_count',
    // ... other fields
];
```

**Updated:**
```php
protected $fillable = [
    'user_id',
    'raw_log',
    'formatted_log',
    'detected_log_type',
    'title',
    'summary',
    'field_count',
    // ... other fields
];
```

**Rationale:**
- Must be in $fillable for mass assignment
- Order matches database schema

#### File: `app/Http/Controllers/FormatterController.php`

**Action:** Ensure title is included in API response (if applicable)

**Location:** Response transformation (if any custom serialization exists)

**Verification:**
- Check if controller manually transforms FormattedLog models
- If using Eloquent API Resources, proceed to Phase 3
- If manual array building exists, ensure 'title' is included

**Most likely no changes needed** - Laravel's default JSON serialization will include the new column automatically.

---

## Phase 3: Type Definitions & API Contract

### GOAL
Update TypeScript type definitions to include the `title` field and ensure type safety across the frontend.

### CONTEXT
The frontend uses TypeScript with Inertia.js for type-safe communication between Laravel and React. The `HistoryEntry` interface (in `resources/js/types/history.ts`) defines the shape of history entries received from the backend. When the backend adds a new field to the response, the TypeScript types must be updated to maintain type safety and enable IntelliSense.

### TASK
Add `title` field to `HistoryEntry` interface and related types.

### REQUIREMENTS

**Functional:**
- `title` must be added to `HistoryEntry` interface
- `title` should be optional (nullable) for backward compatibility with existing data
- `title` must be included in `HistoryDetail` interface if present
- Type changes must not break existing code

**Non-Functional:**
- Maintain type safety across all components using history data
- Enable IntelliSense for the new field
- No runtime errors from type mismatches

### GUIDELINES

#### File: `resources/js/types/history.ts`

**Action 1:** Add `title` to `HistoryEntry` interface

**Current interface:**
```typescript
export interface HistoryEntry {
    id: number;
    createdAt: string;
    detectedLogType?: string;
    summary?: string;
    preview: string;
    fieldCount?: number;
    isSaved: boolean;
}
```

**Updated interface:**
```typescript
export interface HistoryEntry {
    id: number;
    createdAt: string;
    detectedLogType?: string;
    title?: string;
    summary?: string;
    preview: string;
    fieldCount?: number;
    isSaved: boolean;
}
```

**Rationale:**
- Add `title?` after `detectedLogType` (matches backend ordering)
- Optional (?) because existing records have NULL titles
- String type matches database VARCHAR
- Positioned logically: type → title → summary → preview

**Action 2:** Add `title` to `HistoryDetail` interface (if applicable)

**Check if interface exists:**
```typescript
export interface HistoryDetail {
    id: number;
    rawLog: string;
    formattedLog: Record<string, unknown>;
    // ... other fields
}
```

**If `HistoryDetail` exists and is used for loaded entries:**
```typescript
export interface HistoryDetail {
    id: number;
    title?: string;
    rawLog: string;
    formattedLog: Record<string, unknown>;
    // ... other fields
}
```

**Rationale:**
- Maintain consistency between HistoryEntry and HistoryDetail
- May be useful for displaying title in loaded entry view

**Verification:**
```bash
npm run types
```

Ensure no TypeScript errors after changes.

#### File: `resources/js/hooks/use-history.ts`

**Action:** Verify response transformation

**Location:** `loadEntry()` callback (around line ~107-134)

**Current:**
```typescript
const data = await request<{
    data: {
        id: number;
        raw_log: string;
        formatted_log: Record<string, unknown>;
    };
}>(buildUrl(routes.detail, id));

return {
    id: data.data.id,
    rawLog: data.data.raw_log,
    formattedLog: data.data.formatted_log,
};
```

**If title should be included in detail view:**
```typescript
const data = await request<{
    data: {
        id: number;
        title?: string;
        raw_log: string;
        formatted_log: Record<string, unknown>;
    };
}>(buildUrl(routes.detail, id));

return {
    id: data.data.id,
    title: data.data.title,
    rawLog: data.data.raw_log,
    formattedLog: data.data.formatted_log,
};
```

**Note:** This is optional and depends on whether title is needed in the detail view. For Phase 4, we only need it in the list view (HistoryEntry).

---

## Phase 4: Frontend Display

### GOAL
Update the History panel to display the new `title` field as the primary identifier for each entry.

### CONTEXT
The `HistoryEntryCard` component (`resources/js/components/formatter/history-entry-card.tsx`) currently uses `entry.summary ?? entry.preview` as the headline. The `summary` field is often verbose and the `preview` is just truncated raw text. With the new `title` field, the card should display a concise, meaningful title that makes entries easily scannable. The fallback logic should gracefully handle legacy entries with null titles.

### TASK
Update the `HistoryEntryCard` component to prioritize the `title` field over `summary` and `preview`.

### REQUIREMENTS

**Functional:**
- Display `title` as the primary headline if available
- Fallback to `summary` if title is null or empty
- Fallback to `preview` if both title and summary are null/empty
- Maintain truncation for long fallback values
- Visual design should remain consistent with current layout
- No layout shift between entries with/without titles

**Non-Functional:**
- Changes must not affect other card functionality (load, copy, delete, save)
- Maintain accessibility (screen readers should announce title)
- Smooth UX for users with mixed old/new entries

### GUIDELINES

#### File: `resources/js/components/formatter/history-entry-card.tsx`

**Action:** Update headline logic

**Location:** Line ~45 (where headline is computed)

**Current:**
```typescript
const headline = entry.summary ?? entry.preview;
```

**Updated with title priority:**
```typescript
const headline = entry.title ?? entry.summary ?? entry.preview;
```

**Rationale:**
- Simple, idiomatic fallback chain
- Prioritizes most concise → most verbose
- Handles legacy entries gracefully (null titles)
- No breaking changes for existing functionality

**Alternative (if more nuanced display is desired):**
```typescript
const headline = (() => {
    if (entry.title && entry.title.length >= 5) {
        return entry.title;
    }
    if (entry.summary) {
        return entry.summary.length > 50 
            ? entry.summary.substring(0, 47) + '...' 
            : entry.summary;
    }
    return entry.preview;
})();
```

**Rationale for alternative:**
- Validates title length (matches backend constraint)
- Explicitly truncates long summaries
- More defensive but adds complexity

**Recommendation:** Use simple version first. The backend ensures title is 5-50 chars, so validation is redundant.

**Verification:**

1. **Visual Testing:**
   - Create new formatted log → should show LLM-generated title
   - Load history with old entries → should show summary/preview
   - Verify truncation works in card (CSS already has `truncate` class)

2. **Accessibility:**
   - Screen reader should announce: "Button: [title text]"
   - Already handled by existing `id={`history-entry-headline-${entry.id}`}`

3. **Edge Cases:**
   - Empty title → falls back to summary
   - No title, no summary → falls back to preview
   - Very long title (shouldn't happen) → CSS `truncate` handles it

**No other changes needed** - The rest of the component (metadata, buttons) remains unchanged.

---

## Phase 5: Testing & Validation

### GOAL
Verify that the title field is correctly generated, stored, and displayed across the full stack.

### CONTEXT
After implementing the database, backend, types, and frontend changes, comprehensive testing is required to ensure the feature works end-to-end. This includes testing LLM generation, database persistence, API responses, and UI rendering.

### TASK
Execute a structured testing plan covering database integrity, backend service behavior, API contracts, and frontend rendering.

### REQUIREMENTS

**Functional:**
- New formatted logs must have non-null titles
- Titles must be 5-50 characters
- Legacy entries (null title) must display summary/preview
- Title must appear in History panel as primary identifier
- All existing History features (load, copy, delete, save) must work unchanged

**Non-Functional:**
- No performance regression in formatting or history loading
- No console errors in browser
- No warnings in Laravel logs (except fallback warnings)
- Type safety maintained (no TypeScript errors)

### GUIDELINES

#### Step 1: Database Validation

**Commands:**
```bash
./vendor/bin/sail mysql
```

**SQL Queries:**
```sql
-- Verify column exists
DESCRIBE formatted_logs;

-- Check index exists
SHOW INDEXES FROM formatted_logs WHERE Column_name = 'title';

-- Verify existing records have null titles
SELECT COUNT(*) as null_titles FROM formatted_logs WHERE title IS NULL;

-- Verify new records have titles (after running Step 2)
SELECT id, title, detected_log_type FROM formatted_logs ORDER BY id DESC LIMIT 10;
```

**Expected Results:**
- `title` column: VARCHAR(255), NULL allowed, has index
- All records created before migration: `title IS NULL`
- All records created after implementation: `title IS NOT NULL` and length 5-50

#### Step 2: Backend Service Testing

**Test 1: Format new log entry**

**Commands:**
```bash
./vendor/bin/sail artisan tinker
```

**Code:**
```php
use App\Services\LogFormatterService;
use App\Models\User;

$service = app(LogFormatterService::class);
$user = User::first(); // or create test user

$rawLog = '2024-01-15 10:23:45 ERROR [db.connection] Failed to connect to database: Connection timeout after 30s';

$result = $service->format($rawLog, $user->id, []);

// Check result
echo "Title: " . ($result['title'] ?? 'NOT SET') . "\n";
echo "Length: " . strlen($result['title'] ?? '') . "\n";
echo "Summary: " . ($result['summary'] ?? 'NOT SET') . "\n";
```

**Expected:**
- `title` is present in result
- Title length is 5-50 characters
- Title is concise (e.g., "Database Connection Timeout")
- Summary is more detailed

**Test 2: Verify database persistence**

**Code (continue in tinker):**
```php
use App\Models\FormattedLog;

$log = FormattedLog::latest()->first();
echo "ID: " . $log->id . "\n";
echo "Title: " . $log->title . "\n";
echo "Type: " . $log->detected_log_type . "\n";
```

**Expected:**
- `title` field is populated in database
- Matches the value from formatting result

**Test 3: Check logs for warnings**

**Command:**
```bash
./vendor/bin/sail exec laravel.test tail -f storage/logs/laravel.log | grep "LogFormatterService"
```

**Expected:**
- No errors about missing title field
- Warning logs only if LLM fails to provide title (fallback triggered)

#### Step 3: TypeScript Type Checking

**Command:**
```bash
npm run types
```

**Expected:**
- No TypeScript errors
- Build completes successfully

**Manual check in IDE:**
- Open `resources/js/components/formatter/history-entry-card.tsx`
- Type `entry.` and verify IntelliSense shows `title` property
- Hover over `entry.title` → should show `string | undefined`

#### Step 4: Frontend Integration Testing

**Test 1: New entry displays title**

**Steps:**
1. Start dev server: `npm run dev`
2. Navigate to formatter page
3. Submit a log for formatting
4. Open History panel (click History icon)
5. Verify newest entry shows a concise title

**Expected:**
- Title is displayed as headline
- Title is NOT the full summary or raw log preview
- Title is 5-50 characters

**Test 2: Legacy entries display fallback**

**Setup:**
```bash
./vendor/bin/sail mysql
```

```sql
-- Verify you have old entries with null titles
SELECT id, title, summary FROM formatted_logs WHERE title IS NULL LIMIT 5;
```

**Steps:**
1. Open History panel
2. Find entries created before this feature (null title)
3. Verify they display summary or preview

**Expected:**
- Old entries show summary text (if available)
- Or show preview text if summary is also null
- No blank headlines
- No error messages or console errors

**Test 3: All card actions still work**

**Steps:**
1. Click entire card → should load entry
2. Click star icon → should toggle saved status
3. Click copy icon → should copy to clipboard
4. Click delete icon → should remove entry
5. Verify disabled state (logged out users)

**Expected:**
- All actions function identically to before
- No regressions in behavior

**Test 4: Responsive layout**

**Steps:**
1. Resize browser to mobile width (< 640px)
2. Check History panel on tablet (640-1024px)
3. Check on desktop (> 1024px)

**Expected:**
- Title truncates gracefully with ellipsis
- Icons remain clickable (44px minimum touch target)
- No layout overflow

#### Step 5: End-to-End Workflow Test

**Complete user flow:**

1. **Register/Login** as test user
2. **Format 3 different log types:**
   - Error log (e.g., database error)
   - Access log (e.g., HTTP request)
   - Application log (e.g., user action)
3. **Open History panel**
   - Verify all 3 entries have unique, descriptive titles
   - Titles should reflect log content, not be generic
4. **Toggle one to saved**
   - Switch to "Saved" tab
   - Verify title displays correctly
5. **Load an entry**
   - Click on a card
   - Verify formatted log displays
   - Panel should close
6. **Reopen History**
   - Verify entries still have titles
7. **Export history**
   - Click "Export" button
   - Verify downloaded JSON includes `title` field
8. **Clear history**
   - Click "Clear All"
   - Confirm dialog
   - Create new entry
   - Verify title still generates

**Expected:**
- Seamless experience with no errors
- Titles provide meaningful differentiation between entries
- Feature enhances usability without disrupting existing functionality

#### Step 6: Performance Check

**Metrics to monitor:**

1. **Formatting time:**
   ```bash
   grep "duration_ms" storage/logs/laravel.log | tail -20
   ```
   - Compare before/after implementation
   - Should be < 50ms difference (negligible)

2. **History load time:**
   - Open browser DevTools → Network tab
   - Load History panel
   - Check API response time for history endpoint
   - Should be < 100ms for 20 entries

3. **Database query performance:**
   ```bash
   ./vendor/bin/sail artisan tinker
   ```
   ```php
   DB::enableQueryLog();
   $entries = \App\Models\FormattedLog::latest()->limit(20)->get();
   DB::getQueryLog();
   ```
   - Verify only 1 query executed (no N+1)
   - Query should use index on `created_at` and/or `title`

**Expected:**
- No measurable performance degradation
- Database queries remain efficient
- Frontend rendering performance unchanged

---

## Rollback Plan

### If Critical Issues Are Discovered

**Immediate Rollback (Phase 4):**
```typescript
// In history-entry-card.tsx, revert to:
const headline = entry.summary ?? entry.preview;
```

**Database Rollback (Phase 1):**
```bash
./vendor/bin/sail artisan migrate:rollback --step=1
```

**Backend Rollback (Phase 2):**
- Revert changes to `LogFormatterService.php`
- Remove `title` from schema
- Remove title extraction and storage logic
- Deploy previous version

**Type Rollback (Phase 3):**
- Revert changes to `resources/js/types/history.ts`
- Run `npm run types` to verify

**Note:** Rollback is safe because:
- `title` field is nullable (no data corruption)
- Frontend has fallback logic (graceful degradation)
- No foreign key constraints or complex relationships

---

## Success Criteria

**Feature is considered successfully implemented when:**

1. ✅ Database migration runs without errors
2. ✅ New formatted logs have non-null, descriptive titles (5-50 chars)
3. ✅ Legacy entries display summary/preview fallback gracefully
4. ✅ History panel shows titles as primary identifier
5. ✅ All existing History features work unchanged
6. ✅ No TypeScript errors
7. ✅ No console errors in browser
8. ✅ No performance degradation (< 50ms difference)
9. ✅ Code quality checks pass (`npm run lint`, `./vendor/bin/sail composer pint`)
10. ✅ Manual testing confirms improved UX and scannability

**Delivery Artifacts:**
- Migration file in `database/migrations/`
- Updated `LogFormatterService.php`
- Updated `FormattedLog.php` model
- Updated TypeScript types in `resources/js/types/history.ts`
- Updated `history-entry-card.tsx` component
- This implementation document in `docs/`
