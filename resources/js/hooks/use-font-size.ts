import type { FontSize } from '@/types';
import { useEffect } from 'react';
import { useSettings } from './use-settings';

/**
 * Applies font size to the DOM by setting data-font-size attribute
 */
function applyFontSize(size: FontSize): void {
    if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-font-size', size);
    }
}

/**
 * Initialize font size on app load
 * This function should be called once in app.tsx
 */
export function initializeFontSize(): void {
    // Get font size from localStorage as fallback
    const stored = localStorage.getItem('structlogr:user-preferences');
    let fontSize: FontSize = 'medium'; // default

    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (
                parsed?.fontSize &&
                ['small', 'medium', 'large'].includes(parsed.fontSize)
            ) {
                fontSize = parsed.fontSize;
            }
        } catch (error) {
            console.warn(
                'Failed to parse stored settings for font size initialization:',
                error,
            );
        }
    }

    applyFontSize(fontSize);
}

/**
 * Hook for managing font size preferences
 * Provides immediate visual feedback and persists changes
 */
export function useFontSize() {
    const { settings, updateSetting } = useSettings();

    const fontSize = settings.fontSize || 'medium';

    useEffect(() => {
        applyFontSize(fontSize);
    }, [fontSize]);

    const updateFontSize = async (newSize: FontSize) => {
        // Apply immediately for visual feedback
        applyFontSize(newSize);

        // Update settings (will handle persistence)
        updateSetting('fontSize', newSize);
    };

    return {
        fontSize,
        updateFontSize,
    };
}
