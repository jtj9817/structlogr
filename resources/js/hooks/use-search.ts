import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { SearchResponse, SearchResult, SearchScope } from '@/types/search';

const DEFAULT_DEBOUNCE_MS = 250;
const DEFAULT_LIMIT = 20;
const FALLBACK_ORIGIN = 'http://localhost';

type SearchStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseSearchOptions {
    endpoint?: string | null;
    defaultScope?: SearchScope;
    limit?: number;
    debounceMs?: number;
    enabled?: boolean;
}

interface UseSearchReturn {
    query: string;
    setQuery: (value: string) => void;
    scope: SearchScope;
    setScope: (value: SearchScope) => void;
    results: SearchResult[];
    meta: SearchResponse['meta'] | null;
    status: SearchStatus;
    error: string | null;
    isSearching: boolean;
    lastFetchedQuery: string;
    canSearch: boolean;
    performSearch: (override?: { query?: string; scope?: SearchScope }) => Promise<void>;
    reset: () => void;
}

function normalizeScope(value?: SearchScope): SearchScope {
    if (value === 'recent' || value === 'saved') {
        return value;
    }

    return 'all';
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
    const { endpoint, defaultScope, limit, debounceMs = DEFAULT_DEBOUNCE_MS, enabled = true } =
        options;
    const normalizedEndpoint = endpoint?.trim() ? endpoint.trim() : null;
    const normalizedLimit = useMemo(() => {
        const rawLimit = typeof limit === 'number' ? limit : DEFAULT_LIMIT;
        return Math.max(1, Math.min(rawLimit, 50));
    }, [limit]);
    const defaultScopeValue = useMemo(
        () => normalizeScope(defaultScope),
        [defaultScope],
    );

    const [query, setQuery] = useState('');
    const [scope, setScopeState] = useState<SearchScope>(defaultScopeValue);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [meta, setMeta] = useState<SearchResponse['meta'] | null>(null);
    const [status, setStatus] = useState<SearchStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [lastFetchedQuery, setLastFetchedQuery] = useState('');

    const controllerRef = useRef<AbortController | null>(null);
    const debounceRef = useRef<number>();
    const lastRequestRef = useRef<{ query: string; scope: SearchScope } | null>(null);

    const isClient = typeof window !== 'undefined';
    const canSearch = Boolean(normalizedEndpoint) && enabled && isClient;

    const clearDebounce = useCallback(() => {
        if (!isClient) {
            return;
        }

        if (debounceRef.current) {
            window.clearTimeout(debounceRef.current);
            debounceRef.current = undefined;
        }
    }, [isClient]);

    const abortPending = useCallback(() => {
        if (controllerRef.current) {
            controllerRef.current.abort();
            controllerRef.current = null;
        }
    }, []);

    const reset = useCallback(() => {
        abortPending();
        clearDebounce();
        setQuery('');
        setResults([]);
        setMeta(null);
        setStatus('idle');
        setError(null);
        setLastFetchedQuery('');
        lastRequestRef.current = null;
        setScopeState(defaultScopeValue);
    }, [abortPending, clearDebounce, defaultScopeValue]);

    const performSearch = useCallback(
        async (override?: { query?: string; scope?: SearchScope }) => {
            if (!canSearch || !normalizedEndpoint) {
                return;
            }

            const nextScope = normalizeScope(override?.scope ?? scope);
            const trimmedQuery = (override?.query ?? query).trim();

            const hasMinimumQuery = trimmedQuery.length >= 2;
            if (!hasMinimumQuery) {
                abortPending();
                clearDebounce();
                setResults([]);
                setMeta(null);
                setStatus('idle');
                setError(null);
                setLastFetchedQuery('');
                lastRequestRef.current = null;

                return;
            }

            abortPending();
            clearDebounce();

            const controller = new AbortController();
            controllerRef.current = controller;

            setStatus('loading');
            setError(null);
            lastRequestRef.current = {
                query: trimmedQuery,
                scope: nextScope,
            };

            try {
                const baseOrigin = isClient ? window.location.origin : FALLBACK_ORIGIN;
                const url = normalizedEndpoint.startsWith('http')
                    ? new URL(normalizedEndpoint)
                    : new URL(normalizedEndpoint, baseOrigin);

                url.searchParams.set('query', trimmedQuery);
                url.searchParams.set('scope', nextScope);
                url.searchParams.set('limit', String(normalizedLimit));

                const response = await fetch(url.toString(), {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    signal: controller.signal,
                });

                if (response.status === 204) {
                    setResults([]);
                    setMeta({
                        limit: normalizedLimit,
                        count: 0,
                        scope: nextScope,
                    });
                    setStatus('success');
                    setLastFetchedQuery(trimmedQuery);
                    return;
                }

                if (response.status === 401) {
                    setResults([]);
                    setMeta(null);
                    setStatus('error');
                    setError('Your session has expired. Please sign in again.');
                    return;
                }

                if (response.status === 422) {
                    let message = 'Enter at least 2 characters to search your history.';

                    try {
                        const data = (await response.json()) as {
                            message?: string;
                            errors?: Record<string, string[]>;
                        };
                        const validationMessage =
                            data.errors?.query?.[0] ?? data.message;

                        if (validationMessage) {
                            message = validationMessage;
                        }
                    } catch {
                        // Ignore JSON parsing failures for validation errors.
                    }

                    setResults([]);
                    setMeta(null);
                    setStatus('error');
                    setError(message);
                    setLastFetchedQuery('');
                    return;
                }

                if (!response.ok) {
                    setResults([]);
                    setMeta(null);
                    setStatus('error');
                    setError('Search failed. Please try again.');
                    setLastFetchedQuery('');
                    return;
                }

                const payload = (await response.json()) as { data: SearchResponse };
                setResults(payload.data.results);
                setMeta(payload.data.meta);
                setStatus('success');
                setError(null);
                setLastFetchedQuery(payload.data.query);
            } catch (error) {
                if (
                    error instanceof DOMException &&
                    error.name === 'AbortError'
                ) {
                    return;
                }

                setStatus('error');
                setError('Search failed. Please try again.');
            } finally {
                controllerRef.current = null;
            }
        },
        [
            abortPending,
            canSearch,
            clearDebounce,
            isClient,
            normalizedEndpoint,
            normalizedLimit,
            query,
            scope,
        ],
    );

    useEffect(() => {
        if (!canSearch) {
            abortPending();
            clearDebounce();
            setResults([]);
            setMeta(null);
            setStatus('idle');
            setError(null);
            setLastFetchedQuery('');
            lastRequestRef.current = null;

            return;
        }

        const trimmed = query.trim();
        const minimumReached = trimmed.length >= 2;

        if (!minimumReached) {
            abortPending();
            clearDebounce();
            if (trimmed.length === 0) {
                setResults([]);
                setMeta(null);
                setStatus('idle');
                setError(null);
                setLastFetchedQuery('');
                lastRequestRef.current = null;
            }

            return;
        }

        if (
            lastRequestRef.current &&
            lastRequestRef.current.query === trimmed &&
            lastRequestRef.current.scope === scope &&
            status !== 'idle'
        ) {
            return;
        }

        if (!isClient) {
            return;
        }

        clearDebounce();
        debounceRef.current = window.setTimeout(() => {
            void performSearch({ query: trimmed, scope });
        }, debounceMs);

        return () => {
            clearDebounce();
        };
    }, [
        abortPending,
        canSearch,
        clearDebounce,
        debounceMs,
        isClient,
        performSearch,
        query,
        scope,
        status,
    ]);

    useEffect(
        () => () => {
            abortPending();
            clearDebounce();
        },
        [abortPending, clearDebounce],
    );

    const setScope = useCallback(
        (value: SearchScope) => {
            const normalized = normalizeScope(value);
            setScopeState(normalized);
        },
        [],
    );

    const isSearching = status === 'loading';

    return {
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
        canSearch,
        performSearch,
        reset,
    };
}
