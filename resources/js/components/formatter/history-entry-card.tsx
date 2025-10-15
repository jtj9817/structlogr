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
}

export function HistoryEntryCard({
    entry,
    onLoad,
    onDelete,
    onToggleSave,
}: HistoryEntryCardProps) {
    const [, copy] = useClipboard();

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    const getPreview = (rawLog: string) => {
        const lines = rawLog.split('\n');
        const firstLine = lines[0];
        return firstLine.length > 80
            ? firstLine.substring(0, 80) + '...'
            : firstLine;
    };

    const handleCopy = async () => {
        await copy(JSON.stringify(entry.formattedLog, null, 2));
    };

    return (
        <Card className="group transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="h-4 w-4" />
                        {formatDate(entry.timestamp)}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleSave}
                        className="h-8 w-8 p-0"
                    >
                        <Star
                            className={`h-4 w-4 ${entry.saved ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`}
                        />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="pb-2">
                <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-sm text-gray-700 dark:text-gray-300">
                            {getPreview(entry.rawLog)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {Object.keys(entry.formattedLog).length} fields
                            extracted
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
                        className="flex-1"
                    >
                        Load
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="px-3"
                    >
                        Copy
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDelete}
                        className="px-3 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
