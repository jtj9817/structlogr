export interface FormattingPreferences {
    includeMetadata: boolean;
    parseTimestamps: boolean;
    normalizeLogLevels: boolean;
    timezone: 'UTC' | 'Local' | string;
    dateFormat: 'ISO8601' | 'Unix' | 'Custom';
}
