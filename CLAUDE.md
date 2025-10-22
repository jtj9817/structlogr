# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**StructLogr** is a Laravel + React + Inertia.js web application for reformatting raw log text into structured JSON using the Prism package (LLM-powered log parsing). The application uses Laravel Fortify for authentication with two-factor support.

## Development Environment

### Laravel Sail (Docker)
This project uses Laravel Sail for local development with MySQL.

**Start development environment:**
```bash
./vendor/bin/sail up -d
```

**Stop environment:**
```bash
./vendor/bin/sail down
```

**Access containers:**
```bash
./vendor/bin/sail shell
./vendor/bin/sail mysql
```

**Ports:**
- App: http://localhost:8001
- Vite HMR: 5175
- MySQL: 3308 (external), 3306 (internal)

### Running Commands

**Artisan commands:**
```bash
./vendor/bin/sail artisan migrate
./vendor/bin/sail artisan tinker
```

**Composer:**
```bash
./vendor/bin/sail composer install
```

**NPM:**
```bash
npm install
npm run dev
npm run build
```

**Testing:**
```bash
./vendor/bin/sail artisan test
```

**Code quality:**
```bash
npm run lint          # ESLint with auto-fix
npm run format        # Prettier with auto-fix
npm run format:check  # Prettier check only
npm run types         # TypeScript type checking
./vendor/bin/sail composer pint  # PHP CS Fixer (Laravel Pint)
```

## Architecture

### Tech Stack
- **Backend:** Laravel 12, PHP 8.2+
- **Frontend:** React 19, TypeScript, Inertia.js 2.0
- **Styling:** Tailwind CSS 4.0, Radix UI components
- **Build:** Vite 7, Laravel Vite Plugin
- **Database:** MySQL 8.0
- **Auth:** Laravel Fortify (2FA support)
- **Routing:** Laravel Wayfinder (type-safe routing)

### Backend Structure

**Controllers:**
- `app/Http/Controllers/Auth/` - Authentication controllers (Fortify)
- `app/Http/Controllers/Settings/` - User settings (profile, password, 2FA)

**Routes:**
- `routes/auth.php` - Authentication routes (register, login, password reset, email verification)
- `routes/settings.php` - Settings routes (profile, password, appearance, 2FA)
- `routes/console.php` - Artisan commands

**Middleware:**
- `HandleAppearance` - Manages light/dark theme preferences
- `HandleInertiaRequests` - Shares global data with Inertia

**Configuration:**
Cookies `appearance` and `sidebar_state` are not encrypted (see `bootstrap/app.php`).

### Frontend Structure

**Entry point:** `resources/js/app.tsx`
- Initializes Inertia app
- Auto-discovers pages from `./pages/**/*.tsx`
- Initializes theme on load

**Page organization:**
- `resources/js/pages/` - Inertia pages
  - `auth/` - Auth pages (login, register, etc.)
  - `settings/` - Settings pages
  - `dashboard.tsx`, `welcome.tsx`

**Layouts:**
- `resources/js/layouts/app-layout.tsx` - Main authenticated layout
- `resources/js/layouts/auth-layout.tsx` - Authentication pages layout
- `resources/js/layouts/settings/` - Settings-specific layouts

**Components:**
- `resources/js/components/` - Shared components
  - `ui/` - Shadcn-style Radix UI components
  - `app-header.tsx`, `app-sidebar.tsx` - Shell components
  - `two-factor-*.tsx` - 2FA components

**Utilities:**
- `resources/js/hooks/` - Custom React hooks
- `resources/js/lib/` - Utility functions
- `resources/js/types/` - TypeScript type definitions
- `resources/js/routes/` - Type-safe route helpers (Wayfinder)
- `resources/js/actions/` - Server actions
- `resources/js/wayfinder/` - Wayfinder generated files

### Key Patterns

**Inertia.js:**
- Pages are React components that receive props from Laravel controllers
- Use `@inertiajs/react` hooks: `useForm`, `usePage`, `router`
- Forms use Inertia's form helpers for validation and error handling

**Type-safe routing:**
- Use Wayfinder for type-safe route generation
- Configured in `vite.config.ts` with `formVariants: true`

