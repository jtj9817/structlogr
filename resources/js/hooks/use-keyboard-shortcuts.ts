import { useEffect } from 'react';

interface KeyboardShortcut {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    action: () => void;
    description: string;
}

export type ShortcutDefinition = {
    key: string;
    description: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
};

type ShortcutDefinitionKeys = Pick<
    ShortcutDefinition,
    'key' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'
>;

type KeyboardShortcutEvent = Pick<
    KeyboardEvent,
    'key' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'
>;

interface KeyboardShortcutsOptions {
    enabled?: boolean;
    preventDefault?: boolean;
}

export const isMacPlatform = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }

    return /Mac|iPhone|iPad|iPod/.test(window.navigator.platform);
};

export const matchesKeyboardShortcut = (
    event: KeyboardShortcutEvent,
    shortcut: ShortcutDefinitionKeys,
    isMac = isMacPlatform(),
): boolean => {
    const keyMatches =
        event.key.toLowerCase() === shortcut.key.toLowerCase();
    let modifierMatches = false;

    if (shortcut.ctrlKey && shortcut.metaKey) {
        // Explicitly requesting both modifiers keeps their physical meanings.
        modifierMatches = event.ctrlKey && event.metaKey;
    } else if (shortcut.ctrlKey) {
        modifierMatches = isMac
            ? event.metaKey && !event.ctrlKey
            : event.ctrlKey && !event.metaKey;
    } else {
        modifierMatches =
            !event.ctrlKey && (!!shortcut.metaKey === event.metaKey);
    }

    return (
        keyMatches &&
        modifierMatches &&
        !!shortcut.shiftKey === event.shiftKey &&
        !!shortcut.altKey === event.altKey
    );
};

export function useKeyboardShortcuts(
    shortcuts: KeyboardShortcut[],
    options: KeyboardShortcutsOptions = {},
) {
    const { enabled = true, preventDefault = true } = options;

    useEffect(() => {
        if (!enabled) return;

        const isMac = isMacPlatform();
        const handleKeyDown = (event: KeyboardEvent) => {
            for (const shortcut of shortcuts) {
                if (matchesKeyboardShortcut(event, shortcut, isMac)) {
                    if (preventDefault) {
                        event.preventDefault();
                    }
                    shortcut.action();
                    break;
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts, enabled, preventDefault]);
}

export const commonShortcuts = {
    submit: { key: 'Enter', ctrlKey: true, description: 'Submit form' },
    clear: { key: 'k', ctrlKey: true, description: 'Clear input' },
    escape: { key: 'Escape', description: 'Close modal/dialog' },
    help: { key: '/', ctrlKey: true, description: 'Show keyboard shortcuts' },
    focusInput: { key: 'i', altKey: true, description: 'Focus input field' },
    focusOutput: { key: 'o', altKey: true, description: 'Focus output area' },
};

export const getKeyDisplayName = (key: string): string => {
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

export const getShortcutDisplay = (
    shortcut: ShortcutDefinitionKeys,
    isMac = isMacPlatform(),
): string => {
    const keys: string[] = [];

    if (shortcut.ctrlKey) {
        keys.push(getModifierKey(isMac));
    }
    if (shortcut.metaKey) {
        keys.push(isMac ? 'Ctrl' : 'Cmd');
    }
    if (shortcut.altKey) {
        keys.push('Alt');
    }
    if (shortcut.shiftKey) {
        keys.push('Shift');
    }
    keys.push(getKeyDisplayName(shortcut.key));

    return keys.join('+');
};

export const shortcutDefinitions: ShortcutDefinition[] = [
    { ...commonShortcuts.submit, description: 'Submit form' },
    { ...commonShortcuts.clear, description: 'Clear input' },
    { ...commonShortcuts.escape, description: 'Close modal/dialog' },
    { ...commonShortcuts.help, description: 'Show keyboard shortcuts' },
    { ...commonShortcuts.focusInput, description: 'Focus input field' },
    { ...commonShortcuts.focusOutput, description: 'Focus output area' },
];
