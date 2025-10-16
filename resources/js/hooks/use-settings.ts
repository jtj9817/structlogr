import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'structlogr:user-preferences';

export type OutputFormat = 'json' | 'table' | 'cards';
export type JsonIndentation = 2 | 4 | 'tab';
export type FontSize = 'small' | 'medium' | 'large';

export interface Settings {
    outputFormat: OutputFormat;
    jsonIndentation: JsonIndentation;
    autoCopyResults: boolean;
    showLineNumbers: boolean;
    saveToHistory: boolean;
    anonymousAnalytics: boolean;
    avoidSensitiveStorage: boolean;
    fontSize: FontSize;
    reduceAnimations: boolean;
    customApiEndpoint: string;
    apiKey: string;
    timeoutSeconds: number;
}

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

    if (typeof value.timeoutSeconds === 'number' && !Number.isNaN(value.timeoutSeconds)) {
        settings.timeoutSeconds = Math.max(5, Math.min(120, value.timeoutSeconds));
    }

    return settings;
};

export function useSettings() {
    const [settings, setSettings] = useState<Settings>({ ...defaultSettings });

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;

            const parsed = JSON.parse(raw);
            setSettings(sanitizeSettings(parsed));
        } catch (error) {
            console.warn('Failed to load user settings', error);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.warn('Failed to persist user settings', error);
        }
    }, [settings]);

    const updateSetting = useCallback(
        <Key extends keyof Settings>(key: Key, value: Settings[Key]) => {
            setSettings((prev) => ({
                ...prev,
                [key]: value,
            }));
        },
        [],
    );

    const resetSettings = useCallback(() => {
        setSettings({ ...defaultSettings });
    }, []);

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
