# Keyboard Shortcuts Implementation Fix Plan

## Overview

This document outlines the plan to fix gaps in the keyboard shortcuts implementation identified during code review. The implementation is mostly complete but has missing features and inconsistencies that need to be addressed.

**Issues to Resolve:**
1. Focus management after formatting/errors is incomplete
2. Button tooltips with shortcut hints are missing
3. Non-functional shortcuts (`Ctrl+C`, `Ctrl+A`) shown in help modal
4. Hardcoded shortcuts in modal instead of dynamic generation
5. No platform-specific key display (Cmd vs Ctrl on Mac)

---

## Phase 1: Enhanced Focus Management

### GOAL:
Implement complete focus management after formatting completion and error states.

### CONTEXT:
Currently, only the initial auto-focus on page load is implemented. The plan requires focusing the output area after successful formatting and focusing error messages after errors occur.

### TASK:
Add focus management hooks that trigger when formatting completes or errors occur.

### REQUIREMENTS:
- Focus output area after successful formatting
- Focus error message after formatting errors
- Maintain existing auto-focus on page load (desktop only)
- Use React refs for focus control

### GUIDELINES:

**File: `resources/js/pages/FormatterPage.tsx`**

1. **Add focus effect after successful formatting:**
   - Locate the `submit` function (lines 435-457)
   - In the `post('/format', { onSuccess: ... })` callback, after stopping the timer
   - Add: `setTimeout(() => outputRef.current?.focus(), 100)`
   - The timeout ensures the DOM has updated before focusing

2. **Add focus effect after error:**
   - In the same `submit` function
   - In the `onError` callback (lines 449-456)
   - Create a new ref: `const errorRef = useRef<HTMLDivElement>(null)`
   - Add: `setTimeout(() => errorRef.current?.focus(), 100)`

3. **Update error display to accept ref:**
   - Locate the error display in the textarea wrapper (lines 789-802)
   - Wrap the `InputError` component in a div with the ref
   - Add `tabIndex={-1}` to make it programmatically focusable
   - Example:
     ```tsx
     {errors.raw_log && (
         <div
             ref={errorRef}
             id={errorAlertId}
             role="alert"
             aria-live="assertive"
             className="mt-2"
             tabIndex={-1}
         >
             <InputError message={errors.raw_log} />
         </div>
     )}
     ```

4. **Ensure output ref is focusable:**
   - The `outputRef` is already applied to the `<pre>` element (line 603)
   - Verify `tabIndex={0}` is present (it is, line 605)
   - No changes needed

---

## Phase 2: Dynamic Keyboard Shortcuts Modal

### GOAL:
Replace hardcoded shortcuts list in the modal with dynamically generated list from `commonShortcuts`.

### CONTEXT:
The `KeyboardShortcutsModal` has a hardcoded array of shortcuts that can become out of sync with the actual shortcuts defined in `use-keyboard-shortcuts.ts`. This creates maintenance issues.

### TASK:
Refactor the modal to accept shortcuts as props and generate the display dynamically.

### REQUIREMENTS:
- Modal receives shortcuts list as props
- Shortcuts display matches actual implementation
- Remove non-functional shortcuts (Ctrl+C, Ctrl+A)
- Platform-specific key display (Cmd on Mac, Ctrl on Windows/Linux)

### GUIDELINES:

**File: `resources/js/hooks/use-keyboard-shortcuts.ts`**

1. **Export shortcut definitions with display metadata:**
   - Update `commonShortcuts` object to include display information
   - Add after line 67:
     ```typescript
     export const shortcutDefinitions = [
         { ...commonShortcuts.submit, description: 'Submit form' },
         { ...commonShortcuts.clear, description: 'Clear input' },
         { ...commonShortcuts.escape, description: 'Close modal/dialog' },
         { ...commonShortcuts.help, description: 'Show keyboard shortcuts' },
         { ...commonShortcuts.focusInput, description: 'Focus input field' },
         { ...commonShortcuts.focusOutput, description: 'Focus output area' },
     ] as const;
     ```

