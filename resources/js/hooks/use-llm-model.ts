import type { LLMModel } from '@/types/preferences';
import { useEffect, useState } from 'react';

const LLM_MODEL_KEY = 'llm-model-preference';
const DEFAULT_MODEL: LLMModel = 'deepseek-chat';

export function useLLMModel() {
    const [llmModel, setLLMModel] = useState<LLMModel>(DEFAULT_MODEL);
    const [storageError, setStorageError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(LLM_MODEL_KEY);
            if (stored && isValidLLMModel(stored)) {
                setLLMModel(stored as LLMModel);
            }
        } catch (error) {
            console.error('Failed to load LLM model preference:', error);
            setStorageError('Failed to load saved model preference');
        }
    }, []);

    const updateLLMModel = (model: LLMModel) => {
        try {
            setLLMModel(model);

            if (model === DEFAULT_MODEL) {
                localStorage.removeItem(LLM_MODEL_KEY);
            } else {
                localStorage.setItem(LLM_MODEL_KEY, model);
            }

            setStorageError(null);
        } catch (error) {
            console.error('Failed to save LLM model preference:', error);

            if (error instanceof Error && error.name === 'QuotaExceededError') {
                setStorageError('Storage quota exceeded. Unable to save preference.');
            } else {
                setStorageError('Failed to save model preference');
            }
        }
    };

    return {
        llmModel,
        updateLLMModel,
        storageError,
        isDefault: llmModel === DEFAULT_MODEL,
    };
}

function isValidLLMModel(value: string): boolean {
    const validModels: LLMModel[] = [
        'deepseek-chat',
        'kimi-k2-turbo-preview',
        'GLM-4.5-Air',
        'GLM-4.6',
    ];
    return validModels.includes(value as LLMModel);
}
