import type { FormattingPreferences } from '@/types/preferences';
import { useEffect, useState } from 'react';

const PREFERENCES_KEY = 'formatting-preferences';
const PREFERENCES_CHANGE_EVENT = 'preferences-changed';

const defaultPreferences: FormattingPreferences = {
    includeMetadata: true,
    parseTimestamps: true,
    normalizeLogLevels: true,
    timezone: 'UTC',
    dateFormat: 'ISO8601',
    llmModel: 'deepseek-chat',
};

export function usePreferences() {
    const [preferences, setPreferences] =
        useState<FormattingPreferences>(defaultPreferences);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load preferences from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(PREFERENCES_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setPreferences({ ...defaultPreferences, ...parsed });
            }
        } catch (error) {
            console.error('Failed to load preferences:', error);
        } finally {
            setIsInitialized(true);
        }
    }, []);

    // Listen for preference changes from other components
    useEffect(() => {
        const handlePreferencesChange = () => {
            try {
                const stored = localStorage.getItem(PREFERENCES_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    const newPreferences = { ...defaultPreferences, ...parsed };
                    
                    // Only update if preferences actually changed to prevent infinite loops
                    if (JSON.stringify(newPreferences) !== JSON.stringify(preferences)) {
                        setPreferences(newPreferences);
                    }
                }
            } catch (error) {
                console.error('Failed to load preferences on change:', error);
            }
        };

        window.addEventListener(PREFERENCES_CHANGE_EVENT, handlePreferencesChange);

        return () => {
            window.removeEventListener(PREFERENCES_CHANGE_EVENT, handlePreferencesChange);
        };
    }, [preferences]);

    // Save preferences to localStorage whenever they change (skip initial load)
    useEffect(() => {
        if (!isInitialized) {
            return;
        }

        try {
            localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
            window.dispatchEvent(new Event(PREFERENCES_CHANGE_EVENT));
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }, [preferences, isInitialized]);

    const updatePreference = <K extends keyof FormattingPreferences>(
        key: K,
        value: FormattingPreferences[K],
    ) => {
        setPreferences((prev) => ({ ...prev, [key]: value }));
    };

    const resetPreferences = () => {
        setPreferences(defaultPreferences);
    };

    const applyPreferences = (formattedLog: Record<string, unknown>) => {
        let result = { ...formattedLog };

        // Apply metadata filtering
        if (!preferences.includeMetadata && result.metadata) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { metadata, ...rest } = result;
            result = rest;
        }

        // Apply timestamp parsing
        if (preferences.parseTimestamps && result.timestamp) {
            try {
                const timestamp = result.timestamp as string;
                let parsedDate: Date;

                // Try to parse the timestamp
                if (preferences.dateFormat === 'Unix') {
                    parsedDate = new Date(parseInt(timestamp) * 1000);
                } else {
                    parsedDate = new Date(timestamp);
                }

                if (!isNaN(parsedDate.getTime())) {
                    if (preferences.dateFormat === 'ISO8601') {
                        result.timestamp = parsedDate.toISOString();
                    } else if (preferences.dateFormat === 'Unix') {
                        result.timestamp = Math.floor(
                            parsedDate.getTime() / 1000,
                        ).toString();
                    }
                }
            } catch (error) {
                // Keep original timestamp if parsing fails
                console.warn('Failed to parse timestamp:', error);
            }
        }

        // Apply log level normalization
        if (preferences.normalizeLogLevels && result.level) {
            const level = (result.level as string).toUpperCase();
            const validLevels = [
                'ERROR',
                'WARN',
                'WARNING',
                'INFO',
                'DEBUG',
                'SUCCESS',
                'FATAL',
            ];
            if (
                validLevels.includes(level) ||
                (level === 'WARN' && validLevels.includes('WARNING'))
            ) {
                result.level = level === 'WARN' ? 'WARNING' : level;
            }
        }

        return result;
    };

    return {
        preferences,
        updatePreference,
        resetPreferences,
        applyPreferences,
    };
}
