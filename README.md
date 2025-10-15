# StructLogr

A modern web application for transforming raw log text into structured JSON format using AI-powered parsing. Built with Laravel, React, and the Prism PHP package for intelligent log analysis.

## Features

- **AI-Powered Log Parsing**: Convert unstructured log text into structured JSON using LLM technology
- **Multiple LLM Providers**: Support for OpenAI, Anthropic, DeepSeek, Mistral, Groq, and more via Prism
- **Modern Tech Stack**: Laravel 12 backend with React 19 + Inertia.js 2.0 frontend
- **Full Authentication System**: Email/password authentication with two-factor support via Laravel Fortify
- **Persistent Storage**: All formatted logs are saved to MySQL database
- **Type-Safe Routing**: Laravel Wayfinder integration for type-safe routes in TypeScript
- **Dark Mode**: Built-in theme switching with user preferences
- **Responsive UI**: Tailwind CSS 4.0 + Radix UI components

## Technology Stack

### Backend
- **PHP**: 8.2+
- **Laravel**: 12.x
- **Prism**: AI/LLM integration package
- **Laravel Fortify**: Authentication system
- **MySQL**: 8.0

### Frontend
- **React**: 19.x
- **TypeScript**: 5.7+
- **Inertia.js**: 2.0
- **Tailwind CSS**: 4.0
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Vite**: 7.x build tool

### Development Tools
- **Laravel Sail**: Docker-based development environment
- **Laravel Pint**: PHP code style fixer
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **GitHub Actions**: CI/CD workflows

## Prerequisites

- **Docker & Docker Compose** (for Sail)
- **Node.js**: 18+ and npm
- **Composer**: 2.x

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd structlogr
```

### 2. Install PHP Dependencies

```bash
composer install
```

### 3. Install Node Dependencies

```bash
npm install
```

### 4. Environment Setup

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
# Database (Sail defaults)
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=sail
DB_PASSWORD=password

# LLM Provider (choose one or configure multiple)
DEEPSEEK_API_KEY=your_deepseek_api_key
# OPENAI_API_KEY=your_openai_api_key
# ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 5. Generate Application Key

```bash
php artisan key:generate
```

### 6. Start Development Environment

Using Laravel Sail:

```bash
./vendor/bin/sail up -d
```

### 7. Run Database Migrations

```bash
./vendor/bin/sail artisan migrate
```

### 8. Start Vite Development Server

In a separate terminal:

```bash
npm run dev
```

The application will be available at **http://localhost:8001**

## Usage

### Basic Log Formatting

1. Navigate to the home page at `http://localhost:8001`
2. Paste your raw log text into the textarea
3. Click "Format Log" to process
4. View the structured JSON output below the form

Example input:
```
2024-10-15 14:23:45 [ERROR] Database connection failed - timeout after 30s
```

Example output:
```json
{
  "detected_log_type": "application_error",
  "summary": {
    "status": "ERROR",
    "headline": "Database connection failed after timing out at 30s",
    "primary_subject": "Database",
    "key_points": [
      "Connection attempt exceeded 30s timeout",
      "Severity recorded as ERROR level"
    ],
    "duration": "30s",
    "timestamp": "2024-10-15 14:23:45"
  },
  "entities": [
    {
      "type": "service",
      "identifier": "Database"
    }
  ],
  "metrics": [
    {
      "name": "timeout_seconds",
      "value": 30,
      "unit": "seconds",
      "description": "Declared timeout before the connection aborted"
    }
  ],
  "sections": [
    {
      "section_type": "errors",
      "title": "Error Events",
      "items": [
        {
          "name": "Database connection failed",
          "status": "ERROR",
          "details": {
            "message": "Database connection failed - timeout after 30s"
          }
        }
      ]
    }
  ]
}
```

### Authentication Features

- **Register**: Create a new account at `/register`
- **Login**: Sign in at `/login`
- **Two-Factor Authentication**: Enable 2FA in settings for enhanced security
- **Email Verification**: Verify your email address after registration
- **Password Reset**: Request password reset at `/forgot-password`

### User Settings

Authenticated users can manage:
- Profile information
- Password changes
- Two-factor authentication
- Theme preferences (light/dark mode)

## Development

### Available Commands

**Backend:**
```bash
./vendor/bin/sail artisan migrate        # Run migrations
./vendor/bin/sail artisan tinker         # Laravel REPL
./vendor/bin/sail artisan test           # Run PHPUnit tests
./vendor/bin/sail composer pint          # Fix PHP code style
```

