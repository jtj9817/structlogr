# Settings Backend Implementation Plan

## Overview

This document outlines the implementation plan for adding server-side persistence to user preferences. Currently, all settings are stored in localStorage only. This plan adds database persistence, API endpoints, and backend integration.

---

## Phase 1: Database Schema

### GOAL
Add database column to store user preferences as JSON in the users table.

### CONTEXT
Currently, user preferences exist only in the frontend via localStorage (resources/js/hooks/use-settings.ts). We need persistent storage tied to user accounts so preferences sync across devices and sessions.

### TASK
Create a migration to add a `preferences` JSON column to the `users` table with proper defaults.

### REQUIREMENTS

**Migration File**: `database/migrations/YYYY_MM_DD_HHMMSS_add_preferences_to_users_table.php`

Create migration with:
- Add `preferences` column as JSON type
- Set nullable to true initially (for existing users)
- Add default value as empty JSON object `{}`

**Migration Structure**:
```php
public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->json('preferences')->nullable()->after('remember_token');
    });
}

public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn('preferences');
    });
}
```

### GUIDELINES

- Place the new column after `remember_token` for logical ordering
- Use `json()` type for native MySQL 8.0 JSON support
- Keep nullable for backward compatibility with existing users
- Run migration: `./vendor/bin/sail artisan migrate`
- Verify column creation: `./vendor/bin/sail mysql` then `DESCRIBE users;`

---

## Phase 2: Model Layer

### GOAL
Update the User model to handle preferences with proper casting and default values.

### CONTEXT
Laravel Eloquent models need explicit casting for JSON columns. The User model must define how preferences are accessed and mutated. Default preferences should match the frontend defaults in use-settings.ts.

### TASK
Modify `app/Models/User.php` to add preferences support with proper casting and accessor/mutator methods.

### REQUIREMENTS

**File**: `app/Models/User.php`

**Changes**:

1. Add `preferences` to `$fillable` array:
```php
protected $fillable = [
    'name',
    'email',
    'password',
    'preferences',
];
```

2. Add `preferences` to `$casts` array:
```php
protected $casts = [
    'email_verified_at' => 'datetime',
    'password' => 'hashed',
    'two_factor_confirmed_at' => 'datetime',
    'preferences' => 'array',
];
```

3. Add accessor for preferences with defaults:
```php
public function getPreferencesAttribute($value): array
{
    $defaults = [
        'outputFormat' => 'json',
        'jsonIndentation' => 2,
        'autoCopyResults' => false,
        'showLineNumbers' => true,
        'saveToHistory' => true,
        'avoidSensitiveStorage' => false,
        'fontSize' => 'medium',
    ];

    if (is_null($value) || $value === '') {
        return $defaults;
    }

    $preferences = is_string($value) ? json_decode($value, true) : $value;

    return array_merge($defaults, $preferences ?? []);
}
```

4. Add mutator to ensure proper JSON encoding:
```php
public function setPreferencesAttribute($value): void
{
    $this->attributes['preferences'] = is_array($value) 
        ? json_encode($value) 
        : $value;
}
```

### GUIDELINES

- Default values must match frontend defaults in `resources/js/hooks/use-settings.ts`
- The accessor ensures existing users without preferences get sensible defaults
- The mutator handles both array and JSON string inputs
- Type hints ensure type safety
- The `array` cast in `$casts` handles automatic JSON encoding/decoding for normal usage
- The custom accessor only applies when the value is null or empty

---

## Phase 3: Controller & Validation

### GOAL
Create a controller to handle fetching and updating user preferences with proper validation.

### CONTEXT
We need endpoints for the frontend to read and write preferences. The controller should validate incoming data and handle business logic.

### TASK
Create `app/Http/Controllers/Settings/PreferencesController.php` with show and update methods.

### REQUIREMENTS

**File**: `app/Http/Controllers/Settings/PreferencesController.php`

**Controller Structure**:

```php
<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class PreferencesController extends Controller
{
    public function show()
    {
        $user = Auth::user();
        
        return response()->json([
            'preferences' => $user->preferences,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'preferences' => 'required|array',
            'preferences.outputFormat' => [
                'sometimes',
                'string',
                Rule::in(['json', 'table', 'cards']),
            ],
            'preferences.jsonIndentation' => [
                'sometimes',
                Rule::in([2, 4, 'tab']),
            ],
            'preferences.autoCopyResults' => 'sometimes|boolean',
            'preferences.showLineNumbers' => 'sometimes|boolean',
            'preferences.saveToHistory' => 'sometimes|boolean',
            'preferences.avoidSensitiveStorage' => 'sometimes|boolean',
            'preferences.fontSize' => [
                'sometimes',
                'string',
                Rule::in(['small', 'medium', 'large']),
            ],
        ]);

        $user = Auth::user();
        
        $currentPreferences = $user->preferences;
        $updatedPreferences = array_merge($currentPreferences, $validated['preferences']);
        
        $user->preferences = $updatedPreferences;
        $user->save();

        return response()->json([
            'message' => 'Preferences updated successfully',
            'preferences' => $user->preferences,
        ]);
    }
}
```

### GUIDELINES

- Use `Auth::user()` to get the authenticated user
- The `show()` method returns current preferences (uses model accessor for defaults)
- The `update()` method merges new preferences with existing ones
- Validation rules ensure data integrity:
  - `outputFormat`: only json, table, or cards
  - `jsonIndentation`: only 2, 4, or 'tab'
  - Boolean fields: only true/false
  - `fontSize`: only small, medium, or large
- Use `sometimes` validation for optional fields
- Return updated preferences in response for frontend sync
- Controller is in Settings namespace for logical organization

---

## Phase 4: Routes

### GOAL
Add API routes for preferences endpoints.

### CONTEXT
Laravel needs route definitions for the controller methods. Routes should be in the settings route file, protected by auth middleware.

### TASK
Add preferences routes to `routes/settings.php`.

### REQUIREMENTS

**File**: `routes/settings.php`

**Add Routes**:

```php
use App\Http\Controllers\Settings\PreferencesController;

Route::middleware(['auth', 'verified'])->prefix('settings')->name('settings.')->group(function () {
    // Existing routes...
    
    // Preferences
    Route::get('/preferences', [PreferencesController::class, 'show'])->name('preferences.show');
    Route::patch('/preferences', [PreferencesController::class, 'update'])->name('preferences.update');
});
```

### GUIDELINES

- Add routes after existing settings routes for consistency
- Use `auth` and `verified` middleware to protect routes
- Use RESTful conventions: GET for show, PATCH for update
- Use `/settings/preferences` path to match other settings routes
- Named routes enable type-safe routing with Wayfinder
- After adding routes, run: `./vendor/bin/sail artisan route:list | grep preferences`

---

## Phase 5: Inertia Shared Data

### GOAL
Share user preferences with all Inertia pages via middleware.

### CONTEXT
Inertia's `HandleInertiaRequests` middleware shares global data with all pages. This eliminates the need for separate API calls to fetch preferences on page load.

### TASK
Update `app/Http/Middleware/HandleInertiaRequests.php` to include user preferences in shared data.

### REQUIREMENTS

**File**: `app/Http/Middleware/HandleInertiaRequests.php`

**Modify `share()` method**:

```php
public function share(Request $request): array
{
    return [
        ...parent::share($request),
        'auth' => [
            'user' => $request->user() ? [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'email_verified_at' => $request->user()->email_verified_at,
                'preferences' => $request->user()->preferences,
            ] : null,
        ],
        'flash' => [
            'message' => fn () => $request->session()->get('message'),
            'error' => fn () => $request->session()->get('error'),
        ],
    ];
}
```

### GUIDELINES

- Add `preferences` to the user object in shared auth data
- This makes preferences available on all pages via `usePage().props.auth.user.preferences`
- Use the model accessor to ensure defaults are included
- Only share preferences when user is authenticated
- The middleware runs on every Inertia request automatically

---

## Phase 6: TypeScript Types

### GOAL
Add TypeScript type definitions for user preferences.

### CONTEXT
TypeScript needs proper types for the preferences structure. Types should be defined in `resources/js/types/index.d.ts` for consistency with existing User type.

### TASK
Update `resources/js/types/index.d.ts` to include preferences in User type.