2. **Add utility function for key display:**
   - Add before the `shortcutDefinitions`:
     ```typescript
     export const getKeyDisplayName = (key: string, isMac: boolean): string => {
         const keyMap: Record<string, string> = {
             'Enter': 'Enter',
             'Escape': 'Esc',
             '/': '/',
             'k': 'K',
             'i': 'I',
             'o': 'O',
         };
         return keyMap[key] || key.toUpperCase();
     };

     export const getModifierKey = (isMac: boolean): string => {
         return isMac ? 'Cmd' : 'Ctrl';
     };
     ```

**File: `resources/js/components/keyboard-shortcuts-modal.tsx`**

1. **Import shortcut definitions:**
   - Replace lines 1-30 with:
     ```tsx
     import {
         Dialog,
         DialogContent,
         DialogDescription,
         DialogHeader,
         DialogTitle,
     } from '@/components/ui/dialog';
     import { Keyboard } from 'lucide-react';
     import { forwardRef, useMemo } from 'react';
     import {
         shortcutDefinitions,
         getKeyDisplayName,
         getModifierKey,
     } from '@/hooks/use-keyboard-shortcuts';
     ```

2. **Remove hardcoded shortcuts array:**
   - Delete lines 21-30 (the `shortcuts` constant)

3. **Add platform detection hook:**
   - After imports, before `KeyBadge`:
     ```tsx
     const useIsMac = () => {
         return useMemo(() => {
             if (typeof window === 'undefined') return false;
             return /Mac|iPhone|iPad|iPod/.test(window.navigator.platform);
         }, []);
     };
     ```

4. **Update component to use dynamic shortcuts:**
   - Update the component function (starting at line 44):
     ```tsx
     export default function KeyboardShortcutsModal({
         open,
         onOpenChange,
     }: KeyboardShortcutsModalProps) {
         const isMac = useIsMac();

         const displayShortcuts = useMemo(() => {
             return shortcutDefinitions.map((shortcut) => {
                 const keys: string[] = [];
                 
                 if (shortcut.ctrlKey || shortcut.metaKey) {
                     keys.push(getModifierKey(isMac));
                 }
                 if (shortcut.altKey) {
                     keys.push('Alt');
                 }
                 if (shortcut.shiftKey) {
                     keys.push('Shift');
                 }
                 keys.push(getKeyDisplayName(shortcut.key, isMac));
                 
                 return {
                     keys,
                     description: shortcut.description,
                 };
             });
         }, [isMac]);

         return (
             <Dialog open={open} onOpenChange={onOpenChange}>
                 <DialogContent className="max-w-md">
                     <DialogHeader>
                         <DialogTitle className="flex items-center gap-2">
                             <Keyboard className="h-5 w-5" />
                             Keyboard Shortcuts
                         </DialogTitle>
                         <DialogDescription>
                             Navigate the application faster with these keyboard
                             shortcuts.
                         </DialogDescription>
                     </DialogHeader>

                     <div className="space-y-3">
                         {displayShortcuts.map((shortcut, index) => (
                             <div
                                 key={index}
                                 className="flex items-center justify-between rounded-lg border p-3"
                             >
                                 <span className="text-sm text-muted-foreground">
                                     {shortcut.description}
                                 </span>
                                 <div className="flex items-center gap-1">
                                     {shortcut.keys.map((key, keyIndex) => (
                                         <div
                                             key={keyIndex}
                                             className="flex items-center gap-1"
                                         >
                                             <KeyBadge>{key}</KeyBadge>
                                             {keyIndex <
                                                 shortcut.keys.length - 1 && (
                                                 <span className="mx-1 text-muted-foreground">
                                                     +
                                                 </span>
                                             )}
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         ))}
                     </div>

                     <div className="mt-4 text-xs text-muted-foreground">
                         <p>
                             {isMac
                                 ? 'Tip: Use Cmd key for shortcuts on Mac.'
                                 : 'Tip: Use Ctrl key for shortcuts on Windows/Linux.'}
                         </p>
                     </div>
                 </DialogContent>
             </Dialog>
         );
     }
     ```

---

## Phase 3: Button Tooltips with Shortcut Hints

### GOAL:
Add tooltips to interactive buttons showing their associated keyboard shortcuts.

### CONTEXT:
The UI/UX plan specifies that buttons should display their keyboard shortcuts in tooltips (e.g., "Format Log (Ctrl+Enter)"). This improves discoverability and user efficiency.

