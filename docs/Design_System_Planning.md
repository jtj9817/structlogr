# Design System Planning

This document defines the design system fundamentals for StructLogr UI/UX implementation. These are planning guidelines for decision-making, not detailed implementation specifications.

---

## Purpose

This design system ensures consistency across all UI components and helps developers make styling decisions aligned with the overall design direction. All values are defined for use with Tailwind CSS 4.0.

---

## Color Palette

### Semantic Colors

**Success (Green)**
- 50: `#f0fdf4` - Light backgrounds
- 100: `#dcfce7` - Hover states
- 500: `#10b981` - Primary success
- 800: `#065f46` - Dark text on light backgrounds
- 950: Dark mode backgrounds

**Error (Red)**
- 50: `#fef2f2` - Light backgrounds
- 100: `#fee2e2` - Hover states
- 500: `#ef4444` - Primary error
- 800: `#991b1b` - Dark text on light backgrounds
- 950: Dark mode backgrounds

**Warning (Yellow/Orange)**
- 50: `#fffbeb` - Light backgrounds
- 100: `#fef3c7` - Hover states
- 500: `#f59e0b` - Primary warning
- 800: `#92400e` - Dark text on light backgrounds
- 950: Dark mode backgrounds

**Info (Blue)**
- 50: `#eff6ff` - Light backgrounds
- 100: `#dbeafe` - Hover states
- 500: `#3b82f6` - Primary info
- 800: `#1e40af` - Dark text on light backgrounds
- 950: Dark mode backgrounds

### Usage Guidelines

**Backgrounds:**
- Light mode: Use 50 shades for subtle tints
- Dark mode: Use 950 shades with low opacity (e.g., `bg-success-950/10`)

**Text:**
- Light mode: Use 800 shades for readable text
- Dark mode: Use 300 shades for readable text

**Borders:**
- Light mode: Use 200-300 shades
- Dark mode: Use 700-800 shades

**Example Usage:**
```
Success state: bg-success-50 text-success-800 border-success-200 dark:bg-success-950/10 dark:text-success-300 dark:border-success-800
```

### Log Level Colors

**Specific color assignments for log level badges:**
- ERROR: Red (error palette)
- WARN: Yellow (warning palette)
- INFO: Blue (info palette)
- DEBUG: Gray (neutral palette)
- SUCCESS: Green (success palette)

### Neutral Colors

**Use Tailwind defaults:**
- Gray scale: `gray-50` through `gray-950`
- Use for: text, borders, backgrounds, disabled states

---

## Typography

### Font Families

**Sans-serif (UI Elements)**
```
System font stack:
-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 
'Ubuntu', 'Cantarell', 'Helvetica Neue', sans-serif
```

**Monospace (Code/Logs)**
```
'Fira Code', 'JetBrains Mono', 'Source Code Pro', 
'Cascadia Code', 'Courier New', monospace
```

Import Fira Code from Google Fonts for ligature support.

### Type Scale

**Headings:**
- H1: `text-4xl lg:text-5xl` (36px → 48px) - Page titles
- H2: `text-2xl lg:text-3xl` (24px → 30px) - Section titles
- H3: `text-xl lg:text-2xl` (20px → 24px) - Subsection titles

**Body:**
- Large: `text-lg` (18px) - Mobile body text, emphasis
- Base: `text-base` (16px) - Default body text
- Small: `text-sm` (14px) - Secondary text, captions

**Code:**
- Code blocks: `text-sm font-mono` (14px)
- Inline code: `text-xs font-mono` (12px)

### Font Weights

- Light: `font-light` (300) - Rarely used
- Normal: `font-normal` (400) - Body text
- Medium: `font-medium` (500) - Emphasis
- Semibold: `font-semibold` (600) - Headings
- Bold: `font-bold` (700) - Strong emphasis

### Line Heights

- Tight: `leading-tight` (1.25) - Large headings
- Snug: `leading-snug` (1.375) - Small headings
- Normal: `leading-normal` (1.5) - Small text
- Relaxed: `leading-relaxed` (1.625) - Body text
- Loose: `leading-loose` (2) - Special cases

### Usage Guidelines

**Apply consistently:**
- Hero headlines: H1 + `font-bold` + `leading-tight`
- Section titles: H2 + `font-semibold` + `leading-snug`
- Card titles: H3 + `font-medium` + `leading-snug`
- Body text: `text-base` + `leading-relaxed`
- Captions: `text-sm` + `text-gray-600 dark:text-gray-400`

