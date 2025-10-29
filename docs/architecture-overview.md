# Architecture Overview

This document provides a comprehensive overview of StructLogr's architecture, including backend structure, frontend organization, data flow, and key design decisions.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Backend Architecture](#backend-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Database Schema](#database-schema)
5. [Authentication & Authorization](#authentication--authorization)
6. [API Design](#api-design)
7. [State Management](#state-management)
8. [Build & Deployment](#build--deployment)

---

## System Architecture

StructLogr follows a modern full-stack architecture with clear separation between client and server responsibilities.

**Architecture Layers:**

**Client Browser Layer:**

- React 19 + TypeScript application
- Component-based UI (Pages, Components, Hooks)
- Inertia.js 2.0 Client for SPA functionality

**Communication:**

- HTTP/HTTPS with Inertia Protocol
- JSON data exchange

**Laravel 12 Backend Layer:**

- Routes handle incoming requests
- Middleware processes requests
- Controllers coordinate business logic
- Services encapsulate domain logic (Prism integration)
- Models manage data persistence (Eloquent ORM)
- LLM Providers (DeepSeek, OpenAI, Anthropic, etc.)

**Database Layer:**

- MySQL 8.0 Database
- Tables: users, formatted_logs, cache, sessions, jobs

### Key Design Principles

1. **Server-Side Rendering (SSR)**: Inertia.js enables traditional server-side routing with React components
2. **Type Safety**: Full TypeScript coverage on frontend with Laravel Wayfinder for type-safe routes
3. **Service Layer**: Business logic encapsulated in service classes (e.g., `LogFormatterService`)
4. **Component-Based UI**: Reusable React components built with Radix UI primitives
5. **Convention over Configuration**: Following Laravel and React best practices

---

## Backend Architecture

### Directory Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Auth/                    # Authentication controllers
│   │   │   ├── AuthenticatedSessionController.php
│   │   │   ├── EmailVerificationNotificationController.php
│   │   │   ├── EmailVerificationPromptController.php
│   │   │   ├── NewPasswordController.php
│   │   │   ├── PasswordResetLinkController.php
│   │   │   ├── RegisteredUserController.php
│   │   │   └── VerifyEmailController.php
│   │   ├── Settings/                # User settings controllers
│   │   │   ├── PasswordController.php
│   │   │   ├── ProfileController.php
│   │   │   └── TwoFactorAuthenticationController.php
│   │   ├── Controller.php           # Base controller
│   │   ├── HistoryController.php    # History management
│   │   └── LogFormatterController.php # Log formatting feature
│   ├── Middleware/
│   │   ├── HandleAppearance.php     # Theme preference middleware
│   │   └── HandleInertiaRequests.php # Inertia shared data
│   └── Requests/
│       ├── Auth/
│       │   └── LoginRequest.php
│       └── Settings/
│           ├── ProfileUpdateRequest.php
│           └── TwoFactorAuthenticationRequest.php
├── Models/
│   ├── FormattedLog.php             # Formatted log entries
│   └── User.php                      # User authentication
├── Providers/
│   ├── AppServiceProvider.php
│   └── FortifyServiceProvider.php    # Laravel Fortify configuration
└── Services/
    ├── HistoryService.php            # History management
    └── LogFormatterService.php       # Prism LLM integration
```

### Controllers

#### LogFormatterController

The main controller for log formatting functionality.

**Location**: `app/Http/Controllers/LogFormatterController.php`

**Methods**:

- `show()`: Renders the FormatterPage Inertia component
- `format(Request $request, LogFormatterService $service)`:
    - Validates raw log input
    - Calls `LogFormatterService` to process with LLM
    - Saves result to database
    - Returns formatted log to frontend

**Routes**:

```php
Route::get('/', [LogFormatterController::class, 'show'])->name('formatter.show');
Route::post('/format', [LogFormatterController::class, 'format'])->name('formatter.format');
```

#### Authentication Controllers

Laravel Fortify provides authentication controllers under `app/Http/Controllers/Auth/`:

- **AuthenticatedSessionController**: Login/logout
- **RegisteredUserController**: User registration
- **PasswordResetLinkController**: Password reset email
- **NewPasswordController**: Password reset form
- **VerifyEmailController**: Email verification
- **EmailVerificationPromptController**: Email verification prompt
- **EmailVerificationNotificationController**: Resend verification email

#### Settings Controllers

User settings management under `app/Http/Controllers/Settings/`:

- **ProfileController**: Update name, email
- **PasswordController**: Change password
- **TwoFactorAuthenticationController**: Enable/disable 2FA, view recovery codes
- **PreferencesController**: Manage user preferences with backend persistence

#### PreferencesController

**Location**: `app/Http/Controllers/Settings/PreferencesController.php`

**Methods**:

- `index()`: Returns user's current preferences
- `update(Request $request)`: Updates user preferences with validation

**Validation Rules**:

- `outputFormat`: Must be 'json', 'yaml', or 'xml'
- `jsonIndentation`: Integer between 0 and 8
- `autoCopyResults`: Boolean
- `showLineNumbers`: Boolean
- `saveToHistory`: Boolean
- `anonymousAnalytics`: Boolean
- `avoidSensitiveStorage`: Boolean
- `fontSize`: Must be 'small', 'medium', or 'large'
- `reduceAnimations`: Boolean
- `customApiEndpoint`: Optional URL
- `apiKey`: Optional string (max 255 chars)
- `timeoutSeconds`: Integer between 5 and 300

**Routes**:

```php
Route::middleware('auth')->group(function () {
    Route::get('/settings/preferences', [PreferencesController::class, 'index'])->name('preferences.index');
    Route::patch('/settings/preferences', [PreferencesController::class, 'update'])->name('preferences.update');
});
```

#### HistoryController

**Location**: `app/Http/Controllers/HistoryController.php`

**Methods**:

- `index()`: Returns user's history (recent and saved entries)
- `show(FormattedLog $formattedLog)`: Retrieves specific history entry
- `search(HistorySearchRequest $request)`: Performs full-text search on history
- `destroy(FormattedLog $formattedLog)`: Deletes history entry
- `toggleSave(FormattedLog $formattedLog)`: Toggles saved status
- `clear()`: Clears all user history
- `export()`: Exports history as JSON file

**Routes**:

```php
Route::middleware('auth')->group(function () {
    Route::get('/history', [HistoryController::class, 'index'])->name('history.index');
    Route::get('/history/search', [HistoryController::class, 'search'])->name('history.search');
    Route::get('/history/{formattedLog}', [HistoryController::class, 'show'])->name('history.show');
    Route::delete('/history/{formattedLog}', [HistoryController::class, 'destroy'])->name('history.destroy');
    Route::patch('/history/{formattedLog}/toggle-save', [HistoryController::class, 'toggleSave'])->name('history.toggle');
    Route::delete('/history', [HistoryController::class, 'clear'])->name('history.clear');
    Route::get('/history/export', [HistoryController::class, 'export'])->name('history.export');
});
```

### Services

#### HistoryService

**Location**: `app/Services/HistoryService.php`

**Responsibilities**:

- Retrieves user-specific history entries
- Formats history data for frontend consumption
- Separates recent vs saved entries
- Generates preview text from raw logs
- Performs full-text search across history entries

**Key Methods**:

```php
public function entriesForUser(User $user, int $limit = 50): Collection
```

- Fetches latest formatted logs for user
- Orders by created_at descending
- Limits results for performance

```php
public function payloadForUser(User $user, int $limit = 50): array
```

- Returns structured payload with `recent` and `saved` arrays
- Each entry includes: id, summary, preview, createdAt, detectedLogType, fieldCount, isSaved
- Preview text is sanitized (120 char limit, newlines removed)

```php
public function search(User $user, string $query, int $limit = 20, string $scope = 'all'): Collection
```

- Performs MySQL full-text search using `MATCH ... AGAINST` syntax
- Searches across: `title`, `summary`, `raw_log`, `detected_log_type` columns
- Supports three search scopes:
    - `'all'`: Searches all user history entries
    - `'recent'`: Searches only unsaved entries (`is_saved = false`)
    - `'saved'`: Searches only bookmarked entries (`is_saved = true`)
- Returns results ordered by relevance score, then creation date (DESC)
- User-scoped queries ensure privacy isolation
- Query sanitization via `HistorySearchRequest` validation

#### LogFormatterService

**Location**: `app/Services/LogFormatterService.php`

**Responsibilities**:

- Encapsulates Prism SDK integration
- Defines LLM system prompt for log parsing
- Defines JSON schema for structured output
- Makes LLM API calls via Prism
- Handles retry logic with exponential backoff
- Validates structured output
- Applies user preferences to formatted logs
- Comprehensive logging for debugging
- Persists formatted logs to database

**Key Methods**:

```php
public function format(string $rawLog, ?string $llmModel = null, ?array $preferences = null, int $maxRetries = 3): array
```

- Accepts raw log text, optional LLM model selection, user preferences, and retry configuration
- Uses Prism structured generation with provider-specific schema conversion
- Supports multiple LLM providers:
    - DeepSeek (deepseek-chat) - default
    - Google Gemini (gemini-2.5-flash)
    - Moonshot AI (kimi-k2-turbo-preview) via OpenRouter
    - ZhipuAI (GLM-4.5-Air, GLM-4.6) via OpenRouter
- Implements retry logic with exponential backoff (default: 3 attempts)
- Comprehensive logging at all stages (info, debug, warning, error, critical)
- Times API requests and logs duration
- Validates structured output against schema requirements
- Returns structured array with fields:
    - `detected_log_type`: High-level classification such as `test_runner`, `application_error`, or `http_access`
    - `summary`: Object containing `status`, `headline`, optional `primary_subject`, `key_points`, `duration`, and `timestamp`
    - `entities`: Array of `{ type, identifier, details? }` extracted from the log
    - `metrics`: Array of numeric metrics `{ name, value?, unit?, description? }`
    - `sections`: Array of structured sections with `section_type`, optional `title`/`description`, optional `items`, and a flexible `data` object for type-specific payloads
    - Optional additional data may be included inside section `data` objects to capture domain-specific structures

```php
public function saveLog(string $rawLog, array $formattedLog, ?User $user = null): ?FormattedLog
```

- Persists raw and formatted logs to database
- Accepts optional User parameter
- Returns `null` for guest users (no database save)
- Extracts summary, detected type, and field count for metadata
- Returns saved `FormattedLog` model instance

```php
private function configureDeepseek($builder): void
private function configureGemini($builder, ObjectSchema $schema): void
private function configureMoonshot($builder, ObjectSchema $schema): void
private function configureGLM($builder, ObjectSchema $schema, string $model): void
```

- Provider-specific configuration methods
- Handle different response format requirements
- Convert schemas to provider-specific formats
- Configure temperature, max tokens, and client options

```php
private function validateStructuredOutput(array $data): void
```

- Validates required fields in structured output
- Ensures schema compliance
- Throws exceptions with detailed error messages
- Logs validation progress

```php
private function applyPreferences(array $formattedLog, array $preferences): array
```

- Applies user preferences to formatted log
- Supports timestamp transformation (ISO8601, Unix, Custom)
- Supports log level normalization
- Timezone conversion (UTC, Local)

**Prism Configuration Example**:

```php
Prism::structured()
    ->using(Provider::DeepSeek, 'deepseek-chat')
    ->withSystemPrompt($systemPrompt)
    ->withSchema($schema)
    ->withPrompt($rawLog)
    ->usingTemperature(0.0)
    ->withMaxTokens(8192)
    ->withClientOptions([
        'timeout' => 600,
        'connect_timeout' => 60,
    ])
    ->asStructured();
```

**Logging Example**:

```php
\Log::info('=== LogFormatterService::format() START ===', [
    'llm_model' => 'deepseek-chat',
    'preferences' => null,
    'max_retries' => 3,
    'raw_log_length' => 245,
    'raw_log_preview' => '2024-10-15 14:23:45 [ERROR]...',
]);
```

### Models

#### FormattedLog

**Location**: `app/Models/FormattedLog.php`

**Schema**:

```php
$fillable = [
    'user_id',
    'raw_log',
    'formatted_log',
    'detected_log_type',
    'title',
    'summary',
    'field_count',
    'is_saved',
];
$casts = [
    'formatted_log' => 'array',
    'is_saved' => 'boolean',
];
```

**Relationships**:

```php
public function user(): BelongsTo
{
    return $this->belongsTo(User::class);
}
```

**Database Table**: `formatted_logs`

- `id`: Primary key
- `user_id`: Foreign key to users (nullable)
- `raw_log`: TEXT - Original unstructured log
- `formatted_log`: JSON - Structured output
- `detected_log_type`: VARCHAR(255) - Log type classification
- `title`: VARCHAR(255) - LLM-generated concise title
- `summary`: TEXT - Detailed summary
- `field_count`: INT - Number of extracted fields
- `is_saved`: BOOLEAN - User-saved status
- `timestamps`: created_at, updated_at

#### User

**Location**: `app/Models/User.php`

Standard Laravel User model with Fortify two-factor authentication traits and user preferences support.

**Database Table**: `users`

- `id`: Primary key
- `name`: User full name
- `email`: Email address (unique)
- `password`: Hashed password
- `preferences`: JSON - User preferences with defaults (NEW)
- `two_factor_secret`: Encrypted 2FA secret
- `two_factor_recovery_codes`: Encrypted recovery codes
- `two_factor_confirmed_at`: Timestamp
- `timestamps`: created_at, updated_at

**Preferences Schema**:
The User model includes a `getPreferencesAttribute()` accessor that merges stored preferences with sensible defaults:

```php
[
    'outputFormat' => 'json',           // json, yaml, xml
    'jsonIndentation' => 2,             // 0-8 spaces
    'autoCopyResults' => false,         // Auto-copy formatted output
    'showLineNumbers' => true,          // Display line numbers
    'saveToHistory' => true,            // Persist to history
    'anonymousAnalytics' => true,       // Usage analytics
    'avoidSensitiveStorage' => false,   // Skip sensitive data
    'fontSize' => 'medium',             // small, medium, large
    'reduceAnimations' => false,        // Reduce motion
    'customApiEndpoint' => '',          // Custom LLM endpoint
    'apiKey' => '',                     // Custom API key
    'timeoutSeconds' => 30,             // API timeout (5-300)
]
```

**Casts**:

```php
'preferences' => 'array',  // Automatic JSON encoding/decoding
```

### Middleware

#### HandleInertiaRequests

**Location**: `app/Http/Middleware/HandleInertiaRequests.php`

**Purpose**: Share global data with all Inertia pages

**Shared Data**:

```php
[
    'auth' => [
        'user' => $request->user(),
    ],
    'preferences' => $request->user()?->preferences,  // User preferences (NEW)
    'flash' => [
        'message' => session('message'),
        'error' => session('error'),
    ],
]
```

User preferences are automatically shared with all Inertia pages when authenticated, enabling consistent preference application across the frontend without additional API calls.

#### HandleAppearance

**Location**: `app/Http/Middleware/HandleAppearance.php`

**Purpose**: Manages theme preference (light/dark mode) via cookie

### Configuration Files

#### config/prism.php

Prism SDK configuration with support for multiple LLM providers:

**Supported Providers**:

- OpenAI (GPT models)
- Anthropic (Claude models)
- DeepSeek (default in LogFormatterService)
- Mistral
- Groq
- xAI
- Google Gemini
- Ollama (local models)
- OpenRouter
- ElevenLabs (audio)
- VoyageAI (embeddings)

Each provider configured via environment variables (API keys, URLs).

#### config/fortify.php

Laravel Fortify authentication configuration:

**Features Enabled**:

- Registration
- Password reset
- Email verification
- Two-factor authentication
- Update user profile
- Update passwords

#### config/inertia.php

Inertia.js configuration:

**SSR Settings**:

- SSR enabled: true
- SSR URL: http://localhost:13714

---

## Frontend Architecture

### Directory Structure

```
resources/js/
├── actions/                    # Wayfinder generated actions
│   ├── App/Http/Controllers/
│   │   ├── Auth/
│   │   ├── Settings/
│   │   └── LogFormatterController.ts
│   ├── Laravel/Fortify/Http/Controllers/
│   └── Illuminate/Routing/RedirectController.ts
├── components/                 # React components
│   ├── ui/                     # Radix UI primitives
│   │   ├── alert.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── collapsible.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── icon.tsx
│   │   ├── info-tooltip.tsx
│   │   ├── input.tsx
│   │   ├── input-otp.tsx
│   │   ├── label.tsx
│   │   ├── navigation-menu.tsx
│   │   ├── placeholder-pattern.tsx
│   │   ├── radio-group.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── sidebar.tsx
│   │   ├── skeleton.tsx
│   │   ├── slider.tsx
│   │   ├── spinner.tsx
│   │   ├── switch.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── toggle.tsx
│   │   ├── toggle-group.tsx
│   │   └── tooltip.tsx
│   ├── animations/
│   │   └── success-checkmark.tsx # Success animation
│   ├── formatter/              # Formatter-specific components
│   │   ├── empty-state.tsx     # Empty history state
│   │   ├── format-tip.tsx      # Format tips
│   │   ├── formatting-preferences.tsx # User preferences
│   │   ├── help-modal.tsx      # Help modal
│   │   ├── history-entry-card.tsx # History card
│   │   ├── history-sidebar.tsx # History sidebar
│   │   ├── onboarding-tour.tsx # Onboarding
│   │   └── welcome-banner.tsx  # Welcome banner
│   ├── search/                 # Search components
│   │   └── search-dialog.tsx   # Search dialog with keyboard shortcuts
│   ├── illustrations/
│   │   └── empty-log-illustration.tsx # Empty state illustration
│   ├── alert-error.tsx         # Error alert component
│   ├── app-content.tsx         # Main content wrapper
│   ├── app-footer.tsx          # Application footer
│   ├── app-header.tsx          # Application header with user display
│   ├── app-logo-icon.tsx       # Logo icon
│   ├── app-logo.tsx            # Full logo
│   ├── app-shell.tsx           # App shell layout
│   ├── app-sidebar-header.tsx  # Sidebar header
│   ├── app-sidebar.tsx         # Navigation sidebar
│   ├── appearance-dropdown.tsx # Theme switcher dropdown
│   ├── appearance-tabs.tsx     # Theme tabs
│   ├── breadcrumbs.tsx         # Breadcrumb navigation
│   ├── delete-user.tsx         # User deletion component
│   ├── error-boundary.tsx      # Error boundary
│   ├── heading-small.tsx       # Small heading
│   ├── heading.tsx             # Page heading
│   ├── hero-section.tsx        # Hero section
│   ├── icon.tsx                # Icon wrapper
│   ├── input-error.tsx         # Form input error
│   ├── keyboard-shortcuts-modal.tsx # Keyboard shortcuts help
│   ├── mobile-navigation.tsx   # Mobile nav
│   ├── nav-footer.tsx          # Sidebar footer
│   ├── nav-main.tsx            # Main navigation
│   ├── nav-user.tsx            # User nav menu
│   ├── newsletter-signup.tsx   # Newsletter
│   ├── seasonal-effects.tsx    # Seasonal UI effects
│   ├── settings-panel.tsx      # Settings panel
│   ├── skip-navigation.tsx     # Skip to content link
│   ├── status-indicator.tsx    # Status indicator
│   ├── text-link.tsx           # Text link component
│   ├── two-factor-recovery-codes.tsx # 2FA recovery codes
│   ├── two-factor-setup-modal.tsx # 2FA setup
│   ├── user-info.tsx           # User info display
│   └── user-menu-content.tsx   # User menu
├── hooks/                      # Custom React hooks
│   ├── use-appearance.tsx      # Theme management
│   ├── use-clipboard.ts        # Clipboard operations
│   ├── use-first-visit.ts      # First visit detection
│   ├── use-formatting-timer.ts # Format request timer
│   ├── use-history.ts          # History management
│   ├── use-initials.tsx        # User initials
│   ├── use-keyboard-shortcuts.ts # Keyboard shortcuts
│   ├── use-llm-model.ts        # LLM model selection
│   ├── use-mobile-navigation.ts # Mobile navigation
│   ├── use-mobile.tsx          # Mobile detection
│   ├── use-preferences.ts      # User preferences
│   ├── use-scroll-shadow.ts    # Scroll shadows
│   ├── use-search.ts           # Search functionality with debouncing
│   ├── use-settings.ts         # Settings management
│   ├── use-two-factor-auth.ts  # 2FA logic
│   └── use-unique-id.tsx       # Unique ID generation
├── layouts/                    # Page layouts
│   ├── app/
│   │   ├── app-header-layout.tsx
│   │   └── app-sidebar-layout.tsx
│   ├── auth/
│   │   ├── auth-card-layout.tsx
│   │   ├── auth-simple-layout.tsx
│   │   └── auth-split-layout.tsx
│   ├── settings/
│   │   └── layout.tsx          # Settings page layout
│   ├── app-layout.tsx          # Main app layout
│   └── auth-layout.tsx         # Auth pages layout
├── pages/                      # Inertia pages
│   ├── auth/
│   │   ├── confirm-password.tsx
│   │   ├── forgot-password.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── reset-password.tsx
│   │   ├── two-factor-challenge.tsx
│   │   └── verify-email.tsx
│   ├── settings/
│   │   ├── appearance.tsx      # Theme settings
│   │   ├── password.tsx        # Password change
│   │   ├── profile.tsx         # Profile editing
│   │   └── two-factor.tsx      # 2FA management
│   ├── FormatterPage.tsx       # Log formatter (main feature at /)
│   └── welcome.tsx             # Landing page
├── routes/                     # Wayfinder route helpers
│   ├── appearance/index.ts
│   ├── formatter/index.ts
│   ├── history/index.ts        # History routes
│   ├── login/index.ts
│   ├── password/
│   │   ├── confirm/index.ts
│   │   └── index.ts
│   ├── profile/index.ts
│   ├── register/index.ts
│   ├── storage/index.ts
│   ├── two-factor/
│   │   ├── login/index.ts
│   │   └── index.ts
│   ├── verification/index.ts
│   └── index.ts                # Root route exports
├── types/                      # TypeScript type definitions
│   ├── history.ts              # History types
│   ├── preferences.ts          # Preferences types
│   ├── search.ts               # Search types (SearchScope, SearchResult, SearchResponse)
│   ├── index.d.ts              # Global types
│   └── vite-env.d.ts
├── wayfinder/                  # Wayfinder generated code
│   └── index.ts
├── lib/
│   └── utils.ts                # Utility functions (cn, etc.)
├── app.tsx                     # Inertia app entry point
└── ssr.tsx                     # SSR entry point
```

### Pages

#### FormatterPage.tsx

**Location**: `resources/js/pages/FormatterPage.tsx`

**Purpose**: Main log formatting interface

**Features**:

- Textarea for raw log input
- Form validation via Inertia `useForm`
- Submit button with loading state (spinner)
- JSON output display with pretty-printing
- Responsive layout with Tailwind CSS
- Navigation links to login/register for guests

**Props Interface**:

```typescript
interface FormatterPageProps {
    formattedLog?: {
        timestamp?: string;
        level?: string;
        message?: string;
        source?: string;
        metadata?: Record<string, unknown>;
        [key: string]: unknown;
    };
}
```

**Form Submission**:

```typescript
const { data, setData, post, processing, errors } = useForm({
    raw_log: '',
});

const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post('/format');
};
```

#### Authentication Pages

Located in `resources/js/pages/auth/`:

- **login.tsx**: Email/password login with 2FA support
- **register.tsx**: New user registration
- **forgot-password.tsx**: Request password reset email
- **reset-password.tsx**: Set new password
- **two-factor-challenge.tsx**: 2FA code entry
- **verify-email.tsx**: Email verification notice
- **confirm-password.tsx**: Password confirmation for sensitive actions

#### Settings Pages

Located in `resources/js/pages/settings/`:

- **profile.tsx**: Update name and email
- **password.tsx**: Change password
- **two-factor.tsx**: Enable/disable 2FA, view recovery codes
- **appearance.tsx**: Theme selection (light/dark/system)

### Components

#### UI Components

Located in `resources/js/components/ui/`, built with Radix UI:

**Form Components**:

- `input.tsx`: Text input field
- `textarea.tsx`: Multi-line text input
- `label.tsx`: Form label
- `checkbox.tsx`: Checkbox input
- `select.tsx`: Dropdown select
- `button.tsx`: Button with variants (default, destructive, outline, ghost, link)

**Layout Components**:

- `card.tsx`: Card container (CardHeader, CardTitle, CardContent, CardFooter)
- `separator.tsx`: Visual separator
- `sidebar.tsx`: Collapsible sidebar navigation
- `sheet.tsx`: Slide-out panel

**Feedback Components**:

- `alert.tsx`: Alert messages
- `spinner.tsx`: Loading indicator
- `skeleton.tsx`: Loading placeholder
- `badge.tsx`: Status badges

**Overlay Components**:

- `dialog.tsx`: Modal dialog
- `dropdown-menu.tsx`: Dropdown menu
- `tooltip.tsx`: Hover tooltip

**Navigation Components**:

- `navigation-menu.tsx`: Navigation menu
- `breadcrumb.tsx`: Breadcrumb trail

#### Application Components

**Shell Components**:

- `app-shell.tsx`: Main application shell
- `app-header.tsx`: Top navigation bar with user display and accessibility IDs
- `app-sidebar.tsx`: Sidebar navigation with sections
- `app-content.tsx`: Main content area
- `app-footer.tsx`: Application footer

**Formatter Components** (`components/formatter/`):

- `history-sidebar.tsx`: History panel with recent and saved tabs
- `history-entry-card.tsx`: Individual history entry card with title display
- `empty-state.tsx`: Empty history state with illustration
- `formatting-preferences.tsx`: User formatting preferences panel
- `help-modal.tsx`: Help and documentation modal
- `format-tip.tsx`: Format tips and suggestions
- `welcome-banner.tsx`: Welcome banner for new users
- `onboarding-tour.tsx`: Interactive onboarding tour

**Utility Components**:

- `input-error.tsx`: Form validation error display
- `alert-error.tsx`: Error alert with icon
- `keyboard-shortcuts-modal.tsx`: Dynamic keyboard shortcuts help (NEW - October 2025)
- `two-factor-setup-modal.tsx`: 2FA setup wizard
- `two-factor-recovery-codes.tsx`: 2FA recovery code display
- `appearance-dropdown.tsx`: Theme switcher
- `skip-navigation.tsx`: Skip to main content link for accessibility
- `status-indicator.tsx`: Status indicator component
- `user-info.tsx`: User information display
- `user-menu-content.tsx`: User dropdown menu content

**Animation Components** (`components/animations/`):

- `success-checkmark.tsx`: Success animation for completed actions

**Illustration Components** (`components/illustrations/`):

- `empty-log-illustration.tsx`: SVG illustration for empty states

### Layouts

#### AppLayout

**Location**: `resources/js/layouts/app-layout.tsx`

**Purpose**: Default layout for authenticated pages

**Features**:

- App shell with header and sidebar
- Responsive design
- Navigation menu
- User dropdown menu

#### AuthLayout

**Location**: `resources/js/layouts/auth-layout.tsx`

**Purpose**: Layout for authentication pages

**Variants**:

- `auth-card-layout.tsx`: Centered card design
- `auth-simple-layout.tsx`: Minimal design
- `auth-split-layout.tsx`: Split screen with branding

#### Settings Layout

**Location**: `resources/js/layouts/settings/layout.tsx`

**Purpose**: Settings page layout with tabbed navigation

**Tabs**:

- Profile
- Password
- Two-Factor Authentication
- Appearance

### Hooks

#### useAppearance

**Location**: `resources/js/hooks/use-appearance.tsx`

**Purpose**: Manage theme preferences (light/dark/system)

**API**:

```typescript
const { appearance, setAppearance } = useAppearance();
```

**Storage**: Cookie-based persistence via `HandleAppearance` middleware

#### useFontSize

**Location**: `resources/js/hooks/use-font-size.ts`

**Purpose**: Manage font size preferences (small/medium/large)

**API**:

```typescript
const { fontSize, updateFontSize } = useFontSize();
```

**Storage**: Synced with useSettings hook, applied via data-font-size attribute

**CSS Integration**: Uses CSS custom properties to scale typography globally

#### useTwoFactorAuth

**Location**: `resources/js/hooks/use-two-factor-auth.ts`

**Purpose**: Two-factor authentication state management

**Features**:

- Enable/disable 2FA
- Generate QR code
- Display recovery codes
- Confirm 2FA setup

#### useClipboard

**Location**: `resources/js/hooks/use-clipboard.ts`

**Purpose**: Copy to clipboard functionality

**API**:

```typescript
const { copy, copied } = useClipboard();
```

#### useFormattingTimer

**Location**: `resources/js/hooks/use-formatting-timer.ts`

**Purpose**: Track and display formatting request duration

**Features**:

- Real-time elapsed time tracking
- Millisecond precision
- Automatic start/stop/reset
- Integrates with formatting state

**API**:

```typescript
const { elapsedTime, isRunning, startTimer, stopTimer, resetTimer } =
    useFormattingTimer();
```

#### useLLMModel

**Location**: `resources/js/hooks/use-llm-model.ts`

**Purpose**: Manage LLM model selection and persistence

**Features**:

- Model selection with localStorage persistence
- Available models list
- Default model configuration
- Reactive model updates

**API**:

```typescript
const { model, setModel, availableModels } = useLLMModel();
```

**Available Models**:

```typescript
const availableModels = [
    { value: 'deepseek-chat', label: 'DeepSeek Chat' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'kimi-k2-turbo-preview', label: 'Kimi K2 Turbo' },
    { value: 'GLM-4.5-Air', label: 'GLM-4.5-Air' },
    { value: 'GLM-4.6', label: 'GLM-4.6' },
];
```

#### useKeyboardShortcuts

**Location**: `resources/js/hooks/use-keyboard-shortcuts.ts`

**Purpose**: Centralized keyboard shortcut management with platform-aware key combinations

**Features**:

- Cross-platform keyboard shortcut handling (Cmd on Mac, Ctrl elsewhere)
- Centralized shortcut registry with type safety
- Dynamic shortcut documentation generation
- Integration with keyboard shortcuts modal
- Tooltips for action buttons

**API**:

```typescript
const { shortcuts, getShortcuts } = useKeyboardShortcuts({
    onFormat: () => handleFormat(),
    onClear: () => handleClear(),
    onToggleHistory: () => toggleHistory(),
});
```

**Shortcut Registry**:

```typescript
const shortcuts = [
    { key: 'Ctrl+Enter', action: 'Format log', callback: onFormat },
    { key: 'Ctrl+K', action: 'Toggle history', callback: onToggleHistory },
    { key: 'Ctrl+L', action: 'Clear input', callback: onClear },
    { key: '?', action: 'Show shortcuts', callback: showHelp },
];
```

#### useHistory

**Location**: `resources/js/hooks/use-history.ts`

**Purpose**: History management for formatted logs

**Features**:

- Fetch user's history entries (recent and saved)
- Load specific history entry
- Delete history entries
- Toggle saved status
- Clear all history
- Export history as JSON
- Real-time updates

**API**:

```typescript
const {
    history,
    isLoading,
    loadEntry,
    deleteEntry,
    toggleSave,
    clearAll,
    exportHistory,
} = useHistory();
```

**History Entry Type**:

```typescript
interface HistoryEntry {
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

#### useSettings

**Location**: `resources/js/hooks/use-settings.ts`

**Purpose**: Manage user formatting preferences with backend persistence

**Features**:

- Backend synchronization via PreferencesController API
- LocalStorage fallback for guest users
- Automatic sync on preference changes
- Optimistic UI updates
- 12 configurable settings:
    - Output format, JSON indentation
    - Auto-copy results, line numbers
    - History saving, analytics
    - Sensitive data handling
    - Font size, animations
    - Custom API endpoint, API key, timeout

**API**:

```typescript
const { settings, updateSettings, isLoading } = useSettings();
```

**Backend Integration**:

- Authenticated users: Preferences persist to database via PATCH `/settings/preferences`
- Guest users: Preferences stored in localStorage only
- Automatic merge with server preferences on mount
- Real-time sync across tabs/devices for authenticated users

#### useSearch

**Location**: `resources/js/hooks/use-search.ts`

**Purpose**: Full-text search functionality for history entries

**Features**:

- Debounced query execution (250ms default delay)
- Search scope filtering (all, recent, saved)
- Automatic request cancellation for stale queries
- Status tracking (idle, loading, success, error)
- Result caching and metadata management
- Endpoint validation and origin normalization
- User-friendly error handling

**API**:

```typescript
const {
    query,
    setQuery,
    scope,
    setScope,
    results,
    meta,
    status,
    error,
    isSearching,
    canSearch,
    performSearch,
    reset,
} = useSearch({
    endpoint: '/history/search',
    defaultScope: 'all',
    limit: 20,
    debounceMs: 250,
    enabled: true,
});
```

**Search Result Type**:

```typescript
interface SearchResult {
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
```

**Backend Integration**:

- Queries MySQL full-text search via GET `/history/search`
- Query validation: 2-100 characters, trimmed whitespace
- Scope filtering: 'all', 'recent' (unsaved), 'saved' (bookmarked)
- Results ordered by relevance score, then creation date DESC
- Privacy: All searches scoped to authenticated user

### Routing

#### Laravel Wayfinder Integration

**Configuration**: `vite.config.ts`

```typescript
wayfinder({
    formVariants: true,
});
```

**Generated Files**:

- `resources/js/actions/`: Server action helpers (3,325 lines generated)
    - Auth actions (login, register, password reset, email verification)
    - Settings actions (profile, password, 2FA, preferences)
    - History actions (CRUD, toggle save, export)
    - Formatter actions (format logs)
- `resources/js/routes/`: Route helper functions
- `resources/js/wayfinder/index.ts`: Core routing utilities

**Usage**:

```typescript
import { login, register } from '@/routes';
import { preferences } from '@/routes/preferences';

<Link href={login()}>Log in</Link>
<Link href={register()}>Register</Link>
<Link href={preferences.index()}>Preferences</Link>
```

**Type Safety**:

- Full TypeScript support for route parameters and query strings
- Form variant support for POST/PATCH/DELETE actions
- Inertia FormData type compatibility with type assertions
- Auto-generated action types for all Laravel routes

---

## Database Schema

### Tables

#### users

```sql
CREATE TABLE users (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    two_factor_secret TEXT NULL,
    two_factor_recovery_codes TEXT NULL,
    two_factor_confirmed_at TIMESTAMP NULL,
    remember_token VARCHAR(100) NULL,
    preferences JSON NULL,                -- NEW: User preferences with defaults
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

**Preferences JSON Structure**:

```json
{
    "outputFormat": "json",
    "jsonIndentation": 2,
    "autoCopyResults": false,
    "showLineNumbers": true,
    "saveToHistory": true,
    "anonymousAnalytics": true,
    "avoidSensitiveStorage": false,
    "fontSize": "medium",
    "reduceAnimations": false,
    "customApiEndpoint": "",
    "apiKey": "",
    "timeoutSeconds": 30
}
```

#### formatted_logs

```sql
CREATE TABLE formatted_logs (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NULL,
    raw_log TEXT NOT NULL,
    formatted_log JSON NOT NULL,
    detected_log_type VARCHAR(255) NULL,
    title VARCHAR(255) NULL,
    summary TEXT NULL,
    field_count INT NULL,
    is_saved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_title (title),
    INDEX idx_is_saved (is_saved),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Key Columns**:

- `user_id`: Foreign key to users table (null for guest users)
- `raw_log`: Original unstructured log text
- `formatted_log`: Structured JSON output from LLM
- `detected_log_type`: High-level log classification (e.g., "application_error", "http_access")
- `title`: Concise 5-50 character LLM-generated title for quick identification (NEW in October 2025)
- `summary`: Detailed text summary of log entry
- `field_count`: Number of fields extracted from log
- `is_saved`: User-saved status for quick access

**Formatted Log JSON Structure**:

```json
{
    "detected_log_type": "application_error",
    "summary": {
        "status": "error",
        "headline": "Database connection failed",
        "key_points": ["Connection timeout", "30s threshold exceeded"]
    },
    "entities": [
        { "type": "service", "identifier": "Database", "details": "MySQL 8.0" }
    ],
    "metrics": [{ "name": "timeout", "value": 30, "unit": "seconds" }],
    "sections": [
        {
            "section_type": "error_details",
            "data": {
                "error_code": "CONN_TIMEOUT",
                "timestamp": "2024-10-15 14:23:45"
            }
        }
    ]
}
```

#### cache

Laravel cache table for database caching.

#### jobs

Laravel queue jobs table (for future async processing).

#### password_reset_tokens

Laravel password reset token storage.

#### sessions

Laravel session storage (database driver).

---

## Authentication & Authorization

### Laravel Fortify

**Provider**: `app/Providers/FortifyServiceProvider.php`

**Features Enabled**:

- Registration with email verification
- Login with remember me
- Password reset via email
- Two-factor authentication (TOTP)
- Profile information updates
- Password updates

### Two-Factor Authentication

**Flow**:

1. User enables 2FA in settings
2. Backend generates secret key
3. Frontend displays QR code + manual key
4. User scans QR code with authenticator app
5. User enters confirmation code
6. Backend verifies code and confirms 2FA
7. Backend generates 8 recovery codes
8. User saves recovery codes

**Models**:

- Secret stored in `users.two_factor_secret` (encrypted)
- Recovery codes in `users.two_factor_recovery_codes` (encrypted)
- Confirmation timestamp in `users.two_factor_confirmed_at`

**Login Flow with 2FA**:

1. User enters email/password
2. If 2FA enabled, redirect to two-factor challenge
3. User enters TOTP code or recovery code
4. Successful authentication

### Email Verification

**Middleware**: `verified`

**Flow**:

1. New user registers
2. Backend sends verification email
3. User clicks verification link
4. Backend verifies signed URL and marks email verified
5. User redirected to `/` (FormatterPage)

**Protected Routes**: Apply `verified` middleware to routes requiring verified email

---

## API Design

### Inertia.js Protocol

StructLogr uses Inertia.js, which operates over HTTP/HTTPS but with a custom protocol:

**Request Headers**:

```
X-Inertia: true
X-Inertia-Version: <asset-version>
```

**Response Format**:

```json
{
    "component": "FormatterPage",
    "props": {
        "formattedLog": {...},
        "auth": {...},
        "flash": {...}
    },
    "url": "/format",
    "version": "<asset-version>"
}
```

### Form Submissions

**Standard POST Request**:

```typescript
post('/format', {
    onSuccess: () => {
        /* handle success */
    },
    onError: () => {
        /* handle errors */
    },
});
```

**Inertia Form Helper**:

```typescript
const { data, setData, post, processing, errors } = useForm({
    raw_log: '',
});

post('/format');
```

**Validation Errors**: Automatically populated in `errors` object

---

## State Management

### Inertia.js Shared Data

**Location**: `app/Http/Middleware/HandleInertiaRequests.php`

**Shared Props**:

```php
[
    'auth' => [
        'user' => $request->user(),
    ],
    'flash' => [
        'message' => session('message'),
        'error' => session('error'),
    ],
]
```

**Access in Components**:

```typescript
const { auth, flash } = usePage<SharedData>().props;
```

### Component State

**Local State**: React `useState` for component-specific state

**Form State**: Inertia `useForm` hook for forms

**Theme State**: Cookie-based via `useAppearance` hook

### Persistent Storage

**Cookies**:

- `appearance`: Theme preference (light/dark/system)
- `sidebar_state`: Sidebar collapsed/expanded state

**Database**: User preferences stored in `users` table

---

## Build & Deployment

### Development

**Start Services**:

```bash
./vendor/bin/sail up -d     # Laravel + MySQL
npm run dev                  # Vite dev server
```

**Ports**:

- App: http://localhost:8001
- Vite HMR: http://localhost:5175
- MySQL: localhost:3308

### Production Build

**Build Frontend Assets**:

```bash
npm run build
```

**Output**:

- `public/build/manifest.json`: Asset manifest
- `public/build/assets/`: Compiled JS/CSS with content hashing

**Laravel Optimization**:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize
```

### SSR (Server-Side Rendering)

**Build SSR Bundle**:

```bash
npm run build:ssr
```

**Start SSR Server**:

```bash
php artisan inertia:start-ssr
```

**SSR Server**: Runs on http://localhost:13714

### Docker Deployment

**Production Compose**:

```yaml
services:
    app:
        build:
            context: .
            dockerfile: Dockerfile
        environment:
            APP_ENV: production
            APP_DEBUG: false
    mysql:
        image: mysql:8.0
    nginx:
        image: nginx:alpine
```

### CI/CD

**GitHub Actions Workflows**:

**`.github/workflows/lint.yml`**:

- ESLint (JavaScript/TypeScript)
- Laravel Pint (PHP)
- Prettier check

**`.github/workflows/tests.yml`**:

- PHPUnit tests
- Database migrations
- Pest test runner

---

## Key Technologies

### Backend

| Technology      | Version | Purpose            |
| --------------- | ------- | ------------------ |
| PHP             | 8.2+    | Language           |
| Laravel         | 12.x    | Framework          |
| Prism           | Latest  | LLM integration    |
| Laravel Fortify | Latest  | Authentication     |
| Laravel Sail    | Latest  | Docker environment |
| MySQL           | 8.0     | Database           |

### Frontend

| Technology   | Version | Purpose              |
| ------------ | ------- | -------------------- |
| React        | 19.x    | UI library           |
| TypeScript   | 5.7+    | Type safety          |
| Inertia.js   | 2.0     | SPA framework        |
| Tailwind CSS | 4.0     | Styling              |
| Radix UI     | Latest  | Component primitives |
| Lucide React | Latest  | Icons                |
| Vite         | 7.x     | Build tool           |

### Development Tools

| Technology        | Version | Purpose          |
| ----------------- | ------- | ---------------- |
| Laravel Pint      | Latest  | PHP linting      |
| ESLint            | 9.x     | JS/TS linting    |
| Prettier          | 3.x     | Code formatting  |
| TypeScript ESLint | 8.x     | TS linting rules |

---

## Design Patterns

### Backend Patterns

**Service Layer Pattern**: Business logic encapsulated in service classes

```php
class LogFormatterService {
    public function format(string $rawLog): array { ... }
    public function saveLog(string $rawLog, array $formattedLog): FormattedLog { ... }
}
```

**Repository Pattern**: Eloquent models act as repositories

**Dependency Injection**: Laravel's service container

### Frontend Patterns

**Component Composition**: Small, reusable components

**Custom Hooks**: Encapsulate stateful logic

**Layout Components**: Shared layouts for page structure

**Form Management**: Inertia form helpers for unified form handling

---

## Performance Considerations

### Backend

- **Query Optimization**: Eloquent eager loading where needed
- **Caching**: Laravel cache for configuration, routes, views
- **Queue Jobs**: Async processing capability (jobs table present)

### Frontend

- **Code Splitting**: Vite automatic code splitting
- **Lazy Loading**: React.lazy for route-based splitting
- **Asset Optimization**: Vite minification and tree-shaking
- **Image Optimization**: Public assets with proper formats

### Database

- **Indexes**: Primary keys on all tables
- **JSON Fields**: Native JSON support in MySQL 8.0
- **Connection Pooling**: MySQL connection pooling via Sail

---

## Security

### Authentication Security

- **Password Hashing**: Bcrypt via Laravel
- **CSRF Protection**: Laravel CSRF tokens on all forms
- **Rate Limiting**: Laravel rate limiting on auth routes
- **Two-Factor Auth**: TOTP-based 2FA with recovery codes
- **Email Verification**: Signed URL verification

### Application Security

- **SQL Injection**: Eloquent ORM parameter binding
- **XSS Protection**: React automatic escaping
- **Cookie Security**: HTTP-only, secure, same-site cookies
- **Environment Secrets**: `.env` file not committed to git

### API Security

- **Inertia Version Checking**: Asset version validation
- **Session Management**: Secure session handling
- **Remember Token**: Secure "remember me" functionality

---

## Future Enhancements

### Planned Features

1. **Log History**: Browse previously formatted logs (IMPLEMENTED)
2. **Batch Processing**: Upload log files for batch formatting
3. **Export Options**: Download formatted logs (JSON, CSV) (IMPLEMENTED)
4. **User Preferences**: Save favorite LLM providers
5. **API Access**: RESTful API for programmatic access
6. **Webhooks**: Real-time log processing via webhooks

### Scalability Considerations

- **Queue System**: Laravel queue for async LLM processing
- **Redis Cache**: Redis for session and cache storage
- **CDN Integration**: Serve static assets from CDN
- **Load Balancing**: Horizontal scaling with multiple app servers
- **Database Replication**: Master-slave replication for read scaling

---

## Troubleshooting

### Common Issues

**Vite Connection Refused**:

- Ensure `npm run dev` is running
- Check `vite.config.ts` server port (5175)

**Inertia Version Mismatch**:

- Clear browser cache
- Run `npm run build`
- Hard refresh (Ctrl+Shift+R)

**2FA Not Working**:

- Verify server time is synchronized (TOTP requires accurate time)
- Check `two_factor_secret` is encrypted in database

**SSR Errors**:

- Ensure SSR server is running: `php artisan inertia:start-ssr`
- Check SSR URL in `config/inertia.php`

---

## Conclusion

StructLogr's architecture emphasizes:

1. **Type Safety**: Full TypeScript coverage on frontend
2. **Developer Experience**: Modern tooling and conventions
3. **Scalability**: Service layer and queue-ready design
4. **Security**: Best practices for authentication and data handling
5. **Maintainability**: Clean separation of concerns

This architecture provides a solid foundation for future enhancements while maintaining code quality and performance.
