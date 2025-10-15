# Technical Constraints

This document outlines the technical constraints, limitations, and mandatory requirements for implementing UI/UX improvements in StructLogr. These constraints must be respected during planning and implementation.

---

## Technology Stack (Fixed)

These technology choices are **already made** and **cannot be changed**:

### Backend
- **PHP**: 8.2+
- **Laravel**: 12.x
- **Database**: MySQL 8.0
- **Authentication**: Laravel Fortify (with 2FA support)
- **LLM Integration**: Prism PHP package
- **Default LLM Provider**: DeepSeek (configurable)

### Frontend
- **UI Library**: React 19.x
- **Language**: TypeScript 5.7+
- **SPA Framework**: Inertia.js 2.0
- **Styling**: Tailwind CSS 4.0
- **Component Library**: Radix UI (unstyled primitives)
- **Icons**: Lucide React
- **Build Tool**: Vite 7.x

### Development Environment
- **Docker**: Laravel Sail for local development
- **Code Quality**: ESLint, Prettier, Laravel Pint

---

## Architecture Constraints

### Inertia.js Requirements

**MUST follow Inertia patterns:**
- All pages must be React components in `resources/js/pages/`
- Server-side routing with Laravel controllers
- Use `useForm` hook for form submissions
- Use `router` for navigation
- Props passed from Laravel controllers to React pages
- No client-side routing (React Router, etc.)

**Shared Data Pattern:**
```php
// Backend: app/Http/Middleware/HandleInertiaRequests.php
'auth' => ['user' => $request->user()],
'flash' => ['message' => session('message')]
```

**Form Submission Pattern:**
```typescript
const { data, setData, post, processing, errors } = useForm({
    raw_log: '',
});
post('/format'); // Inertia handles this
```

### Laravel Wayfinder (Type-Safe Routing)

**MUST use Wayfinder for all route references:**
```typescript
import { login, register, formatter } from '@/routes';
<Link href={login()}>Log in</Link>
```

**DO NOT use string paths:**
```typescript
// ❌ Wrong
<Link href="/login">Log in</Link>

// ✅ Correct
<Link href={login()}>Log in</Link>
```

### Component Organization

**MUST follow existing structure:**
```
resources/js/
├── components/
│   ├── ui/              # Radix UI wrapper components (reusable)
│   ├── formatter/       # Feature-specific components
│   └── [shared].tsx     # App-wide components (header, footer, etc.)
├── layouts/             # Page layouts (app-layout, auth-layout)
├── pages/               # Inertia pages (entry points)
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── data/                # Static data (examples, tips, etc.)
```

**Component Naming Convention:**
- PascalCase for components: `HeroSection.tsx`
- kebab-case for files in special cases: `use-clipboard.ts` (hooks)
- Export named components: `export function HeroSection() {}`

---

## What CANNOT Be Changed

### 1. Authentication System
- Laravel Fortify handles all auth logic
- Two-factor authentication (TOTP) is built-in
- Email verification is required
- **DO NOT** introduce custom auth flows
- **DO NOT** bypass Fortify middleware

### 2. Database Schema
- `users` table structure is fixed
- `formatted_logs` table structure is fixed
- **DO NOT** add columns without approval
- **CAN** add new tables for new features (history, preferences stored in localStorage instead)

### 3. API Structure
- Main endpoint: `POST /format` via `LogFormatterController`
- Authentication routes managed by Fortify
- **DO NOT** change existing endpoint signatures
- **CAN** add new endpoints for new features

