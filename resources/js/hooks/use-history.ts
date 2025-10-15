import type { HistoryEntry } from '@/types/history';
import { useEffect, useState } from 'react';

const HISTORY_KEY = 'log-history';
const MAX_ENTRIES = 20;

export function useHistory() {
    const [history, setHistory] = useState<HistoryEntry[]>([]);

    // Load history from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(HISTORY_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setHistory(parsed);
            }
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    }, []);

    // Save history to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        } catch (error) {
            console.error('Failed to save history:', error);
        }
    }, [history]);

    const addEntry = (
        rawLog: string,
        formattedLog: Record<string, unknown>,
    ) => {
        const entry: HistoryEntry = {
            id: Date.now().toString(),
            rawLog,
            formattedLog,
            timestamp: Date.now(),
            saved: false,
        };

        setHistory((prev) => {
            const newHistory = [entry, ...prev];
            // Keep only the last MAX_ENTRIES
            return newHistory.slice(0, MAX_ENTRIES);
        });
    };

    const removeEntry = (id: string) => {
        setHistory((prev) => prev.filter((entry) => entry.id !== id));
    };

    const toggleSaved = (id: string) => {
        setHistory((prev) =>
            prev.map((entry) =>
                entry.id === id ? { ...entry, saved: !entry.saved } : entry,
            ),
        );
    };

    const clearHistory = () => {
        setHistory([]);
    };

    const exportHistory = () => {
        const dataStr = JSON.stringify(history, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `log-history-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const recentEntries = history.filter((entry) => !entry.saved);
    const savedEntries = history.filter((entry) => entry.saved);

    return {
        history,
        recentEntries,
        savedEntries,
        addEntry,
        removeEntry,
        toggleSaved,
        clearHistory,
        exportHistory,
    };
}
