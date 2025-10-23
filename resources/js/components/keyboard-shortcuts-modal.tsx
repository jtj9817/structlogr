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

interface KeyboardShortcutsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const useIsMac = () => {
    return useMemo(() => {
        if (typeof window === 'undefined') return false;
        return /Mac|iPhone|iPad|iPod/.test(window.navigator.platform);
    }, []);
};

const KeyBadge = forwardRef<HTMLSpanElement, { children: string }>(
    ({ children }, ref) => (
        <span
            ref={ref}
            className="inline-flex items-center justify-center rounded-md border border-border bg-muted px-2 py-1 font-mono text-xs font-medium text-foreground shadow-sm"
        >
            {children}
        </span>
    ),
);
KeyBadge.displayName = 'KeyBadge';

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
            keys.push(getKeyDisplayName(shortcut.key));
            
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
