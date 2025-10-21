import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from '@/components/ui/card';
import { useClipboard } from '@/hooks/use-clipboard';
import type { HistoryEntry } from '@/types/history';
import { Clock, FileText, Star, Trash2 } from 'lucide-react';

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

    const headline = entry.summary ?? entry.preview;
    const logTypeLabel = entry.detectedLogType
        ? entry.detectedLogType.replace(/_/g, ' ')
        : 'log entry';

    return (
        <Card className="group transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="h-4 w-4" />
                        {formatDate(entry.createdAt)}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleSave}
                        className="h-8 w-8 p-0"
                        disabled={disabled}
                    >
                        <Star
                            className={`h-4 w-4 ${entry.isSaved ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`}
                        />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="pb-2">
                <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                            {headline}
                        </p>
                        <p className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">
                            {logTypeLabel} • {entry.fieldCount ?? 0} fields
                        </p>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="pt-2">
                <div className="flex w-full gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onLoad}
                        disabled={disabled}
                        className="flex-1"
                    >
                        Load
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        disabled={disabled}
                        className="px-3"
                    >
                        Copy
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDelete}
                        disabled={disabled}
                        className="px-3 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