### REQUIREMENTS

**File**: `resources/js/types/index.d.ts`

**Add UserPreferences type**:

```typescript
export interface UserPreferences {
    outputFormat: 'json' | 'table' | 'cards';
    jsonIndentation: 2 | 4 | 'tab';
    autoCopyResults: boolean;
    showLineNumbers: boolean;
    saveToHistory: boolean;
    avoidSensitiveStorage: boolean;
    fontSize: 'small' | 'medium' | 'large';
}
```

**Update User interface**:

```typescript
export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    preferences: UserPreferences;
}
```

### GUIDELINES

- Define strict types for all preference fields
- Use union types for enum-like values (outputFormat, fontSize, etc.)
- Add preferences to User interface so TypeScript knows it exists
- This provides autocomplete and type checking throughout the app
- Keep types in sync with backend validation rules

---

## Phase 7: Frontend Hook Update

### GOAL
Update the `use-settings` hook to read from and write to the backend instead of localStorage.

### CONTEXT
Currently `resources/js/hooks/use-settings.ts` uses localStorage for all persistence. We need to switch to backend API calls while maintaining the same hook API.

### TASK
Refactor `use-settings.ts` to fetch initial settings from Inertia shared data and save updates to the backend.

### REQUIREMENTS

**File**: `resources/js/hooks/use-settings.ts`

**Complete Rewrite**:

```typescript
import { router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import type { UserPreferences } from '@/types';

const DEFAULT_SETTINGS: UserPreferences = {
    outputFormat: 'json',
    jsonIndentation: 2,
    autoCopyResults: false,
    showLineNumbers: true,
    saveToHistory: true,
    avoidSensitiveStorage: false,
    fontSize: 'medium',
};

export function useSettings() {
    const { auth } = usePage<{ auth: { user: { preferences: UserPreferences } | null } }>().props;
    
    const [settings, setSettings] = useState<UserPreferences>(() => {
        if (auth.user?.preferences) {
            return auth.user.preferences;
        }
        
        const stored = localStorage.getItem('settings');
        if (stored) {
            try {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
            } catch {
                return DEFAULT_SETTINGS;
            }
        }
        
        return DEFAULT_SETTINGS;
    });

    const updateSetting = <K extends keyof UserPreferences>(
        key: K,
        value: UserPreferences[K]
    ) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        
        if (auth.user) {
            router.patch('/settings/preferences', {
                preferences: newSettings,
            }, {
                preserveState: true,
                preserveScroll: true,
                only: ['auth'],
            });
        } else {
            localStorage.setItem('settings', JSON.stringify(newSettings));
        }
    };

    const resetSettings = () => {
        setSettings(DEFAULT_SETTINGS);
        
        if (auth.user) {
            router.patch('/settings/preferences', {
                preferences: DEFAULT_SETTINGS,
            }, {
                preserveState: true,
                preserveScroll: true,
                only: ['auth'],
            });
        } else {
            localStorage.removeItem('settings');
        }
    };

    useEffect(() => {
        if (auth.user?.preferences) {
            setSettings(auth.user.preferences);
        }
    }, [auth.user?.preferences]);

    return {
        settings,
        updateSetting,
        resetSettings,
    };
}
```

### GUIDELINES

- Initialize settings from Inertia shared data (`auth.user.preferences`) if user is logged in
- Fall back to localStorage for guest users
- Use `router.patch()` to save to backend for authenticated users
- Use `preserveState: true` and `preserveScroll: true` to prevent page disruption
- Use `only: ['auth']` to only reload auth data, not the entire page
- The `useEffect` hook syncs settings when backend data changes
- TypeScript generics in `updateSetting` ensure type safety
- Keep the same hook API so no changes needed in components

---

## Phase 8: Wayfinder Route Generation

### GOAL
Generate type-safe route helpers for the new preferences endpoints.

### CONTEXT
Laravel Wayfinder generates TypeScript route helpers from Laravel routes. After adding new routes, we need to regenerate these helpers.

### TASK
Run Wayfinder generation to create type-safe route helpers for preferences endpoints.

### REQUIREMENTS

**Commands**:

```bash
./vendor/bin/sail artisan wayfinder:generate
npm run dev
```

