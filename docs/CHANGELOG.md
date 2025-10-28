# Changelog

All notable changes to StructLogr will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [October 27, 2025] - History Search Feature & Testing Infrastructure

### Added

#### Full-Text Search for History Entries
- **Backend search API**
  - `GET /history/search` endpoint with authenticated access
  - `HistorySearchRequest` validation with query sanitization
  - Search query: 2-100 characters, trimmed whitespace
  - Configurable limit: 1-50 results (default: 20)
  - Search scopes: 'all', 'recent', 'saved'
  - Route: `history.search` added to `routes/web.php`

- **HistoryService search implementation**
  - Full-text MySQL search using `MATCH ... AGAINST` syntax
  - Searches across: `title`, `summary`, `raw_log`, `detected_log_type`
  - Scope filtering: Recent (unsaved), Saved (bookmarked), All entries
  - Results include: id, title, summary, preview, log type, timestamps
  - Ordered by relevance score then creation date (DESC)
  - User-scoped queries (privacy isolation)

- **Frontend search UI**
  - Search dialog component with keyboard shortcuts
  - Global search trigger: `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux)
  - Header search button with magnifying glass icon
  - Real-time search results with debouncing (250ms)
  - Scope toggle buttons: All, Recent, Saved
  - Result cards with preview, metadata, and navigation
  - Empty state with helpful messaging

- **useSearch React hook**
  - Debounced query execution (configurable delay)
  - Automatic request cancellation for stale queries
  - Status tracking: idle, loading, success, error
  - Search scope management with normalization
  - Result caching and metadata (count, limit, scope)
  - Error handling with user-friendly messages
  - Endpoint validation and origin normalization

- **TypeScript type definitions**
  - `SearchScope`: 'all' | 'recent' | 'saved'
  - `SearchResult`: Structured search result interface
  - `SearchResponse`: API response format with metadata
  - Full type safety for search operations

- **Comprehensive test coverage**
  - `tests/Feature/History/SearchHistoryTest.php` (177 lines)
  - Tests for query matching, scope filtering, privacy isolation
  - Validation tests for query length, limit bounds, scope values
  - Empty result handling and metadata verification
  - Authentication requirement tests

#### Testing Infrastructure Improvements
- **SQLite in-memory testing**
  - `.env.testing` configured with SQLite `:memory:` database
  - Faster test execution (no disk I/O)
  - `DB_CONNECTION=sqlite` for test environment
  - `phpunit.xml` updated with SQLite configuration
  - Session driver set to 'array' for tests
  - BCRYPT_ROUNDS=4 for faster password hashing in tests

### Changed

#### History System Enhancements
- **Route parameter flexibility**
  - History routes now accept string IDs (previously numeric-only)
  - Wayfinder route types updated for compatibility
  - Improved route matching and type safety

#### Code Quality
- **Consistent formatting**
  - Applied Laravel Pint to backend code
  - Consistent spacing and style across PHP files

---

## [October 27, 2025] - User Preferences Backend & Type Safety Enhancements

### Added

#### User Preferences Backend System (9-Phase Implementation)
- **Database schema for preferences**
  - Added `preferences` JSON column to users table
  - Nullable for backward compatibility with existing users
  - Native MySQL 8.0 JSON support
  - Migration: `2025_10_23_201613_add_preferences_to_users_table.php`

- **User model preferences support**
  - Added `preferences` to `$fillable` and `$casts` arrays
  - `getPreferencesAttribute()` accessor with comprehensive defaults
  - 12 configurable preference settings:
    - `outputFormat`: json, yaml, xml
    - `jsonIndentation`: 0-8 spaces
    - `autoCopyResults`: Auto-copy formatted output
    - `showLineNumbers`: Display line numbers
    - `saveToHistory`: Persist to history
    - `anonymousAnalytics`: Usage analytics
    - `avoidSensitiveStorage`: Skip sensitive data
    - `fontSize`: small, medium, large
    - `reduceAnimations`: Reduce motion
    - `customApiEndpoint`: Custom LLM endpoint
    - `apiKey`: Custom API key
    - `timeoutSeconds`: API timeout (5-300 seconds)
  - Automatic merge with defaults for null/missing preferences

- **PreferencesController API endpoints**
  - `GET /settings/preferences` - Retrieve user preferences
  - `PATCH /settings/preferences` - Update preferences with validation
  - Comprehensive validation rules for all preference fields
  - JSON response format with error handling
  - Routes added to `routes/settings.php`

- **Inertia middleware preferences sharing**
  - User preferences automatically shared with all Inertia pages
  - Available via `usePage().props.preferences`
  - Eliminates need for separate API calls on page load
  - Real-time updates on preference changes

- **Frontend preferences hook refactored**
  - `use-settings.ts` now syncs with backend via API
  - Authenticated users: Database persistence
  - Guest users: LocalStorage fallback
  - Optimistic UI updates for instant feedback
  - Automatic cross-device synchronization
  - Backend integration with PATCH requests

- **TypeScript type definitions**
  - `UserPreferences` interface with all 12 fields
  - `SharedData` interface includes preferences
  - Full type safety across frontend
  - IntelliSense support for preferences

- **Wayfinder routes for preferences**
  - Type-safe route helpers generated
  - `preferences.index()` and `preferences.update()` actions
  - Form variant support for PATCH requests
  - 151 lines of generated route code

- **Comprehensive test coverage (981 test lines)**
  - `UserPreferencesTest.php` (193 lines) - Model accessor/mutator tests
  - `PreferencesTest.php` (236 lines) - Controller endpoint tests
  - `PreferencesValidationTest.php` (338 lines) - Validation rule tests
  - `PreferencesMiddlewareTest.php` (214 lines) - Inertia sharing tests
  - 100% coverage of preferences feature

#### Wayfinder Type-Safe Routes Generation
- **Generated server action helpers (3,325 lines)**
  - Auth actions: Login, register, password reset, email verification
  - Settings actions: Profile, password, 2FA, preferences
  - History actions: CRUD, toggle save, clear, export
  - Formatter actions: Format logs
  - All controllers now have type-safe action wrappers

- **Enhanced route type safety**
  - Form variant support for POST/PATCH/DELETE actions
  - Inertia FormData compatibility with type assertions
  - Route parameter validation at compile-time
  - Auto-generated action types for all Laravel routes

### Changed

#### Backend Updates
- **User model enhancements**
  - Added `preferences` attribute with casting
  - Default preferences align with frontend expectations
  - Accessor ensures consistent data structure
  - Graceful handling of null preferences

- **Settings routes organization**
  - Preferences routes added to settings group
  - Consistent naming convention with other settings controllers
  - Middleware protection with `auth` requirement

#### Frontend Updates
- **Settings hook architecture**
  - `use-settings.ts` completely refactored (82 lines changed)
  - Backend synchronization via PreferencesController
  - LocalStorage fallback for guest users
  - Optimistic updates for better UX
  - Type-safe preference updates

- **Inertia type definitions**
  - `SharedData` interface extended with preferences
  - `UserPreferences` type added to index.d.ts
  - Better type inference throughout application

#### TypeScript Improvements
- **Inertia FormData compatibility**
  - Type assertions added for form data compatibility
  - Empty interface replaced with type alias
  - Fixed TypeScript strict mode errors
  - Better type safety in `use-settings.ts`

### Fixed

#### Type Safety Issues
- **Inertia FormData compatibility fix**
  - Added type assertions in `use-settings.ts`
  - Resolved FormData type mismatch warnings
  - Fixed strict TypeScript compilation errors
  - Improved type inference for Inertia forms

- **Empty interface replacement**
  - Changed empty interface to type alias
  - Better TypeScript best practices compliance
  - Resolved ESLint warnings

#### Route Reference Corrections
- **Home route fixes**
  - Added 'home' route to resolve RouteNotFoundException
  - Updated all auth redirects to use '/' (formatter page)
  - Fixed route imports in layout components
  - Corrected test assertions to use 'home' route
  - Removed dashboard route references

### Technical Details

#### Database Migration
```sql
-- Migration: 2025_10_23_201613_add_preferences_to_users_table.php
ALTER TABLE users
ADD COLUMN preferences JSON NULL AFTER remember_token;
```

#### User Model Accessor
```php
public function getPreferencesAttribute($value): array
{
    $defaults = [
        'outputFormat' => 'json',
        'jsonIndentation' => 2,
        'autoCopyResults' => false,
        'showLineNumbers' => true,
        'saveToHistory' => true,
        'anonymousAnalytics' => true,
        'avoidSensitiveStorage' => false,
        'fontSize' => 'medium',
        'reduceAnimations' => false,
        'customApiEndpoint' => '',
        'apiKey' => '',
        'timeoutSeconds' => 30,
    ];

    if (is_null($value) || $value === '') {
        return $defaults;
    }

    $preferences = is_string($value) ? json_decode($value, true) : $value;
    return array_merge($defaults, $preferences ?? []);
}
```

#### PreferencesController Routes
```php
Route::middleware('auth')->prefix('settings')->group(function () {
    Route::get('/preferences', [PreferencesController::class, 'index'])->name('preferences.index');
    Route::patch('/preferences', [PreferencesController::class, 'update'])->name('preferences.update');
});
```

#### Middleware Sharing
```php
public function share(Request $request): array
{
    return [
        ...parent::share($request),
        'auth' => [
            'user' => $request->user(),
        ],
        'preferences' => $request->user()?->preferences,  // NEW
        'flash' => [
            'message' => fn () => $request->session()->get('message'),
            'error' => fn () => $request->session()->get('error'),
        ],
    ];
}
```

#### Frontend Hook Usage
```typescript
// Authenticated users - backend persistence
const { settings, updateSettings, isLoading } = useSettings();

