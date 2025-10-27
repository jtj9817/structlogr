import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useSearch } from '@/hooks/use-search';
import type { SearchResult, SearchScope } from '@/types/search';
import { AlertCircle, Clock, Inbox, Search as SearchIcon, Star } from 'lucide-react';

interface SearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    searchRoute?: string | null;
    canSearch: boolean;
    onSelectResult?: (entryId: number) => Promise<void> | void;
    defaultScope?: SearchScope;
}

const MIN_QUERY_HINT = 'Type at least two characters to search your history.';

function getHeadline(result: SearchResult): string {
    return (
        result.title ??
        result.summary ??
        result.preview ??
        `Entry ${result.id}`
    );
}

function formatTimestamp(isoString: string): string {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
        return isoString;
    }

    return date.toLocaleString();
}

export function SearchDialog({
    open,
    onOpenChange,
    searchRoute,
    canSearch,
    onSelectResult,
    defaultScope = 'all',
}: SearchDialogProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const resultRefs = useRef<Record<number, HTMLButtonElement | null>>({});
    const [selectionError, setSelectionError] = useState<string | null>(null);
    const [pendingSelection, setPendingSelection] = useState<number | null>(null);

    const {
        query,
        setQuery,
        scope,
        setScope,
        results,
        meta,
        status,
        error,
        isSearching,
        lastFetchedQuery,
        performSearch,
        reset,
    } = useSearch({
        endpoint: searchRoute,
        enabled: open && canSearch,
        defaultScope,
    });

    const trimmedQuery = useMemo(() => query.trim(), [query]);
    const hasMinimumQuery = trimmedQuery.length >= 2;
    const hasResults = results.length > 0;
    const hasSearched = Boolean(lastFetchedQuery);
    const noMatches =
        !isSearching && hasSearched && !hasResults && !error && hasMinimumQuery;
    const metaSummary = useMemo(() => {
        if (!meta) {
            return null;
        }

        const scopeLabel = meta.scope.charAt(0).toUpperCase() + meta.scope.slice(1);

        return {
            count: meta.count,
            scopeLabel,
        };
    }, [meta]);

    useEffect(() => {
        resultRefs.current = {};
    }, [results]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        if (!open) {
            reset();
            setSelectionError(null);
            setPendingSelection(null);

            return;
        }

        const focusTimer = window.setTimeout(() => {
            inputRef.current?.focus();
        }, 50);

        return () => {
            window.clearTimeout(focusTimer);
        };
    }, [open, reset]);

    const handleDialogChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            reset();
            setSelectionError(null);
            setPendingSelection(null);
        }

        onOpenChange(nextOpen);
    };

    const focusFirstResult = useCallback(() => {
        if (!results.length) {
            return;
        }

        const first = resultRefs.current[results[0]!.id];
        first?.focus();
    }, [results]);

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            focusFirstResult();
        }

        if (event.key === 'Enter' && hasMinimumQuery) {
            event.preventDefault();
            void performSearch({ query: trimmedQuery, scope });
        }
    };

    const handleScopeChange = (value: string) => {
        if (!value) {
            return;
        }

        setScope(value as SearchScope);
    };

    const handleResultSelect = async (entry: SearchResult) => {
        if (!onSelectResult) {
            handleDialogChange(false);
            return;
        }

        try {
            setSelectionError(null);
            setPendingSelection(entry.id);
            await onSelectResult(entry.id);
            handleDialogChange(false);
        } catch (selectionException) {
            console.error('Failed to open history entry from search', selectionException);
            setSelectionError('Unable to open history entry. Please try again.');
        } finally {
            setPendingSelection(null);
        }
    };

    const renderResults = () => {
        if (!hasMinimumQuery && !hasResults && !isSearching && !error) {
            return (
                <div className="rounded-md border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
                    {MIN_QUERY_HINT}
                </div>
            );
        }

        if (isSearching) {
            return (
                <div className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
                    <Spinner className="size-4" />
                    <span>Searching your history…</span>
                </div>
            );
        }

        if (noMatches) {
            return (
                <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
                    <Inbox className="size-10 text-muted-foreground/50" aria-hidden="true" />
                    <p>No matches for “{lastFetchedQuery}”.</p>
                    <p className="text-xs text-muted-foreground/80">
                        Try another keyword or switch scopes.
                    </p>
                </div>
            );
        }

        if (!results.length) {
            return null;
        }

        return (
            <ScrollArea className="max-h-[50vh] rounded-md border border-border/70">
                <ul role="list" className="divide-y divide-border/70">
                    {results.map((result) => {
                        const headline = getHeadline(result);
                        const logTypeLabel = result.detectedLogType
                            ? result.detectedLogType.replace(/_/g, ' ')
                            : 'log entry';

                        return (
                            <li key={result.id}>
                                <button
                                    ref={(element) => {
                                        resultRefs.current[result.id] = element ?? null;
                                    }}
                                    type="button"
                                    className="flex w-full flex-col gap-2 px-4 py-3 text-left transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                    onClick={() => void handleResultSelect(result)}
                                    disabled={pendingSelection === result.id}
                                    aria-label={`Open ${headline}`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="truncate text-sm font-medium text-foreground">
                                            {headline}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={result.collection === 'saved' ? 'default' : 'secondary'}
                                            >
                                                {result.collection === 'saved' ? 'Saved' : 'Recent'}
                                            </Badge>
                                            {result.isSaved && (
                                                <Star
                                                    className="size-3 text-yellow-400"
                                                    aria-hidden="true"
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <p className="line-clamp-2 text-xs text-muted-foreground">
                                        {result.preview}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        <span className="inline-flex items-center gap-1">
                                            <Clock className="size-3" aria-hidden="true" />
                                            <span>{formatTimestamp(result.createdAt)}</span>
                                        </span>
                                        <span aria-hidden="true" className="text-muted-foreground/50">
                                            •
                                        </span>
                                        <span className="uppercase tracking-wide">
                                            {logTypeLabel}
                                        </span>
                                        <span aria-hidden="true" className="text-muted-foreground/50">
                                            •
                                        </span>
                                        <span>{result.fieldCount} fields</span>
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </ScrollArea>
        );
    };

    return (
        <Dialog open={open} onOpenChange={handleDialogChange}>
            <DialogContent id="search-dialog" className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Search history</DialogTitle>
                    <DialogDescription>
                        Quickly find recent and saved logs without leaving your work.
                    </DialogDescription>
                </DialogHeader>

                {!canSearch ? (
                    <div className="flex min-h-[160px] items-center justify-center rounded-md border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
                        Sign in to search your history.
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
                            <div className="relative flex-1">
                                <SearchIcon
                                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                                    aria-hidden="true"
                                />
                                <Input
                                    ref={inputRef}
                                    id="search-dialog-input"
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    onKeyDown={handleInputKeyDown}
                                    placeholder="Search formatted logs…"
                                    autoComplete="off"
                                    spellCheck={false}
                                    className="pl-9"
                                />
                            </div>
                            <ToggleGroup
                                type="single"
                                variant="outline"
                                size="sm"
                                value={scope}
                                onValueChange={handleScopeChange}
                                aria-label="Filter search results"
                                className="inline-flex sm:w-auto"
                            >
                                <ToggleGroupItem value="all">All</ToggleGroupItem>
                                <ToggleGroupItem value="recent">Recent</ToggleGroupItem>
                                <ToggleGroupItem value="saved">Saved</ToggleGroupItem>
                            </ToggleGroup>
                        </div>

                        {(error || selectionError) && (
                            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                <AlertCircle className="mt-0.5 size-4" aria-hidden="true" />
                                <div className="flex-1">
                                    {selectionError ?? error}
                                </div>
                                {error && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => void performSearch({ query: trimmedQuery, scope })}
                                        disabled={isSearching}
                                    >
                                        Retry
                                    </Button>
                                )}
                            </div>
                        )}

                        {metaSummary && hasResults && (
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                {metaSummary.count}{' '}
                                {metaSummary.count === 1 ? 'result' : 'results'} • Scope:{' '}
                                {metaSummary.scopeLabel}
                            </p>
                        )}

                        {renderResults()}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
