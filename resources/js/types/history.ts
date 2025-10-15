export interface HistoryEntry {
    id: string;
    rawLog: string;
    formattedLog: Record<string, unknown>;
    timestamp: number;
    saved: boolean;
}
