import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';
import { forwardRef } from 'react';

interface KeyboardShortcutsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface ShortcutItem {
    keys: string[];
    description: string;
}

const shortcuts: ShortcutItem[] = [
    { keys: ['Ctrl', 'Enter'], description: 'Submit form' },
    { keys: ['Ctrl', 'K'], description: 'Clear input' },
    { keys: ['Esc'], description: 'Close modal/dialog' },
    { keys: ['Ctrl', '/'], description: 'Show keyboard shortcuts' },
    { keys: ['Alt', 'I'], description: 'Focus input field' },
    { keys: ['Alt', 'O'], description: 'Focus output area' },
    { keys: ['Ctrl', 'C'], description: 'Copy selection' },
    { keys: ['Ctrl', 'A'], description: 'Select all' },
];

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
                    {shortcuts.map((shortcut, index) => (
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
                    <p>Note: On Mac, use the Cmd key instead of Ctrl.</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
