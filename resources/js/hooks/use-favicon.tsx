import {
    DEFAULT_FAVICON_HREF,
    FAVICON_CANDIDATES,
    FAVICON_IDS,
    type FaviconId,
} from '@/data/favicons';
import { useCallback, useEffect, useState } from 'react';

export type { FaviconId };

const STORAGE_KEY = 'structlogr-favicon';
const FAVICON_EVENT = 'structlogr:favicon-changed';

const isFaviconId = (value: unknown): value is FaviconId =>
    typeof value === 'string' && FAVICON_IDS.includes(value as FaviconId);

const faviconHref = (id: FaviconId): string =>
    FAVICON_CANDIDATES.find((candidate) => candidate.id === id)?.href ??
    DEFAULT_FAVICON_HREF;

const applyFavicon = (id: FaviconId | null) => {
    if (typeof document === 'undefined') {
        return;
    }

    const href = id ? faviconHref(id) : DEFAULT_FAVICON_HREF;

    let svgLink = document.querySelector<HTMLLinkElement>(
        'link[rel="icon"][type="image/svg+xml"]',
    );

    if (!svgLink) {
        svgLink = document.createElement('link');
        svgLink.rel = 'icon';
        svgLink.type = 'image/svg+xml';
        document.head.appendChild(svgLink);
    }

    svgLink.href = href;

    // Browsers that don't speak SVG fall back to the legacy link untouched;
    // everyone else prefers the SVG we just pointed at the selection.
};

export function initializeFavicon() {
    if (typeof window === 'undefined') {
        return;
    }

    // A valid ?favicon= URL parameter wins and is persisted —
    // handy for sharing direct links to a candidate.
    const param = new URLSearchParams(window.location.search).get('favicon');
    if (isFaviconId(param)) {
        localStorage.setItem(STORAGE_KEY, param);
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    applyFavicon(isFaviconId(saved) ? saved : null);

    // Keep tabs (and multiple hook instances) in sync.
    window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY) {
            applyFavicon(isFaviconId(event.newValue) ? event.newValue : null);
        }
    });
}

export function useFavicon() {
    // `null` means “whatever ships by default” — i.e. /favicon.svg.
    const [favicon, setFavicon] = useState<FaviconId | null>(null);

    const updateFavicon = useCallback((next: FaviconId) => {
        setFavicon(next);
        localStorage.setItem(STORAGE_KEY, next);
        applyFavicon(next);
        window.dispatchEvent(
            new CustomEvent<FaviconId>(FAVICON_EVENT, { detail: next }),
        );
    }, []);

    const resetFavicon = useCallback(() => {
        setFavicon(null);
        localStorage.removeItem(STORAGE_KEY);
        applyFavicon(null);
        window.dispatchEvent(new CustomEvent(FAVICON_EVENT, { detail: null }));
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (isFaviconId(saved)) {
            setFavicon(saved);
        }

        const onChange = (event: Event) => {
            const detail = (event as CustomEvent<FaviconId | null>).detail;
            setFavicon(isFaviconId(detail) ? detail : null);
        };

        window.addEventListener(FAVICON_EVENT, onChange);

        return () => window.removeEventListener(FAVICON_EVENT, onChange);
    }, []);

    return { favicon, updateFavicon, resetFavicon } as const;
}