### GUIDELINES

- Run `wayfinder:generate` to scan routes and generate TypeScript
- Generated files will be in `resources/js/routes/` and `resources/js/actions/`
- The dev server must restart to pick up new route definitions
- Verify generation: check `resources/js/routes/settings/index.ts` for preferences routes
- New routes can be imported: `import { settingsPreferencesShow, settingsPreferencesUpdate } from '@/routes';`
- This is optional if using direct paths, but recommended for type safety

---

## Phase 9: Testing & Verification

### GOAL
Verify the complete implementation works correctly across all layers.

### CONTEXT
All components must work together: database, model, controller, routes, middleware, and frontend. Testing ensures preferences persist correctly and sync across sessions.

### REQUIREMENTS

**Manual Testing Steps**:

1. **Database Verification**:
   ```bash
   ./vendor/bin/sail mysql
   DESCRIBE users;
   SELECT id, name, preferences FROM users LIMIT 5;
   ```
   - Verify `preferences` column exists
   - Check existing users have preferences (null or JSON)

2. **Route Verification**:
   ```bash
   ./vendor/bin/sail artisan route:list | grep preferences
   ```
   - Verify GET `/settings/preferences` route exists
   - Verify PATCH `/settings/preferences` route exists
   - Check middleware: auth, verified

3. **API Testing** (use browser dev tools or curl):
   ```bash
   # Fetch preferences
   curl -X GET http://localhost:8001/settings/preferences \
     -H "Cookie: laravel_session=YOUR_SESSION_COOKIE"
   
   # Update preferences
   curl -X PATCH http://localhost:8001/settings/preferences \
     -H "Cookie: laravel_session=YOUR_SESSION_COOKIE" \
     -H "Content-Type: application/json" \
     -d '{"preferences":{"outputFormat":"table","fontSize":"large"}}'
   ```

4. **Frontend Testing**:
   - Log in as a user
   - Open Settings panel
   - Change preferences (output format, font size, etc.)
   - Click "Save Settings"
   - Check browser console for errors
   - Refresh page - verify settings persist
   - Log out and log back in - verify settings persist
   - Open in different browser - verify settings sync
   - Check localStorage is NOT used for authenticated users

5. **Guest User Testing**:
   - Log out
   - Change settings as guest
   - Verify settings stored in localStorage
   - Refresh page - verify guest settings persist
   - Guest settings should NOT sync to account after login

6. **Default Handling**:
   - Create new user account
   - Verify defaults are applied (json format, medium font, etc.)
   - Check database: `SELECT preferences FROM users WHERE email='newuser@example.com';`
   - Verify defaults match both frontend and backend

7. **Validation Testing**:
   - Try setting invalid values (e.g., outputFormat: 'invalid')
   - Verify 422 validation error returned
   - Try setting invalid types (e.g., fontSize: 123)
   - Verify validation catches type mismatches

### GUIDELINES

- Test in this order: database → routes → API → frontend
- Use browser dev tools Network tab to inspect requests/responses
- Check Laravel logs for errors: `./vendor/bin/sail exec laravel.test tail -f storage/logs/laravel.log`
- Common issues:
  - 401 Unauthorized: Check auth middleware, session cookie
  - 422 Validation Error: Check request payload matches validation rules
  - 500 Server Error: Check Laravel logs for stack trace
  - Settings not persisting: Check Inertia shared data includes preferences
  - TypeScript errors: Ensure types match between frontend and backend
- If issues occur, debug layer by layer starting from the database

---

## Phase 10: Documentation Update

### GOAL
Update project documentation to reflect the new backend preferences system.

### CONTEXT
The architecture documentation needs to reflect the new preferences storage system. This helps future developers understand the implementation.

### TASK
Update `docs/architecture-overview.md` to document the preferences system.

### REQUIREMENTS

**File**: `docs/architecture-overview.md`

**Add Section** under "Backend Architecture → Controllers":

