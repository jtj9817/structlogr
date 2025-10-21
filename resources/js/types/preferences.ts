export type LLMModel = 'deepseek-chat' | 'kimi-k2-turbo-preview' | 'GLM-4.5-Air' | 'GLM-4.6' | 'gemini-2.5-flash';

export interface FormattingPreferences {
    includeMetadata: boolean;
    parseTimestamps: boolean;
    normalizeLogLevels: boolean;
    timezone: 'UTC' | 'Local' | string;
    dateFormat: 'ISO8601' | 'Unix' | 'Custom';
    llmModel: LLMModel;
}