**Theming:**
- Theme preference stored in `appearance` cookie
- `initializeTheme()` called on app load
- `use-appearance` hook for theme management

**Authentication:**
- Laravel Fortify handles auth logic
- Two-factor authentication supported
- Email verification enabled

## Database

**Migrations:** `database/migrations/`
- User tables with 2FA columns
- Cache and jobs tables

**Default connection:** MySQL via Sail
- Host: `mysql` (Docker service name)
- Database: `laravel`
- User: `sail`
- Password: `password`

## Build & Deployment

**Development:**
```bash
npm run dev
```

**Production build:**
```bash
npm run build
```

**SSR build:**
```bash
npm run build:ssr
```

**SSR server:**
```bash
./vendor/bin/sail artisan inertia:start-ssr
```

## Core Features

**Log Formatting:**
- Main route: `/` (FormatterPage)
- POST `/format` endpoint processes raw logs
- LogFormatterService with Prism SDK v2
- Multiple LLM providers:
  - DeepSeek (deepseek-chat) - default
  - Google Gemini (gemini-2.5-flash)
  - Moonshot AI (kimi-k2-turbo-preview) via OpenRouter
  - ZhipuAI (GLM-4.5-Air, GLM-4.6) via OpenRouter
- Structured output: detected_log_type, summary, entities, metrics, sections
- Database persistence in `formatted_logs` table
- Comprehensive logging system with request timing
- Retry logic with exponential backoff (3 attempts)
- Schema validation and user preferences support

**Authentication:**
- Laravel Fortify with 2FA support
- Email verification required
- Recovery codes for 2FA
- Settings pages for profile, password, 2FA, appearance

## Documentation

**Project Documentation:**
- `README.md` - Project overview, installation, usage guide
- `docs/architecture-overview.md` - Comprehensive system architecture
- `docs/llm-providers.md` - LLM provider configuration and comparison
- `docs/logging-and-debugging.md` - Logging system and debugging guide
- `docs/history-feature.md` - History management system documentation
- `docs/StructLogr_Implementation_Plan.md` - Development phases (COMPLETED)
- `docs/UI_UX_Improvements.md` - Design system and component guide
- `docs/CHANGELOG.md` - Version history and updates
- `CLAUDE.md` - This file (AI assistant instructions)
- `AGENTS.md` - Multi-agent system coordination

## Debugging & Logging

**Viewing Logs:**
```bash
./vendor/bin/sail exec laravel.test tail -f storage/logs/laravel.log
```

**Filter for formatter service:**
```bash
./vendor/bin/sail exec laravel.test tail -f storage/logs/laravel.log | grep "LogFormatterService"
```

**Check request duration:**
```bash
grep "duration_ms" storage/logs/laravel.log | tail -20
```

**Log Levels:**
- Use `LOG_LEVEL=debug` in development for comprehensive logging
- Use `LOG_LEVEL=info` in production to reduce log volume
- LogFormatterService logs at all stages: info, debug, warning, error, critical

**Common Issues:**
- Empty API response → Check API key, provider status
- Validation failures → Review schema conversion for provider
- Timeout errors → Increase HTTP_TIMEOUT in .env
- Max retries exceeded → Check provider status, switch providers

**See**: `docs/logging-and-debugging.md` for comprehensive debugging guide

## LLM Provider Selection

**Available Models:**
- `deepseek-chat` - Fast, cost-effective (default)
- `gemini-2.5-flash` - Very fast, Google Gemini
- `kimi-k2-turbo-preview` - Large context, via OpenRouter
- `GLM-4.5-Air` - Free tier, via OpenRouter
- `GLM-4.6` - High accuracy, via OpenRouter

**Configuration:**
```env
# Choose provider API keys as needed
DEEPSEEK_API_KEY=sk-xxx
GEMINI_API_KEY=AIza-xxx
OPENROUTER_API_KEY=sk-or-xxx

# HTTP timeouts
HTTP_TIMEOUT=600
HTTP_CONNECT_TIMEOUT=60
```

**See**: `docs/llm-providers.md` for detailed provider comparison and configuration
