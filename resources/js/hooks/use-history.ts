import type { HistoryDetail, HistoryEntry } from '@/types/history';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface HistoryRoutes {
    index: string;
    detail: string;
    toggle: string;
    clear: string;
    export: string;
}

interface HistoryStatePayload {
    recent: HistoryEntry[];
    saved: HistoryEntry[];
}

interface UseHistoryOptions {
    initialHistory?: HistoryStatePayload | null;
    routes?: HistoryRoutes | null;
}

const CSRF_SELECTOR = 'meta[name="csrf-token"]';

function getCsrfToken(): string | undefined {
    if (typeof document === 'undefined') {
        return undefined;
    }

    return (
        document
            .querySelector<HTMLMetaElement>(CSRF_SELECTOR)
            ?.getAttribute('content') ?? undefined
    );
}

function buildUrl(template: string, id: number | string): string {
    return template.replace(':id', id.toString());
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);

    headers.set('Accept', 'application/json');
    headers.set('X-Requested-With', 'XMLHttpRequest');

    if (
        !headers.has('Content-Type') &&
        options.body &&
        !(options.body instanceof FormData)
    ) {
        headers.set('Content-Type', 'application/json');
    }

    const token = getCsrfToken();
    if (token && !headers.has('X-CSRF-TOKEN')) {
        headers.set('X-CSRF-TOKEN', token);
    }

    const response = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers,
    });

    if (!response.ok) {
        throw new Error(
            `History request failed with status ${response.status}`,
        );
    }

    if (response.status === 204) {
        return {} as T;
    }

    return (await response.json()) as T;
}

export function useHistory({ initialHistory, routes }: UseHistoryOptions = {}) {
    const [recentEntries, setRecentEntries] = useState<HistoryEntry[]>(
        initialHistory?.recent ?? [],
    );
    const [savedEntries, setSavedEntries] = useState<HistoryEntry[]>(
        initialHistory?.saved ?? [],
    );
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!initialHistory) {
            return;
        }

        setRecentEntries(initialHistory.recent);
        setSavedEntries(initialHistory.saved);
    }, [initialHistory]);

    const canManage = useMemo(() => Boolean(routes), [routes]);

    const syncState = useCallback((payload?: HistoryStatePayload | null) => {
        if (!payload) {
            return;
        }

        setRecentEntries(payload.recent);
        setSavedEntries(payload.saved);
    }, []);

    const loadEntry = useCallback(
        async (id: number): Promise<HistoryDetail | null> => {
            if (!routes) {
                return null;
            }

            try {
                const data = await request<{
                    data: {
                        id: number;
                        raw_log: string;
                        formatted_log: Record<string, unknown>;
                    };
                }>(buildUrl(routes.detail, id));

                return {
                    id: data.data.id,
                    rawLog: data.data.raw_log,
                    formattedLog: data.data.formatted_log,
                };
            } catch (error) {
                console.error('Failed to load history entry', error);

                return null;
            }
        },
        [routes],
    );

    const handleMutation = useCallback(
        async (url: string, method: 'DELETE' | 'PATCH') => {
            if (!routes) {
                return;
            }

            setIsLoading(true);

            try {
                const response = await request<{ data: HistoryStatePayload }>(
                    url,
                    {
                        method,
                    },
                );

                syncState(response.data);
            } catch (error) {
                console.error('History update failed', error);
            } finally {
                setIsLoading(false);
            }
        },
        [routes, syncState],
    );

    const removeEntry = useCallback(
        async (id: number) => {
            if (!routes) {
                return;
            }

            await handleMutation(buildUrl(routes.detail, id), 'DELETE');
        },
        [handleMutation, routes],
    );

    const toggleSaved = useCallback(
        async (id: number) => {
            if (!routes) {
                return;
            }

            await handleMutation(buildUrl(routes.toggle, id), 'PATCH');
        },
        [handleMutation, routes],
    );

    const clearHistory = useCallback(async () => {
        if (!routes) {
            return;
        }

        await handleMutation(routes.clear, 'DELETE');
    }, [handleMutation, routes]);

    const exportHistory = useCallback(() => {
        if (!routes) {
            return;
        }

        window.open(routes.export, '_blank', 'noopener');
    }, [routes]);

    return {
        recentEntries,
        savedEntries,
        loadEntry,
        removeEntry,
        toggleSaved,
        clearHistory,
        exportHistory,
        isLoading,
        canManage,
    };
}
