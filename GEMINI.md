# StructLogr

StructLogr is a modern web application designed to transform raw, unstructured log text into structured, actionable JSON format using AI-powered parsing. It leverages Large Language Models (LLMs) to intelligently analyze and categorize log data, making debugging and analysis significantly faster for developers.

## Project Overview

- **Core Functionality**: Converts raw logs (e.g., test results, application errors, HTTP logs) into structured JSON.
- **Backend**: Laravel 12.x, PHP 8.2+.
- **Frontend**: React 19.x, TypeScript 5.7+, Inertia.js 2.0.
- **Styling**: Tailwind CSS 4.0, Radix UI (for accessible components), Lucide React (icons).
- **AI Integration**: [Prism PHP](https://github.com/prism-php/prism) package for seamless LLM integration.
- **Supported LLMs**: DeepSeek (default), Google Gemini 2.5 Flash, Moonshot AI (Kimi K2), and ZhipuAI (GLM-4.5/4.6) via OpenRouter.
- **Authentication**: Laravel Fortify with Email/Password, Two-Factor Authentication (2FA), and session-based persistence.
- **Persistence**: MySQL 8.0 for data storage, SQLite in-memory for testing.

## Building and Running

### Prerequisites
- Docker & Docker Compose (for Laravel Sail)
- Node.js 18+ and npm
- Composer 2.x

### Development Setup (using Sail)
1. **Install Dependencies**:
   ```bash
   composer install
   npm install
   ```
2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   # Update .env with your LLM API keys (e.g., DEEPSEEK_API_KEY)
   ```
3. **Initialize Application**:
   ```bash
   php artisan key:generate
   ./vendor/bin/sail up -d
   ./vendor/bin/sail artisan migrate
   ```
4. **Start Vite**:
   ```bash
   npm run dev
   ```

### Key Commands
- **Start Sail**: `./vendor/bin/sail up -d`
- **Stop Sail**: `./vendor/bin/sail down`
- **PHP Tests**: `php artisan sail --args=pest` (or `./vendor/bin/pest` for local SQLite tests)
- **Linting (PHP)**: `./vendor/bin/sail composer pint`
- **Linting (JS/TS)**: `npm run lint`
- **Formatting (JS/TS)**: `npm run format`
- **Production Build**: `npm run build`

## Development Conventions

### Backend (Laravel)
- **Architecture**: Service-oriented architecture. Core logic resides in `app/Services/` (e.g., `LogFormatterService`, `HistoryService`).
- **Code Style**: Adheres to Laravel coding standards, enforced by Laravel Pint.
- **Routing**: Uses traditional Laravel routes (`routes/web.php`, `routes/auth.php`) integrated with [Laravel Wayfinder](https://github.com/laravel/wayfinder) for type-safe routing in TypeScript.
- **Authentication**: Managed via Laravel Fortify. UI components for auth are in `resources/js/pages/auth`.

### Frontend (React/Inertia)
- **Components**: UI primitives are built with Radix UI and located in `resources/js/components/ui`. Feature-specific components are in subdirectories (e.g., `formatter/`, `search/`).
- **State Management**: Uses React hooks (`useState`, `useEffect`) and custom hooks in `resources/js/hooks/` for complex logic (e.g., `use-history`, `use-settings`).
- **Styling**: Tailwind CSS 4.0 with Radix UI primitives.
- **Type Safety**: Strictly typed with TypeScript. All API responses and Inertia props should be defined in `resources/js/types/`.

### Testing
- **Framework**: [Pest PHP](https://pestphp.com/).
- **Database**: Uses SQLite in-memory database for feature and unit tests.
- **Configuration**: Managed in `.env.testing` and `phpunit.xml`.
- **Convention**: All feature tests should use the `RefreshDatabase` trait (though often inherited from `Tests\TestCase`).

### AI Parsing Logic
- **Schema**: Defined in `LogFormatterService::getSchema()` using Prism's schema builders.
- **Prompting**: System prompts are generated in `LogFormatterService::getSystemPrompt()`.
- **Retries**: The formatting process includes a configurable retry mechanism with exponential backoff to handle transient LLM API failures.
