import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
    FontSize,
    JsonIndentation,
    OutputFormat,
    UserPreferences,
} from '@/types';

const STORAGE_KEY = 'structlogr:user-preferences';

export type { FontSize, JsonIndentation, OutputFormat };

export type Settings = UserPreferences;

const defaultSettings: Settings = {
    outputFormat: 'json',
    jsonIndentation: 2,
    autoCopyResults: false,
    showLineNumbers: true,
    saveToHistory: true,
    anonymousAnalytics: true,
    avoidSensitiveStorage: false,
    fontSize: 'medium',
    reduceAnimations: false,
    customApiEndpoint: '',
    apiKey: '',
    timeoutSeconds: 30,
};

const validOutputFormats: OutputFormat[] = ['json', 'table', 'cards'];
const validIndentation: JsonIndentation[] = [2, 4, 'tab'];
const validFontSizes: FontSize[] = ['small', 'medium', 'large'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const sanitizeSettings = (value: unknown): Settings => {
    if (!isRecord(value)) {
        return { ...defaultSettings };
    }

    const settings: Settings = { ...defaultSettings };

    if (
        typeof value.outputFormat === 'string' &&
        validOutputFormats.includes(value.outputFormat as OutputFormat)
    ) {
        settings.outputFormat = value.outputFormat as OutputFormat;
    }

    if (
        (value.jsonIndentation === 2 ||
            value.jsonIndentation === 4 ||
            value.jsonIndentation === 'tab') &&
        validIndentation.includes(value.jsonIndentation as JsonIndentation)
    ) {
        settings.jsonIndentation = value.jsonIndentation as JsonIndentation;
    }

    if (typeof value.autoCopyResults === 'boolean') {
        settings.autoCopyResults = value.autoCopyResults;
    }

    if (typeof value.showLineNumbers === 'boolean') {
        settings.showLineNumbers = value.showLineNumbers;
    }

    if (typeof value.saveToHistory === 'boolean') {
        settings.saveToHistory = value.saveToHistory;
    }

    if (typeof value.anonymousAnalytics === 'boolean') {
        settings.anonymousAnalytics = value.anonymousAnalytics;
    }

    if (typeof value.avoidSensitiveStorage === 'boolean') {
        settings.avoidSensitiveStorage = value.avoidSensitiveStorage;
    }

    if (
        typeof value.fontSize === 'string' &&
        validFontSizes.includes(value.fontSize as FontSize)
    ) {
        settings.fontSize = value.fontSize as FontSize;
    }

    if (typeof value.reduceAnimations === 'boolean') {
        settings.reduceAnimations = value.reduceAnimations;
    }

    if (typeof value.customApiEndpoint === 'string') {
        settings.customApiEndpoint = value.customApiEndpoint;
    }

    if (typeof value.apiKey === 'string') {
        settings.apiKey = value.apiKey;
    }

    if (
        typeof value.timeoutSeconds === 'number' &&
        !Number.isNaN(value.timeoutSeconds)
    ) {
        settings.timeoutSeconds = Math.max(
            5,
            Math.min(120, value.timeoutSeconds),
        );
    }

    return settings;
};

export function useSettings() {
    const { auth } = usePage<{
        auth: { user: { preferences: UserPreferences } | null };
    }>().props;

    const [settings, setSettings] = useState<Settings>(() => {
        if (auth.user?.preferences) {
            return sanitizeSettings(auth.user.preferences);
        }

        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return { ...defaultSettings };

            const parsed = JSON.parse(raw);
            return sanitizeSettings(parsed);
        } catch (error) {
            console.warn('Failed to load user settings', error);
            return { ...defaultSettings };
        }
    });

    useEffect(() => {
        if (auth.user?.preferences) {
            setSettings(sanitizeSettings(auth.user.preferences));
        }
    }, [auth.user?.preferences]);

    useEffect(() => {
        if (!auth.user) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
            } catch (error) {
                console.warn('Failed to persist user settings', error);
            }
        }
    }, [settings, auth.user]);

    const updateSetting = useCallback(
        <Key extends keyof Settings>(key: Key, value: Settings[Key]) => {
            const newSettings = { ...settings, [key]: value };
            setSettings(newSettings);

            if (auth.user) {
                router.patch(
                    '/settings/preferences',
                    {
                        preferences: newSettings as unknown as Record<
                            string,
                            string | number | boolean
                        >,
                    },
                    {
                        preserveState: true,
                        preserveScroll: true,
                        only: ['auth'],
                    },
                );
            } else {
                try {
                    localStorage.setItem(
                        STORAGE_KEY,
                        JSON.stringify(newSettings),
                    );
                } catch (error) {
                    console.warn('Failed to persist user settings', error);
                }
            }
        },
        [settings, auth.user],
    );

    const resetSettings = useCallback(() => {
        setSettings({ ...defaultSettings });

        if (auth.user) {
            router.patch(
                '/settings/preferences',
                {
                    preferences: defaultSettings as unknown as Record<
                        string,
                        string | number | boolean
                    >,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    only: ['auth'],
                },
            );
        } else {
            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch (error) {
                console.warn('Failed to clear user settings', error);
            }
        }
    }, [auth.user]);

    const derived = useMemo(
        () => ({
            isCustomEndpoint: Boolean(settings.customApiEndpoint),
            isAnalyticsEnabled: settings.anonymousAnalytics,
        }),
        [settings.customApiEndpoint, settings.anonymousAnalytics],
    );

    return {
        settings,
        updateSetting,
        resetSettings,
        defaultSettings,
        derived,
    };
}
