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

## Implementation Plan

Refer to `docs/StructLogr_Implementation_Plan.md` for the detailed development plan including:
- Log formatting service architecture
- Prism package integration
- Database schema for formatted logs
- Frontend form implementation