---

## Spacing System

### Base Unit: 4px

Tailwind spacing scale (multiply by 4 to get pixels):
- 1 = 4px
- 2 = 8px
- 3 = 12px
- 4 = 16px
- 6 = 24px
- 8 = 32px
- 10 = 40px
- 12 = 48px
- 16 = 64px
- 20 = 80px
- 24 = 96px

### Spacing Guidelines

**Component Internal Spacing:**
- Button padding: `px-4 py-2` (16px × 8px)
- Card padding: `p-6 lg:p-8` (24px → 32px)
- Input padding: `px-3 py-2` (12px × 8px)
- Modal padding: `p-6` (24px)

**Component External Spacing:**
- Between form elements: `space-y-4` (16px)
- Between sections: `space-y-8` (32px) or `space-y-12` (48px)
- Between cards in grid: `gap-6` (24px)
- Page margins: `px-4 sm:px-6 lg:px-8` (16px → 24px → 32px)

**Vertical Rhythm:**
- Tight sections: `py-8` (32px top/bottom)
- Normal sections: `py-12` (48px top/bottom)
- Generous sections: `py-16 lg:py-24` (64px → 96px top/bottom)

### Container Max Widths

- Small: `max-w-md` (448px) - Narrow forms
- Medium: `max-w-2xl` (672px) - Default content
- Large: `max-w-4xl` (896px) - Wide content
- Extra Large: `max-w-6xl` (1152px) - Full-width sections
- Full: `max-w-7xl` (1280px) - Maximum application width

---

## Borders & Shadows

### Border Radius

- Small: `rounded` (4px) - Badges, small elements
- Medium: `rounded-md` (6px) - Buttons, inputs
- Large: `rounded-lg` (8px) - Cards, modals
- Extra Large: `rounded-xl` (12px) - Hero sections
- Full: `rounded-full` - Pills, avatars

**Consistency:**
- Buttons: `rounded-md`
- Cards: `rounded-lg`
- Inputs: `rounded-md`
- Badges: `rounded` or `rounded-full`

### Border Width & Color

**Width:**
- Default: `border` (1px)
- Medium: `border-2` (2px)
- Thick: `border-4` (4px)

**Color:**
- Default: `border-gray-200 dark:border-gray-700`
- Subtle: `border-gray-100 dark:border-gray-800`
- Emphasis: Use semantic colors (border-blue-200, etc.)

### Shadows

**Light Mode:**
- Subtle: `shadow-sm` - Default card state
- Medium: `shadow-md` - Hover state, elevated elements
- Large: `shadow-lg` - Modals, dropdowns
- Extra Large: `shadow-xl` - Hero elements

**Dark Mode:**
- Use same classes, Tailwind adjusts automatically
- Or specify: `dark:shadow-gray-900/30` for more control

**Hover Effects:**
- Card hover: `hover:shadow-md transition-shadow duration-200`

---

## Breakpoints

### Responsive Design System

**Breakpoints (Tailwind defaults):**
- `sm`: 640px (landscape phones, small tablets)
- `md`: 768px (tablets)
- `lg`: 1024px (laptops, small desktops)
- `xl`: 1280px (desktops)
- `2xl`: 1536px (large desktops)

### Mobile-First Approach

**Default styles apply to mobile (<640px)**
- Stack layouts vertically
- Full-width elements
- Larger touch targets (min 44×44px)

**Tablet (md: 768px+):**
- Side-by-side layouts (grid-cols-2)
- Reduced padding
- Navigation becomes horizontal

**Desktop (lg: 1024px+):**
- Multi-column layouts
- Hover states become relevant
- Larger typography scale

### Usage Guidelines

```
Mobile-first example:
- Base: text-lg (18px on mobile)
- Desktop: sm:text-base (16px on tablet+)

Grid example:
- Mobile: grid-cols-1 (single column)
- Tablet: md:grid-cols-2 (two columns)
- Desktop: lg:grid-cols-3 (three columns)
```

---

## Components Library

### Available Radix UI Components

**Already integrated (in `resources/js/components/ui/`):**
- Alert
- Avatar
- Badge
- Button (with variants)
- Card (with CardHeader, CardTitle, CardContent, CardFooter)
- Checkbox
- Dialog (Modal)
- Dropdown Menu
- Input
- Input OTP
- Label
- Select
- Separator
- Sheet (Slide-in panel)
- Sidebar
- Skeleton (Loading placeholder)
- Spinner (Loading indicator)
- Textarea
- Toggle
- Toggle Group
- Tooltip