**Frontend:**
```bash
npm run dev              # Start Vite dev server
npm run build            # Production build
npm run build:ssr        # SSR build
npm run lint             # ESLint with auto-fix
npm run format           # Prettier format
npm run format:check     # Prettier check only
npm run types            # TypeScript type checking
```

**Docker:**
```bash
./vendor/bin/sail up -d      # Start containers
./vendor/bin/sail down       # Stop containers
./vendor/bin/sail shell      # Access app container
./vendor/bin/sail mysql      # Access MySQL container
```

### Project Structure

```
structlogr/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/              # Authentication controllers
│   │   │   ├── Settings/          # User settings controllers
│   │   │   └── LogFormatterController.php
│   │   ├── Middleware/
│   │   └── Requests/
│   ├── Models/
│   │   ├── FormattedLog.php       # Formatted log model
│   │   └── User.php
│   ├── Providers/
│   └── Services/
│       └── LogFormatterService.php # Prism integration service
├── config/
│   ├── prism.php                   # Prism LLM configuration
│   ├── fortify.php                 # Auth configuration
│   └── inertia.php                 # Inertia.js configuration
├── database/
│   └── migrations/
├── resources/
│   ├── css/
│   │   └── app.css
│   └── js/
│       ├── actions/                # Wayfinder actions
│       ├── components/             # React components
│       │   ├── ui/                 # Radix UI components
│       │   └── ...
│       ├── hooks/                  # Custom React hooks
│       ├── layouts/                # Page layouts
│       ├── pages/                  # Inertia pages
│       │   ├── auth/               # Authentication pages
│       │   ├── settings/           # Settings pages
│       │   ├── FormatterPage.tsx   # Log formatter page
│       │   └── dashboard.tsx
│       ├── routes/                 # Wayfinder route helpers
│       └── types/                  # TypeScript types
├── routes/
│   ├── auth.php                    # Auth routes
│   ├── settings.php                # Settings routes
│   └── web.php                     # Main web routes
├── tests/
│   ├── Feature/
│   └── Unit/
└── docs/                           # Documentation
```

### Code Quality

The project enforces code quality through:

- **PHP**: Laravel Pint (PHP CS Fixer) configured for Laravel style
- **JavaScript/TypeScript**: ESLint with React and TypeScript rules
- **Formatting**: Prettier with Tailwind CSS plugin
- **Type Safety**: Full TypeScript coverage on frontend
- **CI/CD**: GitHub Actions for automated linting and testing

### Testing

Run the test suite:

```bash
./vendor/bin/sail artisan test
```

Run with coverage:

```bash
./vendor/bin/sail artisan test --coverage
```

## Configuration

### Prism LLM Providers

Configure your preferred LLM provider in `.env`:

**DeepSeek** (default):
```env
DEEPSEEK_API_KEY=your_key
DEEPSEEK_URL=https://api.deepseek.com/v1
```

**OpenAI**:
```env
OPENAI_API_KEY=your_key
OPENAI_URL=https://api.openai.com/v1
```

**Anthropic**:
```env
ANTHROPIC_API_KEY=your_key
ANTHROPIC_API_VERSION=2023-06-01
```

See `config/prism.php` for all supported providers.

### Port Configuration

Default ports (configurable in `compose.yaml`):
- **App**: 8001
- **MySQL**: 3308 (host) → 3306 (container)
- **Vite HMR**: 5175

## Production Deployment

### Build Assets

```bash
npm run build
```

### Optimize Laravel

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Environment Variables

Ensure production environment variables are set:
- Database credentials
- LLM API keys
- `APP_ENV=production`
- `APP_DEBUG=false`
- Configure mail settings for email verification

## Documentation

- **[Implementation Plan](docs/StructLogr_Implementation_Plan.md)**: Development phases and roadmap
- **[Architecture Overview](docs/architecture-overview.md)**: Detailed system architecture
- **[UI/UX Improvements](docs/UI_UX_Improvements.md)**: Design system and component guide
- **[CHANGELOG](docs/CHANGELOG.md)**: Version history and updates
- **[CLAUDE.md](CLAUDE.md)**: Instructions for Claude Code assistant

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linters
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is open-sourced software licensed under the [MIT license](LICENSE).

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Powered by Laravel + React + Prism**