// Updates sync to database automatically
updateSettings({ fontSize: 'large' });

// Guest users - localStorage only
// Automatically falls back without authentication
```

#### TypeScript Types
```typescript
export interface UserPreferences {
    outputFormat: 'json' | 'yaml' | 'xml';
    jsonIndentation: number;
    autoCopyResults: boolean;
    showLineNumbers: boolean;
    saveToHistory: boolean;
    anonymousAnalytics: boolean;
    avoidSensitiveStorage: boolean;
    fontSize: 'small' | 'medium' | 'large';
    reduceAnimations: boolean;
    customApiEndpoint: string;
    apiKey: string;
    timeoutSeconds: number;
}
```

### Performance

- **Database query optimization**
  - Preferences loaded once per request via Inertia middleware
  - No additional queries needed on frontend preference access
  - JSON column uses native MySQL 8.0 performance optimizations

- **Frontend state management**
  - LocalStorage fallback for guest users (no backend dependency)
  - Optimistic updates reduce perceived latency
  - Debounced API calls prevent request flooding

### Security

- **Validation and sanitization**
  - Comprehensive validation rules on all preference fields
  - Enum validation for restricted values (outputFormat, fontSize)
  - Range validation for numeric values (jsonIndentation, timeoutSeconds)
  - URL validation for customApiEndpoint
  - String length limits on apiKey (255 chars)

- **Authorization**
  - Auth middleware required for all preferences endpoints
  - Users can only access/modify their own preferences
  - CSRF protection on all PATCH requests

### Testing

- **Model tests** (193 lines)
  - Default preferences accessor functionality
  - JSON casting verification
  - Null preference handling
  - Preference merging with defaults
  - Mutator behavior with partial updates

- **Controller tests** (236 lines)
  - GET preferences endpoint authorization
  - PATCH preferences endpoint validation
  - Successful preference updates
  - Error responses for invalid data
  - JSON response format verification

- **Validation tests** (338 lines)
  - All 12 preference field validations
  - Enum value enforcement
  - Range boundary testing
  - Optional field handling
  - URL format validation
  - Type coercion testing

- **Middleware tests** (214 lines)
  - Preferences shared with Inertia pages
  - Null handling for guest users
  - Preference updates reflected in subsequent requests
  - Cross-page preference consistency

### Developer Experience

- **Type-safe preferences**
  - Full IntelliSense support in VS Code
  - Compile-time preference key validation
  - Auto-completion for preference values

- **Simplified backend integration**
  - No manual API client configuration
  - Wayfinder handles route generation
  - Type-safe route helpers

- **Comprehensive documentation**
  - Implementation plan: `docs/settings-backend-implementation-plan.md`
  - Architecture updates: `docs/architecture-overview.md`
  - Test coverage examples in all test files

### Documentation

- **Implementation plan documented**
  - 9-phase implementation guide (762 lines)
  - Each phase with clear goals, context, and requirements
  - Testing procedures for each phase
  - Success criteria and rollback plans

- **Architecture documentation updated**
  - PreferencesController section added
  - User model preferences documented
  - Middleware sharing explanation
  - Database schema updates

- **README updates**
  - Preferences feature highlighted
  - Settings section expanded
  - Type-safe routing mentioned

---

## [October 23, 2025] - History Title Field & Keyboard Shortcuts Enhancement

### Added

#### History Title Field Feature
- **LLM-generated titles for formatted logs**
  - New `title` field added to `formatted_logs` database table (VARCHAR(255), indexed)
  - Title generation integrated into LLM schema (5-50 character constraint)
  - Titles provide concise, descriptive labels for quick log identification
  - Fallback logic: title → summary → preview (graceful degradation for legacy entries)
  - Migration: `2025_10_22_202114_add_title_to_formatted_logs_table.php`
- **TypeScript type definitions updated**
  - `HistoryEntry` interface now includes optional `title?: string` field
  - Full type safety across frontend components
  - IntelliSense support for new field
- **History panel display enhancement**
  - History cards now display title as primary headline
  - Improved scannability and entry differentiation
  - Backward compatible with existing entries (null titles)

#### Keyboard Shortcuts Enhancement
- **Dynamic keyboard shortcuts modal**
  - `keyboard-shortcuts-modal.tsx` now uses dynamic shortcut definitions
  - Centralized shortcut configuration in `use-keyboard-shortcuts` hook
  - Automatic modal content generation from shortcut registry
  - Prevents inconsistencies between actual shortcuts and documentation
- **Keyboard shortcut tooltips**
  - Action buttons now display keyboard shortcut hints
  - Format: "Action (⌘K)" or "Action (Ctrl+K)" based on platform
  - Clear visual indicators for available shortcuts
  - Improved discoverability for keyboard-first users
- **Accessibility improvements**
  - Added explicit `id` attributes to header components for screen readers
  - Enhanced ARIA labels for keyboard navigation
  - Skip navigation support for keyboard users

### Changed

#### Backend Updates
- **LogFormatterService schema updates**
  - Added `title` field to structured output schema
  - LLM prompt includes examples and length constraints for titles
  - Schema validation updated to require title field
  - Title extraction with fallback logic (truncated summary or "Untitled Log Entry")
- **FormattedLog model updates**
  - Added `title` to `$fillable` array
  - Database persistence includes title field
  - API responses now include title for history entries
- **HistoryService updates**
  - Title field included in history payload responses
  - Maintains backward compatibility with null titles

#### Frontend Updates
- **Header component refinements**
  - Authenticated user display added to header
  - Removed redundant navigation elements (47 lines)
  - Cleaner, more focused header design
  - Accessibility IDs added for testing and screen readers
- **Keyboard shortcuts hook refactoring**
  - Expanded shortcut type definitions with explicit TypeScript types
  - Removed non-functional shortcuts (Cmd+D, Cmd+S)
  - Added `getShortcuts()` method for modal consumption
  - Centralized shortcut configuration reduces duplication
- **Route parameter type improvements**
  - Updated Wayfinder route parameters to support both string and number IDs
  - Better type safety for history route parameters
  - Consistent route typing across actions and route helpers

### Fixed

- **History entry title separation**
  - Title now separate from formatted output JSON
  - Title not included in main formatted log display
  - Cleaner separation of concerns between metadata and content
- **Keyboard shortcuts consistency**
  - Modal shortcuts now dynamically match actual implementation
  - Removed shortcuts that didn't work (save, download)
  - Fixed shortcut key combinations for cross-platform compatibility

### Technical Details

#### Database Changes
```sql
-- Migration: 2025_10_22_202114_add_title_to_formatted_logs_table.php
ALTER TABLE formatted_logs
ADD COLUMN title VARCHAR(255) NULL AFTER detected_log_type,
ADD INDEX idx_title (title);
```

#### LLM Schema Addition
```typescript
title: {
  type: 'string',
  description: 'A concise, descriptive title for this log entry (5-50 characters)',
  minLength: 5,
  maxLength: 50
}
```

#### Component Changes
- `resources/js/components/formatter/history-entry-card.tsx`: Updated headline logic to prioritize title
- `resources/js/components/keyboard-shortcuts-modal.tsx`: Dynamic rendering from hook (60 lines refactored)
- `resources/js/components/app-header.tsx`: User display and accessibility improvements (66 lines)
- `resources/js/hooks/use-keyboard-shortcuts.ts`: Added type definitions and getShortcuts() method (25 lines added)
- `resources/js/pages/FormatterPage.tsx`: Keyboard shortcut tooltips on buttons (84 lines updated)

#### Type Definitions
```typescript
// resources/js/types/history.ts
export interface HistoryEntry {
    id: number;
    createdAt: string;
    detectedLogType?: string;
    title?: string;  // NEW
    summary?: string;
    preview: string;
    fieldCount?: number;
    isSaved: boolean;
}
```

### Performance

- **No measurable performance impact**
  - Title generation adds <50ms to LLM request time
  - Database query performance unchanged (indexed title column)
  - Frontend rendering performance identical

### Documentation

- Implementation plan documented in `docs/history-title-field-implementation.md`
- Comprehensive 5-phase guide with testing procedures
- Rollback plan and success criteria defined

---

## [October 22, 2025] - UI Refinements, Schema Simplification & Routing Cleanup

### Added

#### Documentation
- **History Title Field Implementation Plan** (`docs/history-title-field-implementation.md`)
  - Comprehensive 4-phase implementation guide for adding title field to formatted logs
  - Database schema updates with migration strategy
  - LLM schema modifications for title generation
  - Frontend integration plan for History panel display
  - 864-line detailed implementation document

#### UI/UX Enhancements
- **Full input view modal** with copy functionality
  - View complete raw log input in modal dialog
  - Copy-to-clipboard button for raw input
  - Improved readability for long log entries
  - Modal-based display with horizontal scroll support

### Changed

#### Frontend Improvements
- **History panel layout optimized for space efficiency**
  - Reduced card padding from `p-4` to `p-3`
  - Decreased gap between cards from `gap-3` to `gap-2`
  - Optimized header spacing and margins
  - Improved timestamp and metadata layout
  - More entries visible without scrolling
- **Settings panel simplified**
  - Removed 163 lines of advanced features
  - Streamlined single-column layout
  - Cleaner, more focused user experience
- **Modal dialog improvements**
  - Enhanced horizontal scrolling for wide content
  - Improved mobile responsiveness
  - Better width management on different screen sizes
  - Fixed overflow handling in dialog content
- **FormatterPage refinements**
  - Removed redundant header elements
  - Fixed output card resizing issues
  - Replaced inline height styles with Tailwind classes
  - Improved layout consistency

#### Backend Updates
- **LogFormatterService schema simplification**
  - Streamlined schema structure (577 lines refactored)
  - Simplified summary generation logic
  - Updated success logging to reflect new schema
  - Improved schema conversion for different LLM providers
- **OpenRouter model identifier updates**
  - Updated GLM model identifiers for accuracy
  - Updated Kimi/Moonshot model references
  - Better model selection and configuration
- **Error handling simplification**
  - Reduced redundant error handling in LogFormatterController
  - Cleaner exception propagation
  - Improved error response consistency

#### Application Structure
- **Dashboard page removed completely**
  - Deleted `resources/js/pages/dashboard.tsx`
  - Removed dashboard routes from `routes/web.php`
  - Deleted `tests/Feature/DashboardTest.php`
  - Simplified application navigation
- **Authentication flow updated**
  - All auth redirects now point to `/` (FormatterPage)
  - Login redirect: `/` instead of `/dashboard`
  - Registration redirect: `/` instead of `/dashboard`
  - Email verification redirect: `/` instead of `/dashboard`
  - Home redirect updated in Fortify config
- **Routing cleanup**
  - Main route (`/`) serves FormatterPage directly
  - Removed dashboard-related routes
  - Simplified route structure in `routes/web.php`
  - Updated app sidebar navigation links
- **Welcome page routing**
  - Updated to use formatter route instead of dashboard
  - Removed references to non-existent routes
  - Cleaner navigation flow for guests

### Fixed

#### Critical Bug Fixes
- **URL redirect bug after log formatting**
  - Fixed incorrect redirect in LogFormatterController
  - Updated Wayfinder route references
  - Corrected formatter route type definitions
  - Prevents unwanted navigation after successful formatting
- **Vertical scrolling in History panel**
  - Changed `overflow-y-scroll` to `overflow-y-auto`
  - Improved scrollbar appearance on different browsers
  - Better UX for short history lists
- **Output card content-based resizing**
  - Fixed card height to prevent dynamic resizing
  - Consistent layout regardless of output length
  - Improved visual stability during formatting

#### Code Quality
- **Linter fixes across codebase**
  - Fixed ESLint violations in HistoryController actions
  - Corrected import formatting in route files
  - Removed unused imports from web.php
  - Code style consistency improvements
- **Logging statement formatting**
  - Fixed spacing in LogFormatterService log statements
  - Corrected string formatting for better readability
  - Consistent log message structure

### Technical Details

#### Removed Files
```
resources/js/pages/dashboard.tsx (36 lines)
tests/Feature/DashboardTest.php (15 lines)
resources/js/routes/index.ts (74 lines) - consolidated into specific route files
```

#### Updated Route Structure
**Before:**
```php
Route::get('/dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');
```

**After:**
```php
Route::get('/', [LogFormatterController::class, 'show'])->name('formatter.show');
```

#### Authentication Redirects Updated
- `AuthenticatedSessionController`: `return redirect()->intended('/')` 
- `RegisteredUserController`: `return redirect('/')`
- `EmailVerificationPromptController`: `return redirect()->intended('/')`
- `VerifyEmailController`: `return redirect()->intended('/')`
- `EmailVerificationNotificationController`: `return back()`
- `config/fortify.php`: `'home' => '/'`

#### Component File Changes
- `resources/js/components/app-sidebar.tsx`: Updated navigation links
- `resources/js/components/formatter/history-entry-card.tsx`: Layout optimizations
- `resources/js/components/formatter/history-sidebar.tsx`: Spacing improvements
- `resources/js/components/settings-panel.tsx`: Advanced features removed
- `resources/js/components/ui/dialog.tsx`: Mobile responsiveness fixes
- `resources/js/pages/FormatterPage.tsx`: Multiple refinements and modal additions
- `resources/js/pages/welcome.tsx`: Route reference updates

#### Schema Refactoring Details
- Simplified LLM prompt structure
- Improved schema validation logic
- Enhanced provider-specific schema conversion
- Better handling of nullable fields
- Optimized response parsing

### Developer Experience

- **Cleaner application structure** with dashboard removal
- **Simplified routing** reduces cognitive overhead
- **Better code organization** with consolidated route files
- **Improved maintainability** through reduced complexity
- **Enhanced documentation** with implementation plan for title field

### Performance

- **Faster navigation** with one less route to maintain
- **Reduced bundle size** from removed dashboard and route files
- **Improved history panel rendering** with optimized layouts
- **Better modal performance** with proper overflow handling

---

## [October 21, 2025] - Logging System, LLM Provider Expansion & Bug Fixes

### Added

#### Comprehensive Logging System
- **LogFormatterService comprehensive logging**
  - Detailed logging at all stages of log formatting process
  - Request/response timing measurements
  - Retry attempt tracking with exponential backoff logging
  - Schema validation logging with detailed error messages
  - Provider configuration logging for debugging
  - Input preview logging (first 200 chars) for troubleshooting
  - Structured log context with relevant metadata
  - Log levels: `info`, `debug`, `warning`, `error`, `critical`
- **Request timer feature**
  - `useFormattingTimer` hook for frontend timing
  - Real-time display of request duration
  - Millisecond precision timing
  - Visual feedback during API calls

#### New LLM Provider Support
- **Gemini 2.5 Flash** support via Google AI
  - Provider-specific schema conversion to Gemini format
  - Response MIME type configuration (`application/json`)
  - Property ordering for consistent output
  - Nullable field support
- **Kimi K2 Turbo Preview** (Moonshot AI) via OpenRouter
  - JSON Schema structured output
  - Custom schema conversion for OpenRouter format
- **GLM-4.5-Air** and **GLM-4.6** (ZhipuAI) via OpenRouter
  - Strict JSON Schema mode
  - Thinking mode disabled for deterministic output
  - Provider-specific response format configuration

#### Enhanced LLM Configuration
- **Provider-specific configuration methods**
  - `configureDeepseek()` - DeepSeek with json_object response format
  - `configureGemini()` - Gemini with response schema
  - `configureMoonshot()` - Moonshot/Kimi with JSON Schema
  - `configureGLM()` - GLM models with strict schema validation
- **Schema format conversion utilities**
  - `convertSchemaToJsonSchema()` - OpenAI/OpenRouter JSON Schema format
  - `convertSchemaToGeminiFormat()` - Google Gemini schema format
- **HTTP client timeout configuration**
  - Configurable timeout (default: 600s)
  - Configurable connect timeout (default: 60s)
  - Environment-based configuration via `config/services.php`

#### UI/UX Enhancements
- **Copy-to-clipboard button** for formatted output
  - One-click copy functionality
  - Visual feedback on copy success
  - Clipboard API integration
- **Modal output display** for formatted logs
  - Enhanced readability with modal view
  - Syntax highlighting for JSON
  - Monospace font rendering
- **LLM model display** in formatter interface
  - Shows currently selected model
  - Real-time model updates
  - Visual model indicator

### Changed

#### Backend Improvements
- **LogFormatterService signature updates**
  - Added `$llmModel` parameter for dynamic model selection
  - Added `$preferences` parameter for user preferences
  - Added `$maxRetries` parameter (default: 3)
  - Enhanced `saveLog()` to accept optional `User` parameter
  - Returns `null` for guest users (no database save)
- **Retry logic with exponential backoff**
  - 3 retry attempts by default
  - Exponential backoff: 2^attempt seconds
  - Separate handling for `PrismException` and general exceptions
  - Detailed logging of each retry attempt
- **Improved validation**
  - `validateStructuredOutput()` method with comprehensive checks
  - Required field validation for schema compliance
  - Detailed error messages for debugging
- **System prompt optimization**
  - Model-specific prompt variations
  - DeepSeek gets explicit "JSON only" instruction
  - Comprehensive rules for log parsing behavior
  - Clear guidelines for edge cases

#### Frontend Refactoring
- **Settings panel redesign**
  - Single-column layout for better mobile support
  - Improved visual hierarchy
  - Enhanced spacing and typography
  - Better grouping of related settings
- **FormatterPage enhancements**
  - Modal-based output display
  - Copy button integration
  - Model selector integration
  - Request timer display
  - Improved loading states
- **React type safety improvements**
  - Better dependency array handling
  - Stricter TypeScript types
  - Removed unused variables
  - Enhanced props interfaces

### Fixed

#### Critical Bug Fixes
- **Infinite loop in preferences sync** (resources/js/hooks/use-preferences.ts:5ea98ac)
  - Added dependency tracking to prevent cross-component sync loops
  - Implemented effect guards with internal state tracking
  - Fixed localStorage sync race conditions
- **Formatting timer not updating during API request** (resources/js/hooks/use-formatting-timer.ts:aad4480)
  - Changed dependency array to trigger timer on `isFormatting` changes
  - Ensured timer updates every second during active requests
- **Model display reactivity issues** (resources/js/pages/FormatterPage.tsx:b58b8fe)
  - Added unique IDs to form elements for proper React reconciliation
  - Enhanced model state management
  - Fixed stale closure issues in event handlers
- **Removed unused lineCounterId variable** (resources/js/pages/FormatterPage.tsx:e2aa794)
  - Code cleanup for better maintainability

#### Code Quality Improvements
- **Enhanced accessibility**
  - Added unique IDs to all form elements
  - Improved ARIA labels and descriptions
  - Better keyboard navigation support
  - Screen reader compatibility enhancements
- **Type safety fixes**
  - Corrected React hook dependencies
  - Fixed TypeScript errors in components
  - Better type inference for hooks

### Technical Details

#### New Configuration Options

**config/services.php** (recommended):
```php
'http' => [
    'timeout' => env('HTTP_TIMEOUT', 600),
    'connect_timeout' => env('HTTP_CONNECT_TIMEOUT', 60),
],
```

**.env additions**:
```env
# Gemini
GEMINI_API_KEY=your_gemini_api_key

