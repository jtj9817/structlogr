export type SearchScope = 'all' | 'recent' | 'saved';

export interface SearchResult {
    id: number;
    title: string | null;
    summary: string | null;
    preview: string;
    detectedLogType: string | null;
    createdAt: string;
    fieldCount: number;
    isSaved: boolean;
    collection: 'recent' | 'saved';
}

export interface SearchResponse {
    query: string;
    results: SearchResult[];
    meta: {
        limit: number;
        count: number;
        scope: SearchScope;
    };
}