### TASK:
Add Tooltip component wrapper to key buttons displaying their shortcuts.

### REQUIREMENTS:
- Tooltips on Format button, Clear button
- Display format: "Action Name (Shortcut)"
- Platform-aware (show Cmd on Mac, Ctrl elsewhere)
- Use Radix UI Tooltip component

### GUIDELINES:

**File: `resources/js/components/ui/tooltip.tsx`**

1. **Create Tooltip component (if not exists):**
   - Check if file exists with `Glob` pattern `**/tooltip.tsx`
   - If it doesn't exist, create it:
     ```tsx
     import * as React from 'react';
     import * as TooltipPrimitive from '@radix-ui/react-tooltip';
     import { cn } from '@/lib/utils';

     const TooltipProvider = TooltipPrimitive.Provider;

     const Tooltip = TooltipPrimitive.Root;

     const TooltipTrigger = TooltipPrimitive.Trigger;

     const TooltipContent = React.forwardRef<
         React.ElementRef<typeof TooltipPrimitive.Content>,
         React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
     >(({ className, sideOffset = 4, ...props }, ref) => (
         <TooltipPrimitive.Content
             ref={ref}
             sideOffset={sideOffset}
             className={cn(
                 'z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                 className,
             )}
             {...props}
         />
     ));
     TooltipContent.displayName = TooltipPrimitive.Content.displayName;

     export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
     ```

**File: `resources/js/hooks/use-keyboard-shortcuts.ts`**

1. **Add utility function for tooltip text:**
   - Add after `getModifierKey` function:
     ```typescript
     export const getShortcutDisplay = (
         shortcut: Pick<KeyboardShortcut, 'key' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>,
     ): string => {
         const isMac = typeof window !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(window.navigator.platform);
         const keys: string[] = [];
         
         if (shortcut.ctrlKey || shortcut.metaKey) {
             keys.push(getModifierKey(isMac));
         }
         if (shortcut.altKey) {
             keys.push('Alt');
         }
         if (shortcut.shiftKey) {
             keys.push('Shift');
         }
         keys.push(getKeyDisplayName(shortcut.key, isMac));
         
         return keys.join('+');
     };
     ```

**File: `resources/js/pages/FormatterPage.tsx`**

1. **Import Tooltip components:**
   - Add to imports (after line 18):
     ```tsx
     import {
         Tooltip,
         TooltipContent,
         TooltipProvider,
         TooltipTrigger,
     } from '@/components/ui/tooltip';
     ```

2. **Import shortcut display utility:**
   - Update the keyboard shortcuts import (line 24-27):
     ```tsx
     import {
         commonShortcuts,
         useKeyboardShortcuts,
         getShortcutDisplay,
     } from '@/hooks/use-keyboard-shortcuts';
     ```

3. **Wrap the Format button with Tooltip:**
   - Locate the Format button (lines 822-841)
   - Wrap the entire component structure with TooltipProvider at the top level (after `<>` at line 635)
   - Wrap the Button in Tooltip components:
     ```tsx
     <Tooltip>
         <TooltipTrigger asChild>
             <Button
                 id={formatButtonId}
                 data-testid={formatButtonTestId}
                 type="submit"
                 disabled={processing || !data.raw_log.trim()}
                 className="w-full rounded-md"
                 aria-label={
                     processing
                         ? 'Processing log format request'
                         : 'Format log with AI'
                 }
             >
                 {processing && <Spinner className="mr-2" />}
                 Format Log
             </Button>
         </TooltipTrigger>
         <TooltipContent>
             <p>Format log ({getShortcutDisplay(commonShortcuts.submit)})</p>
         </TooltipContent>
     </Tooltip>
     ```

4. **Wrap the Clear button with Tooltip:**
   - Locate the clear button (lines 760-771)
   - Wrap in Tooltip components:
     ```tsx
     <Tooltip>
         <TooltipTrigger asChild>
             <button
                 id={clearButtonId}
                 type="button"
                 onClick={handleClearInput}
                 className="focus-ring absolute top-3 right-3 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                 aria-label="Clear input"
                 tabIndex={0}
             >
                 ×
             </button>
         </TooltipTrigger>
         <TooltipContent>
             <p>Clear input ({getShortcutDisplay(commonShortcuts.clear)})</p>
         </TooltipContent>
     </Tooltip>
     ```

