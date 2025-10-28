# History Feature Documentation

This document provides a comprehensive overview of the History Management system in StructLogr, including architecture, implementation details, and usage patterns.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [User Interface](#user-interface)
8. [Usage Examples](#usage-examples)

---

## Overview

The History feature allows authenticated users to:
- **Track** all formatted log entries automatically
- **Save** important entries for quick access
- **Browse** recent and saved entries with preview text
- **Search** through history with full-text search (titles, summaries, raw logs, log types)
- **Filter** search results by scope (all, recent, saved)
- **Export** entire history as JSON
- **Delete** individual or all history entries
- **Load** previous entries back into the formatter

### Key Features

- **User-specific**: Each user has their own isolated history
- **Automatic tracking**: All formatted logs are saved automatically
- **Saved/Recent separation**: Organize entries into two categories
- **Rich metadata**: Store summaries, log types, field counts, and LLM-generated titles
- **LLM-generated titles**: Concise 5-50 character titles for quick identification (NEW - October 2025)
- **Export capability**: Download complete history for external analysis
- **Soft deletes**: Support for data recovery if needed

---

## Architecture

The History system follows a layered architecture:

```
┌─────────────────────────────────────────┐
│         Frontend (React)                │
│  ┌────────────────────────────────────┐ │
│  │  HistorySidebar Component          │ │
│  │  - Tabbed UI (Recent/Saved)        │ │
│  │  - Entry cards with actions        │ │
│  │  - Export/Clear controls           │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  useHistory Hook                   │ │
│  │  - State management                │ │
│  │  - API communication               │ │
│  │  - CSRF handling                   │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    ↓ HTTP/JSON
┌─────────────────────────────────────────┐
│         Backend (Laravel)               │
│  ┌────────────────────────────────────┐ │
│  │  HistoryController                 │ │
│  │  - index()                         │ │
│  │  - show()                          │ │
│  │  - search()                        │ │
│  │  - destroy()                       │ │
│  │  - toggleSave()                    │ │
│  │  - clear()                         │ │
│  │  - export()                        │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  HistoryService                    │ │
│  │  - entriesForUser()                │ │
│  │  - payloadForUser()                │ │
│  │  - search()                        │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  FormattedLog Model                │ │
│  │  - Eloquent ORM                    │ │
│  │  - Relationships                   │ │
│  │  - Accessors/Mutators              │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      MySQL Database                     │
│  ┌────────────────────────────────────┐ │
│  │  formatted_logs table              │ │
│  │  - user_id (FK)                    │ │
│  │  - raw_log (TEXT)                  │ │
│  │  - formatted_log (JSON)            │ │
│  │  - detected_log_type (VARCHAR)     │ │
│  │  - title (VARCHAR)                 │ │
│  │  - summary (TEXT)                  │ │
│  │  - field_count (INT)               │ │
│  │  - is_saved (BOOLEAN)              │ │
│  │  - timestamps                      │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## Backend Implementation

### HistoryController

**Location**: `app/Http/Controllers/HistoryController.php`

#### Constructor

```php
public function __construct(private HistoryService $historyService) {}
```

Uses dependency injection to inject `HistoryService`.

#### Methods

##### index()

```php
public function index(Request $request): JsonResponse
```

**Purpose**: Retrieve all history entries for the authenticated user

**Returns**:
```json
{
  "data": {
    "recent": [...],
    "saved": [...]
  }
}
```

**Authorization**: Requires authentication

---

##### show()

```php
public function show(Request $request, FormattedLog $formattedLog): JsonResponse
```

**Purpose**: Retrieve a specific history entry

**Parameters**:
- `$formattedLog`: Route model binding to `FormattedLog`

**Returns**:
```json
{
  "data": {
    "id": 123,
    "raw_log": "...",
    "formatted_log": {...}
  }
}
```

**Authorization**: Verifies entry belongs to user via `authorizeEntry()`

---

##### destroy()

```php
public function destroy(Request $request, FormattedLog $formattedLog): JsonResponse
```

**Purpose**: Delete a specific history entry

**Returns**: Updated history payload

**Authorization**: Verifies entry belongs to user

---

##### toggleSave()

```php
public function toggleSave(Request $request, FormattedLog $formattedLog): JsonResponse
```

**Purpose**: Toggle the `is_saved` status of an entry

**Logic**:
```php
$formattedLog->forceFill([
    'is_saved' => !$formattedLog->is_saved,
])->save();
```

**Returns**: Updated history payload

---

##### clear()

```php
public function clear(Request $request): JsonResponse
```

**Purpose**: Delete all history entries for the user

**Logic**:
```php
FormattedLog::query()
    ->where('user_id', $user->id)
    ->delete();
```

**Returns**: Empty history payload

---

##### export()

```php
public function export(Request $request): StreamedResponse
```

**Purpose**: Export user's history as JSON file

**Filename**: `structlogr-history-{userId}-{timestamp}.json`

**Content**:
```json
[
  {
    "id": 123,
    "summary": "...",
    "rawLog": "...",
    "formattedLog": {...},
    "detectedLogType": "...",
    "fieldCount": 5,
    "isSaved": false,
    "createdAt": "2025-10-21T12:34:56Z"
  },
  ...
]
```

**Limit**: 1000 entries

---

### HistoryService

**Location**: `app/Services/HistoryService.php`

#### entriesForUser()

```php
public function entriesForUser(User $user, int $limit = 50): Collection
```

**Purpose**: Fetch formatted logs for a user

**Query**:
```php
FormattedLog::query()
    ->where('user_id', $user->id)
    ->latest()
    ->limit($limit)
    ->get();
```

**Returns**: Collection of `FormattedLog` models

---

#### payloadForUser()

```php
public function payloadForUser(User $user, int $limit = 50): array
```

**Purpose**: Format history entries for frontend consumption

**Processing**:
1. Fetch entries using `entriesForUser()`
2. Transform each entry:
   - Extract `id`, `summary`, `detectedLogType`, `fieldCount`, `isSaved`
   - Generate preview text (120 char limit, sanitized)
   - Format timestamp as ISO 8601
3. Separate into `recent` (not saved) and `saved` arrays

**Returns**:
```php
[
    'recent' => [...],
    'saved' => [...]
]
```

---

### FormattedLog Model

**Location**: `app/Models/FormattedLog.php`

#### Relationships

```php
public function user(): BelongsTo
{
    return $this->belongsTo(User::class);
}
```

#### Fillable Attributes

```php
protected $fillable = [
    'user_id',
    'raw_log',
    'formatted_log',
    'summary',
    'detected_log_type',
    'field_count',
    'is_saved',
];
```

#### Casts

```php
protected $casts = [
    'formatted_log' => 'array',
    'is_saved' => 'boolean',
];
```

#### Soft Deletes

```php
use SoftDeletes;
```

---

## Frontend Implementation

### useHistory Hook

**Location**: `resources/js/hooks/use-history.ts`

#### Initialization

```typescript
const {
    recentEntries,
    savedEntries,
    loadEntry,
    removeEntry,
    toggleSaved,
    clearHistory,
    exportHistory,
    isLoading,
    canManage
} = useHistory({ initialHistory, routes });
```

#### Parameters

- `initialHistory`: Server-provided initial data (SSR)
- `routes`: API endpoint URLs

#### State Management

```typescript
const [recentEntries, setRecentEntries] = useState<HistoryEntry[]>([]);
const [savedEntries, setSavedEntries] = useState<HistoryEntry[]>([]);
const [isLoading, setIsLoading] = useState(false);
```

#### Methods

##### loadEntry()

```typescript
async loadEntry(id: number): Promise<HistoryDetail | null>
```

**Purpose**: Fetch full details of a history entry

**Request**:
```typescript
GET /history/{id}
```

**Returns**:
```typescript
{
  id: number;
  rawLog: string;
  formattedLog: Record<string, unknown>;
}
```

---

##### removeEntry()

```typescript
async removeEntry(id: number): Promise<void>
```

**Purpose**: Delete a history entry

**Request**:
```typescript
DELETE /history/{id}
```

**Side effects**: Updates local state with server response

---

##### toggleSaved()

```typescript
async toggleSaved(id: number): Promise<void>
```

**Purpose**: Toggle saved status

**Request**:
```typescript
PATCH /history/{id}/toggle-save
```

**Side effects**: Moves entry between recent/saved arrays

---

##### clearHistory()

```typescript
async clearHistory(): Promise<void>
```

**Purpose**: Clear all history

**Request**:
```typescript
DELETE /history
```

**Side effects**: Clears all entries from state

---

##### exportHistory()

```typescript
exportHistory(): void
```

**Purpose**: Download history as JSON

**Implementation**:
```typescript
window.open(routes.export, '_blank', 'noopener');
```

---

#### CSRF Protection

The hook automatically includes CSRF tokens in requests:

```typescript
const token = getCsrfToken();
if (token && !headers.has('X-CSRF-TOKEN')) {
    headers.set('X-CSRF-TOKEN', token);
}
```

---

### HistorySidebar Component

**Location**: `resources/js/components/formatter/history-sidebar.tsx`

#### Props Interface

```typescript
interface HistorySidebarProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onLoadEntry: (id: number) => Promise<void>;
    onCopyEntry: (id: number) => Promise<string | null>;
    onRemoveEntry: (id: number) => Promise<void>;
    onToggleSaved: (id: number) => Promise<void>;
    onClearHistory: () => Promise<void>;
    onExportHistory: () => void;
    recentEntries: HistoryEntry[];
    savedEntries: HistoryEntry[];
    isProcessing?: boolean;
    canManage: boolean;
}
```

#### Features

- **Tabbed Interface**: Recent vs Saved entries
- **Scroll Area**: Virtualized scrolling for performance
- **Entry Cards**: Rich entry display with actions
- **Bulk Actions**: Export and Clear All buttons
- **Empty States**: Contextual messages for guest/authenticated users
- **Confirmation Dialogs**: Prevent accidental data loss

#### Keyboard Navigation

- Tab through entries
- Enter to load entry
- Delete to remove entry (when focused)

---

### HistoryEntryCard Component

**Location**: `resources/js/components/formatter/history-entry-card.tsx`

#### Display Elements

- **Summary**: Primary headline
- **Preview**: Truncated raw log text
- **Metadata**: Log type badge, field count, timestamp
- **Actions**: Load, Save/Unsave, Copy, Delete

#### Layout Optimizations (October 22, 2025)

The history entry cards have been optimized for space efficiency:

- **Reduced padding**: Changed from `p-4` to `p-3` for more compact display
- **Tighter gaps**: Decreased spacing between cards from `gap-3` to `gap-2`
- **Optimized header**: Streamlined spacing and margins in card headers
- **Improved metadata layout**: Better use of vertical space for timestamp and field count
- **More visible entries**: Space optimizations allow more entries to be visible without scrolling

#### Action Buttons

```typescript
<Button onClick={() => onLoad()}>Load</Button>
<Button onClick={() => onToggleSave()}>
    {isSaved ? <BookmarkX /> : <Bookmark />}
</Button>
<Button onClick={() => onCopy()}>
    <Copy />
</Button>
<Button onClick={() => onDelete()}>
    <Trash2 />
</Button>
```

---

## Database Schema

### formatted_logs Table

```sql
CREATE TABLE formatted_logs (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NULL,
    raw_log TEXT NOT NULL,
    formatted_log JSON NOT NULL,
    detected_log_type VARCHAR(255) NULL,
    title VARCHAR(255) NULL,
    summary TEXT NULL,
    field_count INT UNSIGNED DEFAULT 0,
    is_saved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_title (title),
    INDEX idx_is_saved (is_saved),
    INDEX idx_created_at (created_at),
    INDEX (user_id, created_at)
);
```

#### Column Descriptions

- **user_id**: Foreign key to users table (nullable for guest logs)
- **raw_log**: Original unformatted log text
- **formatted_log**: JSON structured output from LLM
- **detected_log_type**: Classification (e.g., "application_error", "http_access")
- **title**: LLM-generated concise title (5-50 characters) for quick identification (NEW - October 2025)
- **summary**: Detailed text summary of log entry
- **field_count**: Number of fields extracted (for UI indicators)
- **is_saved**: Boolean flag for saved entries
- **deleted_at**: Soft delete timestamp

#### Indexes

- **Primary**: `id` (auto-increment)
- **Single Indexes**: `user_id`, `title`, `is_saved`, `created_at` for efficient queries
- **Composite**: `(user_id, created_at)` for efficient history queries

---

## API Endpoints

### Authenticated Routes

All history endpoints require authentication:

```php
Route::middleware('auth')->group(function () {
    Route::get('/history', [HistoryController::class, 'index'])
        ->name('history.index');
    
    Route::get('/history/search', [HistoryController::class, 'search'])
        ->name('history.search');
    
    Route::get('/history/{formattedLog}', [HistoryController::class, 'show'])
        ->name('history.show');
    
    Route::delete('/history/{formattedLog}', [HistoryController::class, 'destroy'])
        ->name('history.destroy');
    
    Route::patch('/history/{formattedLog}/toggle-save', [HistoryController::class, 'toggleSave'])
        ->name('history.toggle');
    
    Route::delete('/history', [HistoryController::class, 'clear'])
        ->name('history.clear');
    
    Route::get('/history/export', [HistoryController::class, 'export'])
        ->name('history.export');
});
```

### Request/Response Examples

#### GET /history

**Response**:
```json
{
  "data": {
    "recent": [
      {
        "id": 123,
        "title": "Database Connection Timeout",
        "summary": "Database connection failed",
        "preview": "2024-10-15 14:23:45 [ERROR] Database connection failed - timeout after 30s",
        "createdAt": "2025-10-21T12:34:56Z",
        "detectedLogType": "application_error",
        "fieldCount": 5,
        "isSaved": false
      }
    ],
    "saved": []
  }
}
```

#### GET /history/123

**Response**:
```json
{
  "data": {
    "id": 123,
    "raw_log": "2024-10-15 14:23:45 [ERROR] Database connection failed - timeout after 30s",
    "formatted_log": {
      "detected_log_type": "application_error",
      "summary": {...},
      "entities": [...],
      "metrics": [...],
      "sections": [...]
    }
  }
}
```

#### GET /history/search

**Query Parameters**:
- `query` (required): Search query string (2-100 characters, trimmed)
- `limit` (optional): Results limit (1-50, default: 20)
- `scope` (optional): Search scope - 'all' (default), 'recent', 'saved'

**Request Example**:
```
GET /history/search?query=timeout&limit=20&scope=all
```

**Response**:
```json
{
  "data": {
    "query": "timeout",
    "results": [
      {
        "id": 123,
        "title": "Database Connection Timeout",
        "summary": "Database connection failed",
        "preview": "2024-10-15 14:23:45 [ERROR] Database connection failed - timeout after 30s",
        "detectedLogType": "application_error",
        "createdAt": "2025-10-21T12:34:56Z",
        "fieldCount": 5,
        "isSaved": false,
        "collection": "recent"
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

**Search Features**:
- **Full-text search**: MySQL `MATCH ... AGAINST` syntax searches across `title`, `summary`, `raw_log`, and `detected_log_type` columns
- **Scope filtering**: 
  - `'all'`: Searches all user history entries
  - `'recent'`: Searches only unsaved entries (`is_saved = false`)
  - `'saved'`: Searches only bookmarked entries (`is_saved = true`)
- **Relevance ordering**: Results ordered by relevance score, then creation date (DESC)
- **Privacy isolation**: All searches scoped to authenticated user only
- **Validation**: Query sanitization via `HistorySearchRequest` with whitespace trimming

---

## User Interface

### Accessing History

- **Search Keyboard Shortcut**: `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux) - Opens search dialog
- **Sidebar Keyboard Shortcut**: `Cmd+H` (Mac) / `Ctrl+H` (Windows/Linux) - Toggles history sidebar
- **Search Button**: Magnifying glass icon in header
- **History Button**: History icon in toolbar
- **Auto-open**: After formatting a log (optional setting)

### Sidebar Layout

```
┌─────────────────────────────────────┐
│  History                        [X] │
├─────────────────────────────────────┤
│  [Recent]  [Saved]                  │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │ 📋 Database Connection Timeout│  │  ← LLM-generated title
│  │ 2024-10-15 14:23:45          │  │
│  │ application_error • 5 fields │  │
│  │ [★] [📋] [🗑️]                │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ 🔧 User Login Successful      │  │  ← LLM-generated title
│  │ 2024-10-15 14:20:12          │  │
│  │ ...                           │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  [Export] [Clear All]               │
└─────────────────────────────────────┘
```

**Title Display (NEW - October 2025)**:
- Primary headline shows LLM-generated title (5-50 characters)
- Concise, descriptive labels for quick identification
- Fallback to summary or preview for legacy entries (null titles)
- Improves scannability and entry differentiation

### Entry Actions

| Action | Icon | Behavior |
|--------|------|----------|
| Load | ↑ | Loads entry into formatter |
| Save | 📌 | Toggles saved status |
| Copy | 📋 | Copies formatted log to clipboard |
| Delete | 🗑️ | Removes entry (with confirmation) |

---

## Usage Examples

### Basic Workflow

1. **Format a log** using the main formatter
2. **Entry auto-saves** to Recent history
3. **Mark as saved** if important
4. **Search history** via search dialog (`Cmd+K` / `Ctrl+K`)
5. **Browse history** via sidebar (`Cmd+H` / `Ctrl+H`)
6. **Load previous entry** to re-format or reference
7. **Export history** for external analysis

### Advanced Usage

#### Search History

```typescript
// Open search dialog with Cmd+K / Ctrl+K
// Or programmatically:
const { results, meta } = useSearch({
    endpoint: '/history/search',
    defaultScope: 'all',
    limit: 20,
});

// Set search query
setQuery('database timeout');

// Filter by scope
setScope('saved'); // 'all', 'recent', or 'saved'

// Results update automatically with debouncing (250ms)
```

#### Bulk Export

```typescript
// Export entire history
exportHistory();
// Downloads: structlogr-history-123-20251021_123456.json
```

#### Clear History

```typescript
// Clear all entries (with confirmation)
await clearHistory();
```

#### Load and Modify

```typescript
// Load entry 123
const detail = await loadEntry(123);

// Modify raw log
const modifiedLog = detail.rawLog + "\nadditional context";

// Re-format
await formatLog(modifiedLog);
```

---

## Security Considerations

### Authorization

- All endpoints verify `user_id` matches authenticated user
- Route model binding with automatic 404 on unauthorized access
- Soft deletes prevent permanent data loss

### CSRF Protection

- All mutation requests include CSRF token
- Laravel middleware validates tokens
- Frontend hook automatically includes token

### Data Privacy

- Users can only access their own history
- Cascade delete removes history when user is deleted
- Export is user-initiated only (no automatic sharing)

---

## Performance Optimization

### Query Optimization

- Composite index on `(user_id, created_at)`
- Default limit of 50 entries
- Lazy loading for entry details

### Frontend Optimization

- Server-side rendering for initial load
- Client-side caching of loaded entries
- Virtualized scrolling for large lists

### Database Optimization

- JSON column for flexible schema
- Indexed foreign keys
- Soft deletes for data recovery

---

## Future Enhancements

### Planned Features

1. **Full-text search** across history
2. **Filtering** by log type, date range
3. **Pagination** for large histories
4. **Sharing** entries with team members
5. **Tags and categories** for organization
6. **History statistics** dashboard
7. **Automatic cleanup** of old entries

---

## Troubleshooting

### Common Issues

**History not loading**:
- Verify user is authenticated
- Check network tab for API errors
- Ensure CSRF token is present

**Entries not saving**:
- Check user_id is set in LogFormatterController
- Verify database connection
- Check for validation errors

**Export failing**:
- Ensure user has history entries
- Check server disk space
- Verify permissions on storage directory

---

## API Reference

### TypeScript Interfaces

```typescript
interface HistoryEntry {
    id: number;
    summary: string;
    preview: string;
    createdAt: string;
    detectedLogType: string;
    fieldCount: number;
    isSaved: boolean;
}

interface HistoryDetail {
    id: number;
    rawLog: string;
    formattedLog: Record<string, unknown>;
}

interface HistoryRoutes {
    index: string;
    detail: string;
    toggle: string;
    clear: string;
    export: string;
}
```

---

## Conclusion

The History Management system provides a robust, user-friendly way to track and manage formatted logs. With comprehensive backend authorization, efficient frontend state management, and rich UI components, users can easily browse, save, and export their log formatting history.

For more information, see:
- [Architecture Overview](./architecture-overview.md)
- [UI/UX Improvements](./UI_UX_Improvements.md)
- [CHANGELOG](./CHANGELOG.md)
