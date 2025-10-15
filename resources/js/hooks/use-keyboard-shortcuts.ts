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

interface KeyboardShortcutsOptions {
    enabled?: boolean;
    preventDefault?: boolean;
}

export function useKeyboardShortcuts(
    shortcuts: KeyboardShortcut[],
    options: KeyboardShortcutsOptions = {},
) {
    const { enabled = true, preventDefault = true } = options;

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            for (const shortcut of shortcuts) {
                const keyMatches =
                    event.key.toLowerCase() === shortcut.key.toLowerCase();
                const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey;
                const metaMatches = !!shortcut.metaKey === event.metaKey;
                const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
                const altMatches = !!shortcut.altKey === event.altKey;

                if (
                    keyMatches &&
                    ctrlMatches &&
                    metaMatches &&
                    shiftMatches &&
                    altMatches
                ) {
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
    copy: { key: 'c', ctrlKey: true, description: 'Copy selection' },
    selectAll: { key: 'a', ctrlKey: true, description: 'Select all' },
};
