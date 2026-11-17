import { useCallback, useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

const prefersDark = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const getCookie = (name: string) => {
    if (typeof document === 'undefined') {
        return null;
    }

    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));

    return match ? decodeURIComponent(match[1]) : null;
};

const isAppearance = (value: unknown): value is Appearance =>
    value === 'light' || value === 'dark' || value === 'system';

/**
 * Single source of truth for the stored appearance: localStorage first,
 * then the SSR cookie, then 'system'. Keeps the blade-rendered favicon
 * (cookie-derived) and the JS resolution (localStorage) in agreement.
 */
const getStoredAppearance = (): Appearance => {
    if (typeof window === 'undefined') {
        return 'system';
    }

    const stored = localStorage.getItem('appearance');
    if (isAppearance(stored)) {
        return stored;
    }

    const cookie = getCookie('appearance');
    return isAppearance(cookie) ? cookie : 'system';
};

/**
 * Themed favicon: light → Verdant, dark → Ultraviolet,
 * anything else (system/default) → Glacier (/favicon.svg).
 * The blade renders the same mapping for first paint.
 */
const FAVICON_HREF: Record<Appearance, string> = {
    light: '/favicons/favicon-02-verdant.svg',
    dark: '/favicons/favicon-05-ultraviolet.svg',
    system: '/favicon.svg',
};

const applyFavicon = (appearance: Appearance) => {
    if (typeof document === 'undefined') {
        return;
    }

    let link = document.querySelector<HTMLLinkElement>(
        'link[rel="icon"][type="image/svg+xml"]',
    );

    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/svg+xml';
        document.head.appendChild(link);
    }

    link.href = FAVICON_HREF[appearance] ?? FAVICON_HREF.system;
};

const applyTheme = (appearance: Appearance) => {
    const isDark =
        appearance === 'dark' || (appearance === 'system' && prefersDark());

    // Add transition class for smooth theme change
    document.documentElement.classList.add('theme-transition');

    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';

    applyFavicon(appearance);

    // Remove transition class after animation completes
    setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
    }, 300);
};

const mediaQuery = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.matchMedia('(prefers-color-scheme: dark)');
};

const handleSystemThemeChange = () => {
    applyTheme(getStoredAppearance());
};

export function initializeTheme() {
    applyTheme(getStoredAppearance());

    // Add the event listener for system theme changes...
    mediaQuery()?.addEventListener('change', handleSystemThemeChange);
}

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>('system');

    const updateAppearance = useCallback((mode: Appearance) => {
        setAppearance(mode);

        // Store in localStorage for client-side persistence...
        localStorage.setItem('appearance', mode);

        // Store in cookie for SSR...
        setCookie('appearance', mode);

        applyTheme(mode);
    }, []);

    useEffect(() => {
        updateAppearance(getStoredAppearance());

        return () =>
            mediaQuery()?.removeEventListener(
                'change',
                handleSystemThemeChange,
            );
    }, [updateAppearance]);

    return { appearance, updateAppearance } as const;
}
