export interface HistoryEntry {
    id: number;
    summary: string | null;
    title?: string;
    preview: string;
    createdAt: string;
    detectedLogType: string | null;
    fieldCount: number;
    isSaved: boolean;
}

export interface HistoryDetail {
    id: number;
    title?: string;
    rawLog: string;
    formattedLog: Record<string, unknown>;
}
