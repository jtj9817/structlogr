# Changelog

All notable changes to StructLogr will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