5. **Add TooltipProvider wrapper:**
   - Locate the return statement (line 634)
   - Add TooltipProvider wrapper:
     ```tsx
     return (
         <TooltipProvider>
             <Head title="StructLogr - Log Formatter" />
             {/* rest of the component */}
         </TooltipProvider>
     );
     ```

**File: `package.json`**

1. **Verify Radix UI Tooltip dependency:**
   - Check if `@radix-ui/react-tooltip` is installed
   - If not, add to dependencies:
     ```json
     "@radix-ui/react-tooltip": "^1.0.7"
     ```
   - Run: `npm install` or `pnpm install`

---

## Phase 4: Remove Non-Functional Shortcuts

### GOAL:
Remove `Ctrl+C` and `Ctrl+A` shortcuts from the help modal and common shortcuts export since they're browser defaults and not implemented in the application.

### CONTEXT:
The shortcuts modal displays `Ctrl+C` (Copy selection) and `Ctrl+A` (Select all) but these are not wired up in the FormatterPage component. They rely on browser defaults, which is misleading to users who see them in the help modal.

### TASK:
Remove these shortcuts from the common shortcuts definitions and the help modal.

### REQUIREMENTS:
- Remove `copy` and `selectAll` from `commonShortcuts`
- Remove from `shortcutDefinitions` export
- Ensure they don't appear in the modal

### GUIDELINES:

**File: `resources/js/hooks/use-keyboard-shortcuts.ts`**

1. **Remove unused shortcuts from commonShortcuts:**
   - Locate `commonShortcuts` object (lines 57-66)
   - Remove the `copy` and `selectAll` properties:
     ```typescript
     export const commonShortcuts = {
         submit: { key: 'Enter', ctrlKey: true, description: 'Submit form' },
         clear: { key: 'k', ctrlKey: true, description: 'Clear input' },
         escape: { key: 'Escape', description: 'Close modal/dialog' },
         help: { key: '/', ctrlKey: true, description: 'Show keyboard shortcuts' },
         focusInput: { key: 'i', altKey: true, description: 'Focus input field' },
         focusOutput: { key: 'o', altKey: true, description: 'Focus output area' },
     };
     ```

2. **Update shortcutDefinitions (from Phase 2):**
   - Ensure `shortcutDefinitions` array doesn't include copy/selectAll
   - Should only include the 6 shortcuts listed above

**File: `resources/js/components/keyboard-shortcuts-modal.tsx`**

1. **Verify no hardcoded copy/selectAll:**
   - After Phase 2 changes, this should be automatically resolved
   - The dynamic generation will only show shortcuts from `shortcutDefinitions`
   - No additional changes needed if Phase 2 is complete

---

## Phase 5: Testing and Verification

### GOAL:
Verify all keyboard shortcuts work correctly and are properly displayed.

### CONTEXT:
After implementing all phases, comprehensive testing is required to ensure all shortcuts function as expected and the help modal displays accurate information.

### TASK:
Test all keyboard shortcuts, focus management, tooltips, and platform-specific displays.

### REQUIREMENTS:
- All shortcuts functional on Windows/Linux
- All shortcuts functional on Mac (with Cmd key)
- Focus management works correctly
- Tooltips display correct shortcuts
- Help modal displays correct shortcuts
- No console errors

### GUIDELINES:

**Manual Testing Checklist:**

1. **Keyboard Shortcuts Functionality:**
   - [ ] `Ctrl+Enter` / `Cmd+Enter`: Submits form when input has text
   - [ ] `Ctrl+K` / `Cmd+K`: Clears input textarea
   - [ ] `Esc`: Closes history sidebar when open
   - [ ] `Esc`: Closes preferences modal when open
   - [ ] `Esc`: Closes settings panel when open
   - [ ] `Esc`: Closes shortcuts modal when open
   - [ ] `Ctrl+/` / `Cmd+/`: Opens keyboard shortcuts modal
   - [ ] `Alt+I`: Focuses input textarea
   - [ ] `Alt+O`: Focuses output preview area

