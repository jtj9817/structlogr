import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useClipboard } from '@/hooks/use-clipboard';
import type { HistoryEntry } from '@/types/history';
import { Clock, Copy, FileText, Star, Trash2 } from 'lucide-react';

interface HistoryEntryCardProps {
    entry: HistoryEntry;
    onLoad: () => void;
    onDelete: () => void;
    onToggleSave: () => void;
    onCopy: () => Promise<string | null>;
    disabled?: boolean;
}

export function HistoryEntryCard({
    entry,
    onLoad,
    onDelete,
    onToggleSave,
    onCopy,
    disabled = false,
}: HistoryEntryCardProps) {
    const [, copy] = useClipboard();

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString();
    };

    const handleCopy = async () => {
        const payload = await onCopy();
        if (!payload) {
            return;
        }

        await copy(payload);
    };

    const headline = entry.title ?? entry.summary ?? entry.preview;
    const logTypeLabel = entry.detectedLogType
        ? entry.detectedLogType.replace(/_/g, ' ')
        : 'log entry';

    return (
        <Card
            id={`history-entry-${entry.id}`}
            className="group cursor-pointer p-3 transition-all hover:scale-[1.01] hover:shadow-md active:scale-[0.99] overflow-hidden"
            onClick={(e) => {
                if (disabled) return;
                const target = e.target as HTMLElement;
                if (!target.closest('button')) {
                    onLoad();
                }
            }}
        >
            <div className="flex items-start gap-2 min-w-0">
                <FileText
                    id={`history-entry-icon-${entry.id}`}
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground"
                />

                <div className="min-w-0 flex-1 overflow-hidden">
                    <p
                        id={`history-entry-headline-${entry.id}`}
                        className="truncate text-sm font-medium text-foreground"
                    >
                        {headline}
                    </p>
                    <div
                        id={`history-entry-metadata-${entry.id}`}
                        className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground overflow-hidden"
                    >
                        <Clock
                            id={`history-entry-clock-${entry.id}`}
                            className="h-3 w-3"
                        />
                        <span id={`history-entry-date-${entry.id}`} className="flex-shrink-0">
                            {formatDate(entry.createdAt)}
                        </span>
                        <span className="text-muted-foreground/50 flex-shrink-0">•</span>
                        <span
                            id={`history-entry-type-${entry.id}`}
                            className="tracking-wide uppercase truncate"
                        >
                            {logTypeLabel}
                        </span>
                        <span className="text-muted-foreground/50 flex-shrink-0">•</span>
                        <span id={`history-entry-fields-${entry.id}`} className="flex-shrink-0">
                            {entry.fieldCount ?? 0} fields
                        </span>
                    </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-1">
                    <Button
                        id={`history-entry-star-${entry.id}`}
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleSave();
                        }}
                        className="h-8 w-8 p-0"
                        disabled={disabled}
                        aria-label={
                            entry.isSaved ? 'Unsave entry' : 'Save entry'
                        }
                    >
                        <Star
                            id={`history-entry-star-icon-${entry.id}`}
                            className={`h-4 w-4 ${entry.isSaved ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`}
                        />
                    </Button>
                    <Button
                        id={`history-entry-copy-${entry.id}`}
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCopy();
                        }}
                        className="h-8 w-8 p-0"
                        disabled={disabled}
                        aria-label="Copy entry"
                    >
                        <Copy
                            id={`history-entry-copy-icon-${entry.id}`}
                            className="h-4 w-4"
                        />
                    </Button>
                    <Button
                        id={`history-entry-delete-${entry.id}`}
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                        disabled={disabled}
                        aria-label="Delete entry"
                    >
                        <Trash2
                            id={`history-entry-delete-icon-${entry.id}`}
                            className="h-4 w-4"
                        />
                    </Button>
                </div>
            </div>
        </Card>
    );
}
