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

### Services

#### LogFormatterService

**Location**: `app/Services/LogFormatterService.php`

**Responsibilities**:
- Encapsulates Prism SDK integration
- Defines LLM system prompt for log parsing
- Defines JSON schema for structured output
- Makes LLM API calls via Prism
- Persists formatted logs to database

**Key Methods**:

```php
public function format(string $rawLog): array
```
- Accepts raw log text
- Uses Prism structured generation with schema
- Configured provider: DeepSeek (deepseek-chat model)
- Returns structured array with fields:
  - `timestamp`: ISO 8601 or log timestamp
  - `level`: Log level (INFO, ERROR, DEBUG, etc.)
  - `message`: Main log message
  - `source`: Origin/service name
  - `metadata`: Additional context as JSON string

```php
public function saveLog(string $rawLog, array $formattedLog): FormattedLog
```
- Persists raw and formatted logs to database
- Returns saved `FormattedLog` model instance

**Prism Configuration**:

```php
Prism::structured()
    ->using(Provider::DeepSeek, 'deepseek-chat')
    ->withSystemPrompt($systemPrompt)
    ->withSchema($schema)
    ->withPrompt($rawLog)
    ->generate();
```

### Models

#### FormattedLog

**Location**: `app/Models/FormattedLog.php`

**Schema**:
```php
$fillable = ['raw_log', 'formatted_log'];
$casts = ['formatted_log' => 'array'];
```

**Database Table**: `formatted_logs`
- `id`: Primary key
- `raw_log`: TEXT - Original unstructured log
- `formatted_log`: JSON - Structured output
- `timestamps`: created_at, updated_at

#### User

**Location**: `app/Models/User.php`

Standard Laravel User model with Fortify two-factor authentication traits.

**Database Table**: `users`
- `id`: Primary key
- `name`: User full name
- `email`: Email address (unique)
- `password`: Hashed password
- `two_factor_secret`: Encrypted 2FA secret
- `two_factor_recovery_codes`: Encrypted recovery codes
- `two_factor_confirmed_at`: Timestamp
- `timestamps`: created_at, updated_at

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
    'flash' => [
        'message' => session('message'),
        'error' => session('error'),
    ],
]
```

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
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── input-otp.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── sidebar.tsx
│   │   ├── skeleton.tsx
│   │   ├── spinner.tsx
│   │   ├── textarea.tsx
│   │   ├── toggle.tsx
│   │   ├── toggle-group.tsx
│   │   └── tooltip.tsx
│   ├── alert-error.tsx         # Error alert component
│   ├── app-content.tsx         # Main content wrapper
│   ├── app-header.tsx          # Application header
│   ├── app-logo-icon.tsx       # Logo icon
│   ├── app-logo.tsx            # Full logo
│   ├── app-shell.tsx           # App shell layout
│   ├── app-sidebar-header.tsx  # Sidebar header
│   ├── app-sidebar.tsx         # Navigation sidebar
│   ├── appearance-dropdown.tsx # Theme switcher dropdown
│   ├── appearance-tabs.tsx     # Theme tabs
│   ├── breadcrumbs.tsx         # Breadcrumb navigation
│   ├── delete-user.tsx         # User deletion component
│   ├── heading-small.tsx       # Small heading
│   ├── heading.tsx             # Page heading
│   ├── icon.tsx                # Icon wrapper
│   ├── input-error.tsx         # Form input error
│   ├── nav-footer.tsx          # Sidebar footer
│   ├── nav-main.tsx            # Main navigation
│   ├── nav-user.tsx            # User nav menu
│   ├── text-link.tsx           # Text link component
│   ├── two-factor-recovery-codes.tsx
│   └── two-factor-setup-modal.tsx
├── hooks/                      # Custom React hooks
│   ├── use-appearance.tsx      # Theme management
│   ├── use-clipboard.ts        # Clipboard operations
│   ├── use-initials.tsx        # User initials
│   ├── use-mobile-navigation.ts
│   ├── use-mobile.tsx          # Mobile detection
│   └── use-two-factor-auth.ts  # 2FA logic
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
│   ├── dashboard.tsx           # User dashboard
│   ├── FormatterPage.tsx       # Log formatter (main feature)
│   └── welcome.tsx             # Landing page
├── routes/                     # Wayfinder route helpers
│   ├── appearance/index.ts
│   ├── formatter/index.ts
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
- `app-header.tsx`: Top navigation bar
- `app-sidebar.tsx`: Sidebar navigation with sections
- `app-content.tsx`: Main content area

**Utility Components**:
- `input-error.tsx`: Form validation error display
- `alert-error.tsx`: Error alert with icon
- `two-factor-setup-modal.tsx`: 2FA setup wizard
- `two-factor-recovery-codes.tsx`: 2FA recovery code display
- `appearance-dropdown.tsx`: Theme switcher

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

### Routing

#### Laravel Wayfinder Integration

**Configuration**: `vite.config.ts`

```typescript
wayfinder({
    formVariants: true,
})
```

**Generated Files**:
- `resources/js/actions/`: Server action helpers
- `resources/js/routes/`: Route helper functions
- `resources/js/wayfinder/index.ts`: Core routing utilities

**Usage**:
```typescript
import { login, register } from '@/routes';

<Link href={login()}>Log in</Link>
<Link href={register()}>Register</Link>
```

**Type Safety**: Full TypeScript support for route parameters and query strings

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
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

#### formatted_logs

```sql
CREATE TABLE formatted_logs (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    raw_log TEXT NOT NULL,
    formatted_log JSON NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

**Formatted Log JSON Structure**:
```json
{
    "timestamp": "2024-10-15 14:23:45",
    "level": "ERROR",
    "message": "Database connection failed",
    "source": "Database",
    "metadata": "{\"timeout\":\"30s\"}"
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
5. User redirected to dashboard

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
    onSuccess: () => { /* handle success */ },
    onError: () => { /* handle errors */ },
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

| Technology | Version | Purpose |
|------------|---------|---------|
| PHP | 8.2+ | Language |
| Laravel | 12.x | Framework |
| Prism | Latest | LLM integration |
| Laravel Fortify | Latest | Authentication |
| Laravel Sail | Latest | Docker environment |
| MySQL | 8.0 | Database |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI library |
| TypeScript | 5.7+ | Type safety |
| Inertia.js | 2.0 | SPA framework |
| Tailwind CSS | 4.0 | Styling |
| Radix UI | Latest | Component primitives |
| Lucide React | Latest | Icons |
| Vite | 7.x | Build tool |

### Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| Laravel Pint | Latest | PHP linting |
| ESLint | 9.x | JS/TS linting |
| Prettier | 3.x | Code formatting |
| TypeScript ESLint | 8.x | TS linting rules |

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

1. **Log History**: Browse previously formatted logs
2. **Batch Processing**: Upload log files for batch formatting
3. **Export Options**: Download formatted logs (JSON, CSV)
4. **User Preferences**: Save favorite LLM providers
5. **API Access**: RESTful API for programmatic access
6. **Webhooks**: Real-time log processing via webhooks
7. **Log Monitoring**: Dashboard for log analytics

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