2. **Focus Management:**
   - [ ] Input textarea auto-focuses on page load (desktop only)
   - [ ] Output area receives focus after successful formatting
   - [ ] Error message receives focus after formatting error
   - [ ] Focus is visible with focus ring on all elements

3. **Button Tooltips:**
   - [ ] Hover over Format button shows "Format log (Ctrl+Enter)" or "Format log (Cmd+Enter)"
   - [ ] Hover over Clear button shows "Clear input (Ctrl+K)" or "Clear input (Cmd+K)"
   - [ ] Tooltips display correct platform-specific keys

4. **Keyboard Shortcuts Modal:**
   - [ ] Modal displays 6 shortcuts total
   - [ ] No Ctrl+C or Ctrl+A shortcuts shown
   - [ ] Platform-specific keys shown (Cmd on Mac, Ctrl on Windows/Linux)
   - [ ] All displayed shortcuts match actual implementation
   - [ ] Modal footer shows correct platform-specific tip

5. **Platform-Specific Testing:**
   - [ ] Test on Mac: Cmd key works, displayed correctly
   - [ ] Test on Windows: Ctrl key works, displayed correctly
   - [ ] Test on Linux: Ctrl key works, displayed correctly

**File: `resources/js/pages/FormatterPage.tsx`**

1. **Add test data attribute for focus testing:**
   - Add to output `<pre>` element (line 603):
     ```tsx
     data-testid="formatted-output"
     ```
   - Add to error wrapper div:
     ```tsx
     data-testid="error-message"
     ```

2. **Verify all refs are properly initialized:**
   - Check `textareaRef` (line 183)
   - Check `outputRef` (line 184)
   - Check `errorRef` (added in Phase 1)

**Browser Console Testing:**

1. **Check for errors:**
   - Open browser DevTools Console
   - Navigate through application
   - Trigger all shortcuts
   - Verify no errors logged

2. **Check focus programmatically:**
   - After formatting: `console.log(document.activeElement)`
   - Should log the `<pre>` element with formatted output
   - After error: Should log the error div

**Automated Testing (Optional):**

Create test file: `resources/js/pages/__tests__/FormatterPage.keyboard.test.tsx`

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormatterPage from '../FormatterPage';

describe('Keyboard Shortcuts', () => {
    it('submits form with Ctrl+Enter', async () => {
        const user = userEvent.setup();
        render(<FormatterPage />);
        
        const textarea = screen.getByLabelText('Raw log input');
        await user.type(textarea, 'test log');
        await user.keyboard('{Control>}{Enter}{/Control}');
        
        // Assert form submission
    });

    it('clears input with Ctrl+K', async () => {
        const user = userEvent.setup();
        render(<FormatterPage />);
        
        const textarea = screen.getByLabelText('Raw log input');
        await user.type(textarea, 'test log');
        await user.keyboard('{Control>}k{/Control}');
        
        expect(textarea).toHaveValue('');
    });

    it('focuses output after formatting', async () => {
        // Test focus management
    });
});
```

---

## Implementation Order

Execute phases in this order:

1. **Phase 1**: Enhanced Focus Management (low risk, isolated changes)
2. **Phase 4**: Remove Non-Functional Shortcuts (cleanup, prevents confusion)
3. **Phase 2**: Dynamic Keyboard Shortcuts Modal (requires Phase 4 complete)
4. **Phase 3**: Button Tooltips with Shortcut Hints (depends on Phase 2 utilities)
5. **Phase 5**: Testing and Verification (final validation)

---

## Files Modified Summary

| File | Phases | Changes |
|------|--------|---------|
| `resources/js/pages/FormatterPage.tsx` | 1, 3, 5 | Focus management, tooltip wrappers, test attributes |
| `resources/js/hooks/use-keyboard-shortcuts.ts` | 2, 3, 4 | Export utilities, remove unused shortcuts |
| `resources/js/components/keyboard-shortcuts-modal.tsx` | 2, 4 | Dynamic shortcuts, platform detection |
| `resources/js/components/ui/tooltip.tsx` | 3 | New component (if not exists) |
| `package.json` | 3 | Add Radix tooltip dependency (if needed) |

---

**End of Plan**
