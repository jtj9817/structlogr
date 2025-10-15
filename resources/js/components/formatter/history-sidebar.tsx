import { HistoryEntryCard } from '@/components/formatter/history-entry-card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHistory } from '@/hooks/use-history';
import type { HistoryEntry } from '@/types/history';
import { Download, History, Trash2 } from 'lucide-react';

interface HistorySidebarProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onLoadEntry: (
        rawLog: string,
        formattedLog: Record<string, unknown>,
    ) => void;
}

export function HistorySidebar({
    open,
    onOpenChange,
    onLoadEntry,
}: HistorySidebarProps) {
    const {
        recentEntries,
        savedEntries,
        removeEntry,
        toggleSaved,
        clearHistory,
        exportHistory,
    } = useHistory();

    const handleLoadEntry = (entry: HistoryEntry) => {
        onLoadEntry(entry.rawLog, entry.formattedLog);
        onOpenChange(false);
    };

    const handleClearHistory = () => {
        if (
            confirm(
                'Are you sure you want to clear all history? This cannot be undone.',
            )
        ) {
            clearHistory();
        }
    };

    const EmptyState = ({ message }: { message: string }) => (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <History className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">{message}</p>
        </div>
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>History</SheetTitle>
                </SheetHeader>

                <div className="mt-6">
                    <div className="mb-4 flex items-center justify-between">
                        <Tabs defaultValue="recent" className="flex-1">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="recent">Recent</TabsTrigger>
                                <TabsTrigger value="saved">Saved</TabsTrigger>
                            </TabsList>

                            <TabsContent value="recent" className="mt-4">
                                <ScrollArea className="h-[600px] pr-4">
                                    {recentEntries.length === 0 ? (
                                        <EmptyState message="No recent entries yet" />
                                    ) : (
                                        <div className="space-y-3">
                                            {recentEntries.map((entry) => (
                                                <HistoryEntryCard
                                                    key={entry.id}
                                                    entry={entry}
                                                    onLoad={() =>
                                                        handleLoadEntry(entry)
                                                    }
                                                    onDelete={() =>
                                                        removeEntry(entry.id)
                                                    }
                                                    onToggleSave={() =>
                                                        toggleSaved(entry.id)
                                                    }
                                                />
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="saved" className="mt-4">
                                <ScrollArea className="h-[600px] pr-4">
                                    {savedEntries.length === 0 ? (
                                        <EmptyState message="No saved entries yet" />
                                    ) : (
                                        <div className="space-y-3">
                                            {savedEntries.map((entry) => (
                                                <HistoryEntryCard
                                                    key={entry.id}
                                                    entry={entry}
                                                    onLoad={() =>
                                                        handleLoadEntry(entry)
                                                    }
                                                    onDelete={() =>
                                                        removeEntry(entry.id)
                                                    }
                                                    onToggleSave={() =>
                                                        toggleSaved(entry.id)
                                                    }
                                                />
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="flex gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={exportHistory}
                            className="flex-1"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearHistory}
                            className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear All
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