### 4. Existing Components
**MUST reuse these components (already built):**
- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/input.tsx`
- `components/ui/textarea.tsx`
- `components/ui/label.tsx`
- `components/ui/dialog.tsx`
- `components/ui/dropdown-menu.tsx`
- `components/ui/sheet.tsx`
- `components/ui/tooltip.tsx`
- `components/ui/badge.tsx`
- `components/ui/separator.tsx`
- `components/ui/spinner.tsx`
- `components/ui/skeleton.tsx`
- `components/app-header.tsx`
- `components/app-sidebar.tsx`
- `components/app-logo.tsx`
- `hooks/use-appearance.tsx` (theme management)
- `hooks/use-clipboard.ts` (clipboard operations)
- `hooks/use-mobile.tsx` (mobile detection)

**DO NOT** create custom implementations of these.

### 5. Theme System
- Dark/light mode already implemented via `use-appearance` hook
- Theme preference stored in cookie via `HandleAppearance` middleware
- **MUST** support both light and dark variants for all new components
- **MUST** use Tailwind `dark:` prefix for dark mode styles

### 6. Styling Approach
- **MUST** use Tailwind utility classes
- **MUST NOT** write custom CSS except for:
  - Complex animations (keyframes in tailwind.config.js)
  - Global styles (resources/css/app.css)
- **MUST NOT** use CSS-in-JS libraries (styled-components, emotion, etc.)
- **MUST NOT** use inline styles except for dynamic computed values

---

## Performance Requirements

### Bundle Size
- Initial JavaScript bundle: Target <300KB (gzipped)
- Code splitting: Use React.lazy for route-based splitting
- Tree shaking: Ensure proper imports (no barrel exports for large libraries)

### Load Time
- First Contentful Paint (FCP): <1.5s
- Time to Interactive (TTI): <3.5s on 3G
- Use lazy loading for images and heavy components

### Runtime Performance
- Avoid expensive re-renders: Use React.memo, useMemo, useCallback appropriately
- Debounce user input handlers (search, validation)
- Throttle scroll listeners
- Limit localStorage usage (<5MB total)

---

## Browser Support

### Required Support
- **Chrome**: Last 2 versions
- **Firefox**: Last 2 versions
- **Safari**: Last 2 versions (including iOS Safari)
- **Edge**: Last 2 versions

### Not Required
- Internet Explorer (any version)
- Opera, Brave, etc. (nice to have, not required)

### Progressive Enhancement
- Core functionality must work without JavaScript
- Form submission should work with JavaScript disabled (fallback to traditional POST)

---

## Accessibility Requirements

### WCAG 2.1 Level AA Compliance

**Mandatory:**
- Color contrast ratio: 4.5:1 for normal text, 3:1 for large text
- Keyboard navigation for all interactive elements
- Proper heading hierarchy (H1 → H2 → H3, no skipping)
- ARIA labels on interactive elements without text labels
- Focus indicators on all focusable elements
- Alt text on informative images, empty alt on decorative images
- Form labels associated with inputs
- Error messages announced to screen readers (aria-live regions)

**Testing:**
- Must work with keyboard only (no mouse)
- Must work with screen reader (test with NVDA or VoiceOver)

---

## Code Quality Standards

### TypeScript
- **MUST** use TypeScript for all new React code
- **MUST NOT** use `any` type (use `unknown` if necessary)
- **MUST** define interfaces for component props
- **MUST** define types for hook return values
- Use strict mode (already enabled in tsconfig.json)

### React Patterns
- **MUST** use function components (no class components)
- **MUST** use hooks for state and side effects
- **PREFER** custom hooks for reusable logic
- **AVOID** prop drilling (use context for deeply nested props)
- **MUST** handle loading and error states in components

### File Organization
- One component per file
- Co-locate related files (component + styles + types in same directory if large)
- Export only what's needed (avoid default exports)

---

## Breaking Changes NOT Allowed

These changes would break existing functionality and are **prohibited**:

1. **DO NOT** change FormatterPage.tsx form submission behavior
2. **DO NOT** modify Inertia shared data structure without backend coordination
3. **DO NOT** change authentication flow (login, register, 2FA, email verification)
4. **DO NOT** remove or rename existing routes without backend coordination
5. **DO NOT** change localStorage keys used by existing features
6. **DO NOT** modify cookie names (appearance, sidebar_state)
7. **DO NOT** change the structure of formatted_logs JSON output from backend

---

## Third-Party Library Constraints

### Adding New Dependencies

**Allowed without approval:**
- Radix UI components (already approved library)
- Lucide React icons (already in use)
- React utility hooks (react-use, usehooks-ts)
- Date manipulation (date-fns, dayjs - prefer date-fns)
- Small utility libraries (<5KB)

**Requires approval:**
- Large UI libraries (Material-UI, Ant Design, etc.)
- Animation libraries (Framer Motion, React Spring)
- State management libraries (Redux, Zustand, MobX)
- Form libraries (React Hook Form, Formik)
- Any library >50KB

**Prohibited:**
- jQuery or any legacy libraries
- Bootstrap or other CSS frameworks (we use Tailwind)
- Moment.js (deprecated, use date-fns instead)
- Lodash (use native JS or lodash-es for tree-shaking)

---

## Security Constraints

### XSS Prevention
- React handles escaping by default (JSX)
- **NEVER** use `dangerouslySetInnerHTML` without sanitization
- **NEVER** use `eval()` or `Function()` constructor

### CSRF Protection
- Laravel handles CSRF automatically for POST requests
- Inertia includes CSRF token automatically
- **DO NOT** bypass CSRF middleware

### Data Handling
- **NEVER** log sensitive data (passwords, API keys, PII)
- **NEVER** store sensitive data in localStorage (use secure cookies)
- **MUST** sanitize user input before displaying
- **MUST** validate file uploads (type, size)

### API Keys
- **NEVER** expose API keys in client-side code
- **MUST** use environment variables for secrets
- Backend handles all LLM API calls (Prism integration)

---

## State Management Constraints

### Where to Store State

**Component State (useState):**
- UI state (open/closed, active tab, hover state)
- Temporary form data
- Local component state

**Inertia Shared Data (from backend):**
- Authentication state (user, permissions)
- Flash messages (success, error)
- Global app state from server

**localStorage:**
- User preferences (theme, sidebar state, formatting options)
- History of formatted logs (limit: 20 entries)
- Non-sensitive cached data
- **DO NOT** store: passwords, tokens, PII

**sessionStorage:**
- Temporary state across page refreshes
- Selected tab in multi-tab interfaces
- Scroll positions

**Cookies:**
- Theme preference (via HandleAppearance middleware)
- Session authentication (via Laravel)

**DO NOT introduce:**
- Redux, Zustand, MobX (unnecessary with Inertia)
- React Context for global state (use Inertia shared data)

---

## Testing Constraints

### Manual Testing Required
- Test all breakpoints: 320px (mobile), 768px (tablet), 1024px (desktop), 1920px (large desktop)
- Test both light and dark modes
- Test keyboard navigation (tab through all interactive elements)
- Test with browser DevTools accessibility audit

### Browser DevTools
- No console errors or warnings in production build
- No 404 errors for assets
- No CORS errors

### Performance Testing
- Lighthouse audit: Aim for >90 in all categories
- Check bundle size: `npm run build` and review output

---

## Deployment Constraints

### Production Builds
- **MUST** run `npm run build` before deployment
- **MUST** run `npm run types` (TypeScript check) without errors
- **SHOULD** run `npm run lint` and fix errors

### Environment Variables
- All environment-specific config in `.env`
- **NEVER** commit `.env` to git
- Use `.env.example` for reference

### Laravel Optimization
- Run artisan optimize commands in production:
  - `php artisan config:cache`
  - `php artisan route:cache`
  - `php artisan view:cache`

---

## Summary

**Key Takeaways for Developers:**

1. **Use Inertia patterns** - no client-side routing, use Inertia forms
2. **Use Wayfinder** - type-safe routes, no string paths
3. **Use Tailwind** - utility classes, no custom CSS frameworks
4. **Use Radix UI** - for complex components (modals, dropdowns, etc.)
5. **Use TypeScript** - properly typed props and hooks
6. **Respect existing structure** - follow component organization
7. **Support dark mode** - all components must have light/dark variants
8. **Maintain accessibility** - WCAG AA compliance required
9. **Reuse existing components** - don't reinvent the wheel
10. **Test across devices** - mobile-first, responsive design

**When in doubt:**
- Check existing components for patterns
- Refer to architecture-overview.md
- Ask before introducing new dependencies
- Prefer simplicity over complexity
