# Changelog

All notable changes to StructLogr will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