```markdown
#### PreferencesController

**Location**: `app/Http/Controllers/Settings/PreferencesController.php`

**Methods**:
- `show()`: Returns user's current preferences with defaults
- `update(Request $request)`: Updates user preferences with validation

**Routes**:
```php
Route::get('/settings/preferences', [PreferencesController::class, 'show'])->name('settings.preferences.show');
Route::patch('/settings/preferences', [PreferencesController::class, 'update'])->name('settings.preferences.update');
```

**Validation Rules**:
- `outputFormat`: json, table, or cards
- `jsonIndentation`: 2, 4, or 'tab'
- `autoCopyResults`: boolean
- `showLineNumbers`: boolean
- `saveToHistory`: boolean
- `avoidSensitiveStorage`: boolean
- `fontSize`: small, medium, or large
```

**Add Section** under "Database Schema → Tables → users":

```markdown
**Preferences Column**:
- `preferences`: JSON - User settings for UI preferences
  - Stores output format, JSON indentation, auto-copy, line numbers, history saving, sensitive data handling, and font size
  - Defaults defined in User model accessor
  - Shared with frontend via Inertia middleware
```

**Update Section** under "Frontend Architecture → Hooks → useSettings":

```markdown
#### useSettings

**Location**: `resources/js/hooks/use-settings.ts`

**Purpose**: Manage user preferences with backend persistence

**Features**:
- Fetch initial settings from Inertia shared data (authenticated users)
- Fall back to localStorage for guest users
- Save updates to backend via PATCH /settings/preferences
- Automatic sync when preferences change server-side
- Type-safe preference updates

**API**:
```typescript
const { settings, updateSetting, resetSettings } = useSettings();
```

**Preferences Structure**:
```typescript
interface UserPreferences {
    outputFormat: 'json' | 'table' | 'cards';
    jsonIndentation: 2 | 4 | 'tab';
    autoCopyResults: boolean;
    showLineNumbers: boolean;
    saveToHistory: boolean;
    avoidSensitiveStorage: boolean;
    fontSize: 'small' | 'medium' | 'large';
}
```

**Storage**:
- Authenticated users: Database via users.preferences JSON column
- Guest users: Browser localStorage
```

### GUIDELINES

- Add documentation in appropriate sections for discoverability
- Include code examples for clarity
- Document both backend and frontend aspects
- Keep formatting consistent with existing documentation
- Update table of contents if sections are added

---

## Implementation Order

Execute phases in the following order:

1. **Phase 1**: Database Schema (migration)
2. **Phase 2**: Model Layer (User.php)
3. **Phase 3**: Controller & Validation (PreferencesController.php)
4. **Phase 4**: Routes (routes/settings.php)
5. **Phase 5**: Inertia Shared Data (HandleInertiaRequests.php)
6. **Phase 6**: TypeScript Types (types/index.d.ts)
7. **Phase 7**: Frontend Hook Update (use-settings.ts)
8. **Phase 8**: Wayfinder Route Generation
9. **Phase 9**: Testing & Verification
10. **Phase 10**: Documentation Update

Each phase builds on the previous one. Do not skip phases or change the order.

---

## Rollback Strategy

If issues occur during implementation:

**After Phase 1 (Migration)**:
```bash
./vendor/bin/sail artisan migrate:rollback --step=1
```

**After Phase 2-4 (Backend Changes)**:
- Revert file changes via git: `git checkout -- app/Models/User.php app/Http/Controllers/Settings/PreferencesController.php routes/settings.php`

**After Phase 5-7 (Frontend Changes)**:
- Revert file changes via git: `git checkout -- app/Http/Middleware/HandleInertiaRequests.php resources/js/types/index.d.ts resources/js/hooks/use-settings.ts`

**Complete Rollback**:
```bash
git checkout -- .
./vendor/bin/sail artisan migrate:rollback --step=1
```

---

## Success Criteria

Implementation is complete when:

- ✅ Database migration runs successfully
- ✅ User model has preferences accessor and mutator
- ✅ PreferencesController handles GET and PATCH requests
- ✅ Routes are registered and protected by auth middleware
- ✅ Inertia shares preferences with all pages
- ✅ TypeScript types are defined for preferences
- ✅ use-settings hook saves to backend for authenticated users
- ✅ Settings persist across sessions and devices
- ✅ Guest users still use localStorage
- ✅ All manual tests pass
- ✅ Documentation is updated