**If you need a component not listed:**
1. Check Radix UI documentation for availability
2. Create wrapper component in `components/ui/`
3. Follow existing patterns (TypeScript, forwardRef, className merging)

### Component Variants

**Button Variants:**
- `default`: Primary action (filled, blue)
- `destructive`: Dangerous action (filled, red)
- `outline`: Secondary action (outlined)
- `ghost`: Tertiary action (no background)
- `link`: Text link style

**Button Sizes:**
- `sm`: Small (px-3 py-1.5)
- `default`: Normal (px-4 py-2)
- `lg`: Large (px-6 py-3)
- `icon`: Square (p-2)

---

## Icons

### Icon Library: Lucide React

**Already installed and in use.**

**Common Icons:**
- Actions: `Upload`, `Download`, `Copy`, `Trash2`, `Edit`, `Save`, `X` (close)
- Navigation: `ChevronDown`, `ChevronRight`, `Menu`, `ArrowLeft`, `Home`
- Status: `CheckCircle2`, `AlertTriangle`, `AlertCircle`, `Info`, `XCircle`
- Content: `FileText`, `File`, `Folder`, `Image`, `Code`
- UI: `Search`, `Settings`, `HelpCircle`, `User`, `Mail`
- AI/Special: `Sparkles`, `Wand2`, `Zap`, `Brain`
- Time: `Clock`, `Calendar`
- Format: `Braces` (JSON), `List`, `Grid`

### Icon Sizing

**Size Guidelines:**
- Inline with text: `size={16}` or `className="w-4 h-4"`
- Buttons: `size={20}` or `className="w-5 h-5"`
- Section headers: `size={24}` or `className="w-6 h-6"`
- Empty states: `size={48}` or `className="w-12 h-12"`
- Hero illustrations: `size={64}` or `className="w-16 h-16"`

**Color:**
- Inherit parent: `className="text-current"` (default)
- Muted: `className="text-gray-500"`
- Semantic: `className="text-green-600"` (success), `text-red-600` (error)

---

## Animations & Transitions

### Transition Durations

**Standard timing:**
- Fast: `duration-150` (150ms) - Hover states, small movements
- Normal: `duration-200` (200ms) - Default transitions
- Slow: `duration-300` (300ms) - Larger movements, modals
- Very Slow: `duration-500` (500ms) - Page transitions

### Easing Functions

**Tailwind defaults:**
- `ease-linear`: Constant speed
- `ease-in`: Starts slow, ends fast
- `ease-out`: Starts fast, ends slow (most common)
- `ease-in-out`: Slow start and end

**Recommendation:** Use `ease-out` for most transitions.

### Common Transitions

**Button hover:**
```
hover:scale-105 transition-transform duration-150
hover:shadow-md transition-shadow duration-200
```

**Fade in:**
```
opacity-0 animate-in fade-in duration-200
```

**Slide in:**
```
translate-x-full animate-in slide-in-from-right duration-300
```

**Modal backdrop:**
```
opacity-0 animate-in fade-in duration-200
```

### Custom Animations (Tailwind Config)

**If needed, add to `tailwind.config.js`:**
```javascript
animation: {
  'gradient-x': 'gradient-x 3s ease infinite',
  'spin-slow': 'spin 3s linear infinite',
}
keyframes: {
  'gradient-x': {
    '0%, 100%': { 'background-position': '0% 50%' },
    '50%': { 'background-position': '100% 50%' },
  },
}
```

---

## Layout Patterns

### Grid Systems

**Two Column (Input/Output):**
```
grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8
```

**Three Column (Cards):**
```
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
```

**Four Column (Feature Cards):**
```
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6
```

### Flexbox Patterns

**Horizontal alignment:**
```
flex items-center justify-between
```

**Vertical stack:**
```
flex flex-col space-y-4
```

**Centered content:**
```
flex items-center justify-center min-h-screen
```

### Container Patterns

**Page wrapper:**
```
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
```

**Section wrapper:**
```
py-12 lg:py-16 space-y-8
```

**Card wrapper:**
```
bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6
```

---

## Accessibility Guidelines

### Color Contrast

**WCAG AA Requirements:**
- Normal text (16px): 4.5:1 contrast ratio
- Large text (24px+): 3:1 contrast ratio
- UI components: 3:1 contrast ratio

