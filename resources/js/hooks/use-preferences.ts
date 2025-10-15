import type { FormattingPreferences } from '@/types/preferences';
import { useEffect, useState } from 'react';

const PREFERENCES_KEY = 'formatting-preferences';

const defaultPreferences: FormattingPreferences = {
    includeMetadata: true,
    parseTimestamps: true,
    normalizeLogLevels: true,
    timezone: 'UTC',
    dateFormat: 'ISO8601',
};

export function usePreferences() {
    const [preferences, setPreferences] =
        useState<FormattingPreferences>(defaultPreferences);

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
        }
    }, []);

    // Save preferences to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }, [preferences]);

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