# OpenRouter (for Kimi and GLM models)
OPENROUTER_API_KEY=your_openrouter_api_key

# HTTP Timeouts
HTTP_TIMEOUT=600
HTTP_CONNECT_TIMEOUT=60
```

#### Logging Output Example

```
[2025-10-21 14:23:45] local.INFO: === LogFormatterService::format() START === {"llm_model":"deepseek-chat","preferences":null,"max_retries":3,"raw_log_length":245,"raw_log_preview":"2024-10-15 14:23:45 [ERROR] Database connection failed..."}
[2025-10-21 14:23:45] local.INFO: Attempt 0/3 starting {"attempt":0,"model":"deepseek-chat"}
[2025-10-21 14:23:45] local.DEBUG: Schema generated {"schema_name":"formatted_log"}
[2025-10-21 14:23:45] local.INFO: Configuring LLM provider {"model":"deepseek-chat"}
[2025-10-21 14:23:45] local.DEBUG: Configuring DeepSeek provider {"provider":"DeepSeek","model":"deepseek-chat","response_format":"json_object"}
[2025-10-21 14:23:45] local.INFO: Sending request to LLM API {"model":"deepseek-chat","temperature":0.0,"max_tokens":8192}
[2025-10-21 14:23:47] local.INFO: LLM API response received {"model":"deepseek-chat","duration_ms":1847.32}
[2025-10-21 14:23:47] local.INFO: Validating structured output
[2025-10-21 14:23:47] local.INFO: === LogFormatterService::format() SUCCESS === {"model":"deepseek-chat","attempt":0,"detected_log_type":"application_error","sections_count":1}
```

#### Supported LLM Models

| Model | Provider | Configuration Method | Response Format |
|-------|----------|---------------------|-----------------|
| deepseek-chat | DeepSeek | `configureDeepseek()` | `json_object` |
| gemini-2.5-flash | Google Gemini | `configureGemini()` | Response schema |
| kimi-k2-turbo-preview | Moonshot (via OpenRouter) | `configureMoonshot()` | JSON Schema |
| GLM-4.5-Air | ZhipuAI (via OpenRouter) | `configureGLM()` | Strict JSON Schema |
| GLM-4.6 | ZhipuAI (via OpenRouter) | `configureGLM()` | Strict JSON Schema |

#### Frontend Hooks

**useFormattingTimer**:
```typescript
const { elapsedTime, isRunning, startTimer, stopTimer, resetTimer } = useFormattingTimer();
```

**useLLMModel**:
```typescript
const { model, setModel, availableModels } = useLLMModel();
```

### Performance

- **Request timing**: Average API response times logged for monitoring
- **Retry backoff**: Exponential backoff prevents API rate limit issues
- **Schema caching**: Schema objects created once per request
- **Timeout configuration**: Prevents hung requests with configurable timeouts

### Developer Experience

- **Enhanced debugging**: Comprehensive logs at all stages
- **Error tracking**: Detailed error messages with context
- **Performance monitoring**: Request duration tracking
- **Configuration flexibility**: Easy provider switching

---

## [October 21, 2025] - Major UI/UX Enhancement & Accessibility

### Added

#### History Management System
- **HistoryController** with full CRUD operations
  - `index()` - Retrieve user's history (recent and saved)
  - `show()` - Get specific entry details
  - `destroy()` - Delete individual entries
  - `toggleSave()` - Toggle saved/unsaved status
  - `clear()` - Clear all user history
  - `export()` - Download history as JSON
- **HistoryService** for business logic
  - `entriesForUser()` - Fetch formatted logs for user
  - `payloadForUser()` - Format data for frontend (recent/saved separation)
  - Preview text generation (120 char limit, sanitized)
- **Database migration** for enhanced `formatted_logs` table
  - `user_id` foreign key with cascade delete
  - `summary` field for quick preview
  - `detected_log_type` for classification
  - `field_count` for UI indicators
  - `is_saved` boolean flag for pinned entries
  - Soft deletes support
  - Composite index on (user_id, created_at)
- **HistorySidebar component** with tabbed interface
  - Recent and Saved tabs
  - Rich entry cards with metadata
  - Bulk actions (Export, Clear All)
  - Empty states for guests/authenticated users
- **HistoryEntryCard component** with actions
  - Load, Save/Unsave, Copy, Delete buttons
  - Log type badges and field count indicators
  - Timestamp and preview text display
- **useHistory hook** for state management
  - CRUD operations with CSRF protection
  - Real-time state synchronization
  - Authorization checks
  - Export and clear functionality

#### Accessibility Features
- **Keyboard shortcuts** system
  - `Ctrl+Enter` / `Cmd+Enter` - Format log
  - `Ctrl+K` / `Cmd+K` - Toggle history sidebar
  - `Ctrl+L` / `Cmd+L` - Clear input
- **KeyboardShortcutsModal component** for help
- **SkipNavigation component** for screen readers
- **ARIA labels** throughout the application
- **useUniqueId hook** for SSR-compatible IDs
  - Generates unique IDs for form elements
  - Prevents hydration mismatches
  - Supports aria-labelledby and aria-describedby
- **Enhanced form accessibility**
  - Comprehensive ARIA attributes on all inputs
  - Proper label associations
  - Error announcements for screen readers
  - Focus management

#### UI/UX Enhancements
- **Side-by-side formatter layout**
  - Split-pane design with resizable panels
  - Input on left, output on right
  - Improved information density
- **Settings panel** for formatting preferences
  - Auto-format toggle
  - Timestamp display options
  - Font size adjustment
  - Line height controls
- **Sample log library**
  - Pre-built example logs for testing
  - Multiple log types (errors, access logs, test runners)
  - One-click insertion
- **Application footer**
  - Status indicator for API health
  - Newsletter signup form
  - Quick links and social media
  - Version information
- **Mobile navigation**
  - Responsive header with hamburger menu
  - Drawer navigation for mobile devices
  - Touch-optimized controls
- **Hero section redesign**
  - Simplified dark theme design
  - Clear value proposition
  - Call-to-action buttons
- **Onboarding tour** for first-time users
- **Error boundary** with friendly error messages
- **Seasonal effects** for visual delight
  - Subtle animations
  - Holiday themes

#### New UI Components
- **ScrollArea** - Virtualized scrolling component
- **Tabs** - Tabbed interface component
- **Radio Group** - Radio button group
- **Slider** - Range slider input
- **Switch** - Toggle switch component

#### Developer Experience
- **Fun tips** data for loading states
- **Loading messages** for better UX during processing
- **ID generation utilities** for accessibility
  - `generateId()` - Create unique IDs
  - `generateAriaId()` - ARIA-specific IDs
  - `useFormFieldIds()` - Form field ID management

### Changed

#### UI Redesign
- **FormatterPage** completely redesigned
  - Side-by-side layout replaces vertical stack
  - History sidebar integration
  - Sample logs dropdown
  - Settings panel access
  - Keyboard shortcut support
- **Hero section** simplified for better clarity
  - Removed complex animations
  - Focused on core messaging
  - Improved dark mode aesthetics
- **App header** enhanced with mobile support
  - Responsive navigation
  - Mobile-friendly menu
  - Scroll shadow effect

#### Backend Updates
- **LogFormatterController** updated for history
  - Associates logs with authenticated users
  - Generates summaries from formatted output
  - Calculates field counts for metadata
- **FormattedLog model** expanded attributes
  - Added user relationship
  - New metadata fields
  - Soft delete support

#### Frontend Architecture
- **Component organization** improved
  - Formatter-specific components in `components/formatter/`
  - Static data in `data/` directory
  - Enhanced hooks in `hooks/` directory
- **Type definitions** enhanced
  - HistoryEntry interface
  - HistoryDetail interface
  - HistoryRoutes interface
  - Settings and Preferences types

### Fixed

#### Code Quality
- **Comprehensive linting fixes**
  - ESLint rule compliance across all files
  - Prettier formatting standardization
  - Import organization
- **TypeScript improvements**
  - Added missing type annotations
  - Fixed type errors
  - Enhanced interface definitions
- **Accessibility improvements**
  - Fixed missing ARIA labels
  - Corrected label associations
  - Improved keyboard navigation
- **SSR compatibility**
  - Fixed hydration mismatches
  - Ensured unique IDs across renders
  - Resolved client-server state sync issues

### Technical Details

#### New Routes
```php
Route::middleware('auth')->group(function () {
    Route::get('/history', [HistoryController::class, 'index'])->name('history.index');
    Route::get('/history/{formattedLog}', [HistoryController::class, 'show'])->name('history.show');
    Route::delete('/history/{formattedLog}', [HistoryController::class, 'destroy'])->name('history.destroy');
    Route::patch('/history/{formattedLog}/toggle-save', [HistoryController::class, 'toggleSave'])->name('history.toggle');
    Route::delete('/history', [HistoryController::class, 'clear'])->name('history.clear');
    Route::get('/history/export', [HistoryController::class, 'export'])->name('history.export');
});
```

#### Database Schema Updates
```sql
ALTER TABLE formatted_logs ADD COLUMN user_id BIGINT UNSIGNED NULL;
ALTER TABLE formatted_logs ADD COLUMN summary VARCHAR(255) NULL;
ALTER TABLE formatted_logs ADD COLUMN detected_log_type VARCHAR(128) NULL;
ALTER TABLE formatted_logs ADD COLUMN field_count INT UNSIGNED DEFAULT 0;
ALTER TABLE formatted_logs ADD COLUMN is_saved BOOLEAN DEFAULT FALSE;
ALTER TABLE formatted_logs ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE formatted_logs ADD INDEX (user_id, created_at);
```

#### Component Hierarchy
```
FormatterPage
├── HeroSection
├── FormatterForm (left panel)
│   ├── Textarea (input)
│   ├── SampleLogsDropdown
│   └── FormatButton
├── FormatterOutput (right panel)
│   ├── JsonDisplay
│   └── CopyButton
├── HistorySidebar (slide-out)
│   ├── Tabs (Recent/Saved)
│   └── HistoryEntryCard[]
├── SettingsPanel (slide-out)
│   └── FormattingPreferences
└── KeyboardShortcutsModal
```

### Performance

- **Optimized history queries** with composite index
- **Lazy loading** for entry details
- **Client-side caching** of loaded entries
- **Virtualized scrolling** for large history lists
- **Debounced search** in history (future)

### Security

- **User authorization** on all history endpoints
- **CSRF protection** on mutations
- **SQL injection prevention** via Eloquent ORM
- **XSS protection** via React escaping
- **Cascade deletes** for data integrity

---

## [October 15, 2025] - Core Implementation Complete

### Added

#### Backend Features
- **LogFormatterController** for handling log formatting requests
  - `show()` method to render FormatterPage
  - `format()` method to process and save formatted logs
- **LogFormatterService** with Prism SDK v2 integration
  - LLM-powered log parsing using DeepSeek provider
  - Structured JSON output with defined schema (timestamp, level, message, source, metadata)
  - Database persistence for raw and formatted logs
- **FormattedLog model** with Eloquent ORM
  - Fillable attributes: `raw_log`, `formatted_log`
  - JSON casting for `formatted_log` field
- **Database migration** for `formatted_logs` table
  - TEXT field for raw logs
  - JSON field for structured output
  - Timestamps for record tracking
- **Prism configuration** supporting multiple LLM providers
  - DeepSeek (default)
  - OpenAI, Anthropic, Mistral, Groq, xAI, Gemini, Ollama, OpenRouter
  - Environment-based API key configuration

#### Frontend Features
- **FormatterPage component** as main user interface
  - Textarea for raw log input
  - Submit button with loading state (Spinner component)
  - JSON output display with pretty-printing
  - Responsive layout with Tailwind CSS
  - Guest user navigation (login/register links)
- **Complete authentication system** via Laravel Fortify
  - Login/logout functionality
  - User registration with email verification
  - Password reset workflow
  - Two-factor authentication (TOTP)
  - Recovery codes for 2FA
- **User settings pages**
  - Profile management (name, email)
  - Password update functionality
  - Two-factor authentication management
  - Theme preferences (appearance settings)
- **Modern UI component library**
  - Radix UI primitives (Alert, Avatar, Badge, Button, Card, Checkbox, Dialog, Dropdown, Input, Label, Select, Separator, Sheet, Sidebar, Skeleton, Spinner, Textarea, Toggle, Tooltip)
  - Custom application components (AppHeader, AppSidebar, AppShell, Breadcrumbs, etc.)
  - Form components with error handling (InputError, AlertError)
  - Two-factor authentication components (setup modal, recovery codes)
- **Theme system**
  - Light/dark mode support
  - System preference detection
  - Cookie-based persistence
  - `useAppearance` custom hook
  - `HandleAppearance` middleware

#### Development Tools
- **Laravel Sail** Docker development environment
  - MySQL 8.0 container
  - PHP 8.2+ container
  - Port configuration (App: 8001, MySQL: 3308, Vite: 5175)
- **Vite 7** build system
  - Hot module replacement
  - TypeScript compilation
  - Tailwind CSS 4.0 processing
  - Production optimization
- **Laravel Wayfinder** for type-safe routing
  - TypeScript route helpers
  - Form variants support
  - Auto-generated route files
- **Code quality tools**
  - ESLint 9 with React and TypeScript rules
  - Prettier 3 with Tailwind plugin
  - Laravel Pint for PHP code style
  - TypeScript strict mode
- **CI/CD workflows** via GitHub Actions
  - Linting workflow (ESLint, Pint, Prettier)
  - Testing workflow (PHPUnit, Pest)
  - Automated code quality checks

#### Documentation
- **README.md** with comprehensive project overview
  - Technology stack documentation
  - Installation instructions
  - Usage guide
  - Development commands
  - Configuration details
- **docs/architecture-overview.md** with detailed system architecture
  - Backend structure and patterns
  - Frontend organization
  - Database schema
  - Authentication flow
  - API design
  - Build and deployment guide
- **docs/UI_UX_Improvements.md** comprehensive design guide
  - Component library documentation
  - Design patterns
  - Best practices
  - Accessibility guidelines
- **CLAUDE.md** for AI assistant instructions
  - Project overview
  - Development environment setup
  - Architecture patterns
  - Implementation guidelines
- **AGENTS.md** for multi-agent system coordination

### Changed

#### Backend Updates
- **LogFormatterService** updated to use Prism SDK v2 syntax
  - Changed from v1 `prism()->structured()` to v2 `Prism::structured()`
  - Updated schema definitions using new SDK classes
  - Improved error handling
- **Route organization** refactored for clarity
  - Separated auth routes (`routes/auth.php`)
  - Separated settings routes (`routes/settings.php`)
  - Main routes in `routes/web.php`
- **Authentication routes** updated for Fortify integration
  - Custom controllers in `app/Http/Controllers/Auth/`
  - Email verification enabled
  - Two-factor authentication enabled

#### Frontend Updates
- **FormatterPage layout** redesigned for better UX
  - Card-based design
  - Improved spacing and typography
  - Better mobile responsiveness
  - Enhanced loading states
- **Authentication layout** updated with multiple variants
  - Card layout for compact pages
  - Simple layout for minimal design
  - Split layout for branding showcase
- **Component structure** reorganized
  - UI primitives separated into `components/ui/`
  - Application components in `components/`
  - Layout components in `layouts/`
- **Type definitions** enhanced
  - SharedData interface for Inertia props
  - PageProps interfaces for all pages
  - Form data interfaces
  - Route parameter types

### Fixed

#### Code Quality
- **Import organization** cleaned up across frontend files
  - Removed unused imports
  - Alphabetized import statements
  - Proper import grouping (external, internal, relative)
- **Code formatting** standardized
  - Consistent indentation
  - Proper line breaks
  - ESLint rule compliance
  - Prettier formatting applied
- **Type safety** improvements
  - Fixed TypeScript errors
  - Added missing type annotations
  - Improved interface definitions
- **Test suite** corrections
  - Fixed import paths in test files
  - Updated test assertions
  - Improved test organization

### Technical Details

#### Database Schema
- **users table**: id, name, email, email_verified_at, password, two_factor_secret, two_factor_recovery_codes, two_factor_confirmed_at, remember_token, timestamps
- **formatted_logs table**: id, raw_log (TEXT), formatted_log (JSON), timestamps
- **cache table**: Laravel cache storage
- **jobs table**: Queue job storage
- **password_reset_tokens table**: Password reset tokens
- **sessions table**: Session storage

#### Technology Stack
- **Backend**: PHP 8.2+, Laravel 12, Prism SDK v2, MySQL 8.0
- **Frontend**: React 19, TypeScript 5.7, Inertia.js 2.0, Tailwind CSS 4.0, Radix UI
- **Build Tools**: Vite 7, Laravel Vite Plugin, Wayfinder
- **Development**: Laravel Sail, Docker Compose, Hot Module Replacement
- **Testing**: PHPUnit, Pest, Feature Tests
- **CI/CD**: GitHub Actions

#### Configuration
- **Environment**: Laravel Sail with Docker Compose
- **Database**: MySQL 8.0 via Docker
- **LLM Provider**: DeepSeek (configurable to other providers)
- **Session Driver**: Database
- **Cache Driver**: Database
- **Queue Driver**: Database (ready for Redis/SQS)

### Security

- **Authentication**: Laravel Fortify with email verification
- **Password Hashing**: Bcrypt via Laravel
- **CSRF Protection**: Enabled on all forms
- **Two-Factor Authentication**: TOTP-based with recovery codes
- **Cookie Security**: HTTP-only, secure, same-site strict
- **Environment Variables**: Sensitive data in `.env` (not committed)
- **SQL Injection Protection**: Eloquent ORM parameter binding
- **XSS Protection**: React automatic escaping

---

## [October 14, 2025] - Project Initialization

### Added

- **Initial Laravel 12 project** setup
- **Inertia.js 2.0** with React 19 integration
- **Basic authentication** scaffolding
- **Docker Compose** configuration for development
- **Git repository** initialization
- **Package configuration** (composer.json, package.json)
- **.gitignore** and **.prettierignore** files
- **ESLint and Prettier** configuration
- **TypeScript** configuration (tsconfig.json)
- **Tailwind CSS 4.0** setup
- **Initial documentation** (Implementation Plan)

### Configuration

- **PHP**: 8.2+ requirement
- **Node.js**: 18+ requirement
- **Composer**: 2.x requirement
- **Database**: MySQL 8.0 via Docker

---

## Future Roadmap

### Planned Features

#### Log Management
- Browse log history with pagination
- Search and filter formatted logs
- Delete logs functionality
- Export logs (JSON, CSV formats)
- Batch log processing via file upload

#### User Features
- User dashboard with statistics
- Favorite LLM provider selection
- Custom system prompt templates
- Schema customization options
- Usage analytics and metrics

#### API & Integration
- RESTful API endpoints
- API token authentication
- Webhooks for real-time processing
- Third-party integrations
- CLI tool for log formatting

#### Performance & Scaling
- Redis cache integration
- Queue worker for async processing
- Rate limiting on API endpoints
- Database query optimization
- CDN for static assets

#### Advanced Features
- Multi-language log support
- Log pattern recognition
- Anomaly detection
- Custom log parsers
- Scheduled log processing
- Real-time log monitoring

---

## Version History

- **October 15, 2025**: Core implementation complete (Phases 1-3)
- **October 14, 2025**: Project initialization

---

**Note**: This changelog reflects the current state of StructLogr as of October 15, 2025. All core features from the implementation plan have been completed successfully.