**Testing:**
- Use browser DevTools color picker
- Check contrast against both light and dark backgrounds
- Ensure semantic colors meet requirements

### Focus States

**Always include visible focus indicators:**
```
focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
dark:focus:ring-blue-400
```

**Never remove focus styles without replacement:**
```
❌ outline-none (alone)
✅ outline-none focus:ring-2 focus:ring-blue-500
```

### Interactive Element Sizing

**Minimum touch target: 44×44px**
```
min-h-[44px] min-w-[44px]
```

For smaller visual elements, add invisible padding to reach 44px.

---

## Dark Mode Strategy

### Implementation Approach

**Tailwind's `dark:` variant:**
- Automatically detects system preference
- Can be toggled manually (already implemented via `use-appearance` hook)
- Prefix all dark-specific styles with `dark:`

### Color Adjustments

**General rules:**
- Light backgrounds → Dark backgrounds
- Dark text → Light text
- Reduce border contrast (lighter in dark mode)
- Adjust shadow opacity (lighter in dark mode)

**Example:**
```
Light mode: bg-white text-gray-900 border-gray-200
Dark mode: dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700
```

### Component-Specific Guidelines

**Cards:**
- Light: `bg-white border-gray-200`
- Dark: `dark:bg-gray-900 dark:border-gray-800`

**Inputs:**
- Light: `bg-white border-gray-300`
- Dark: `dark:bg-gray-800 dark:border-gray-600`

**Text:**
- Primary: `text-gray-900 dark:text-gray-100`
- Secondary: `text-gray-600 dark:text-gray-400`
- Muted: `text-gray-500 dark:text-gray-500`

---

## Form Design Patterns

### Input Fields

**Standard input:**
```
border border-gray-300 rounded-md px-3 py-2
focus:ring-2 focus:ring-blue-500 focus:border-blue-500
dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100
```

**Error state:**
```
border-red-500 focus:ring-red-500
```

**Success state:**
```
border-green-500 focus:ring-green-500
```

### Labels

**Standard label:**
```
text-sm font-medium text-gray-700 dark:text-gray-300
mb-1
```

**Required indicator:**
```
<span className="text-red-500">*</span>
```

### Error Messages

**Below input:**
```
text-sm text-red-600 dark:text-red-400 mt-1
```

### Form Layout

**Vertical form:**
```
space-y-4
```

**Grid form (two columns):**
```
grid grid-cols-1 md:grid-cols-2 gap-4
```

---

## Loading States

### Spinner

**Use existing Spinner component:**
```typescript
import { Spinner } from '@/components/ui/spinner';
<Spinner className="w-5 h-5" />
```

### Skeleton

**Use existing Skeleton component:**
```typescript
import { Skeleton } from '@/components/ui/skeleton';
<Skeleton className="h-12 w-full" />
```

### Progress Bar

**If needed, use Radix Progress:**
```typescript
import { Progress } from '@radix-ui/react-progress';
```

---

## Empty States

### Structure

**Icon + Title + Description + Action**
```
<div className="text-center py-12">
  <Icon className="mx-auto h-12 w-12 text-gray-400" />
  <h3 className="mt-4 text-lg font-medium">No items yet</h3>
  <p className="mt-2 text-sm text-gray-500">Get started by creating a new item.</p>
  <Button className="mt-4">Create Item</Button>
</div>
```

### Tone

- **Friendly, not alarming:** Use encouraging language
- **Actionable:** Include a clear next step
- **Concise:** Keep descriptions brief

---

## Summary

This design system provides:
- **Color palette** with semantic meanings
- **Typography scale** for consistent hierarchy
- **Spacing system** based on 4px increments
- **Component library** (Radix UI) for complex patterns
- **Icon library** (Lucide React) for visual communication
- **Responsive breakpoints** for mobile-first design
- **Dark mode strategy** for theme consistency
- **Accessibility guidelines** for WCAG compliance

**When making design decisions:**
1. Check if a pattern already exists
2. Use Tailwind utilities over custom CSS
3. Support both light and dark modes
4. Test on multiple screen sizes
5. Verify color contrast ratios
6. Ensure keyboard navigation works

**For questions or clarifications:**
- Refer to `Technical_Constraints.md` for technical limitations
- Refer to `architecture-overview.md` for system architecture
- Check existing components for implementation patterns
