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
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <History className="h-12 w-12 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="flex w-full max-w-lg flex-col gap-6 px-4 py-6 sm:px-6 lg:max-w-xl"
            >
                <SheetHeader className="text-left">
                    <SheetTitle className="text-xl font-semibold">
                        History
                    </SheetTitle>
                </SheetHeader>

                <Tabs
                    defaultValue="recent"
                    className="flex flex-1 flex-col gap-4"
                >
                    <TabsList className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
                        <TabsTrigger value="recent">Recent</TabsTrigger>
                        <TabsTrigger value="saved">Saved</TabsTrigger>
                    </TabsList>

                    <TabsContent
                        value="recent"
                        className="flex flex-1 flex-col"
                    >
                        <ScrollArea className="flex-1 rounded-lg border border-border/40 bg-background/80 pr-4">
                            {recentEntries.length === 0 ? (
                                <EmptyState message="No recent entries yet" />
                            ) : (
                                <div className="space-y-3 p-4">
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

                    <TabsContent
                        value="saved"
                        className="flex flex-1 flex-col"
                    >
                        <ScrollArea className="flex-1 rounded-lg border border-border/40 bg-background/80 pr-4">
                            {savedEntries.length === 0 ? (
                                <EmptyState message="No saved entries yet" />
                            ) : (
                                <div className="space-y-3 p-4">
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

                <div className="flex flex-col gap-2 border-t border-border/40 pt-4 sm:flex-row sm:items-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={exportHistory}
                        className="flex-1 justify-center"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearHistory}
                        className="flex-1 justify-center text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear All
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
