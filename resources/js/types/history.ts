export interface HistoryEntry {
    id: number;
    summary: string | null;
    preview: string;
    createdAt: string;
    detectedLogType: string | null;
    fieldCount: number;
    isSaved: boolean;
}

export interface HistoryDetail {
    id: number;
    rawLog: string;
    formattedLog: Record<string, unknown>;
}
