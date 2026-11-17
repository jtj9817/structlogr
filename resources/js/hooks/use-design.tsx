import { useCallback, useEffect, useState } from 'react';

export type Design = 'classic' | 'phosphor' | 'lumen' | 'nebula';

export const DESIGNS: Design[] = ['classic', 'phosphor', 'lumen', 'nebula'];

const STORAGE_KEY = 'structlogr-design';
const DESIGN_EVENT = 'structlogr:design-changed';

const isDesign = (value: unknown): value is Design =>
    typeof value === 'string' && DESIGNS.includes(value as Design);

const applyDesign = (design: Design) => {
    if (typeof document === 'undefined') {
        return;
    }

    if (design === 'classic') {
        document.documentElement.removeAttribute('data-design');
    } else {
        document.documentElement.setAttribute('data-design', design);
    }
};

export function initializeDesign() {
    if (typeof window === 'undefined') {
        return;
    }

    // A valid ?design= URL parameter wins and is persisted —
    // handy for sharing direct links to a design.
    const param = new URLSearchParams(window.location.search).get('design');
    if (isDesign(param)) {
        localStorage.setItem(STORAGE_KEY, param);
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    applyDesign(isDesign(saved) ? saved : 'classic');

    // Keep tabs (and multiple hook instances) in sync.
    window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY) {
            applyDesign(isDesign(event.newValue) ? event.newValue : 'classic');
        }
    });
}

export function useDesign() {
    const [design, setDesign] = useState<Design>('classic');

    const updateDesign = useCallback((next: Design) => {
        setDesign(next);
        localStorage.setItem(STORAGE_KEY, next);
        applyDesign(next);
        window.dispatchEvent(
            new CustomEvent<Design>(DESIGN_EVENT, { detail: next }),
        );
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (isDesign(saved) && saved !== 'classic') {
            setDesign(saved);
        }

        const onChange = (event: Event) => {
            const next = (event as CustomEvent<Design>).detail;
            if (isDesign(next)) {
                setDesign(next);
            }
        };

        window.addEventListener(DESIGN_EVENT, onChange);

        return () => window.removeEventListener(DESIGN_EVENT, onChange);
    }, []);

    return { design, updateDesign } as const;
}
