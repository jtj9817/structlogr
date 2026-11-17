/**
 * The five favicon candidates for StructLogr's new site icon.
 *
 * Every candidate is a hand-drawn, dependency-free SVG stored in
 * `public/favicons/` — no raster assets, no icon fonts. The picker
 * (see `@/components/favicon-picker`) renders straight from these
 * files so what you see is literally what ships to the tab.
 *
 * They all share one drawing — the structured log lines nested inside
 * Prism Braces (the `Prism Braces` × `Parse Lines` combination) — and
 * differ only in colourway.
 */

export type FaviconId =
    | 'spectral'
    | 'verdant'
    | 'rose'
    | 'glacier'
    | 'ultraviolet';

export interface FaviconCandidate {
    id: FaviconId;
    /** Display order — matches the numbered file name. */
    index: string;
    name: string;
    codename: string;
    tagline: string;
    description: string;
    /** Public path of the standalone SVG. */
    href: string;
    palette: { hex: string; label: string }[];
}

export const DEFAULT_FAVICON_HREF = '/favicon.svg';

export const FAVICON_CANDIDATES: FaviconCandidate[] = [
    {
        id: 'spectral',
        index: '01',
        name: 'Spectral Merge',
        codename: 'The Direct Merge',
        tagline: 'Prism Braces × Parse Lines',
        description:
            'The two original candidates, fused into a single mark — spectral braces cradling the raw-to-structured line ramp. Cool geometry, warm payload.',
        href: '/favicons/favicon-01-spectral.svg',
        palette: [
            { hex: '#38bdf8', label: 'Sky' },
            { hex: '#818cf8', label: 'Iris' },
            { hex: '#c084fc', label: 'Orchid' },
            { hex: '#ff8a4c', label: 'Ember' },
        ],
    },
    {
        id: 'verdant',
        index: '02',
        name: 'Verdant',
        codename: 'Jade & Pearl',
        tagline: 'Deep green, cool payload',
        description:
            'Emerald-to-lime braces on a forest tile, holding lines of mint dissolving into pearl. The quiet, organic option — observability blooming in a terminal garden.',
        href: '/favicons/favicon-02-verdant.svg',
        palette: [
            { hex: '#34d399', label: 'Jade' },
            { hex: '#10b981', label: 'Emerald' },
            { hex: '#a3e635', label: 'Lime' },
            { hex: '#a7f3d0', label: 'Pearl Mint' },
        ],
    },
    {
        id: 'rose',
        index: '03',
        name: 'Rosé',
        codename: 'Velvet Bracket',
        tagline: 'Warm braces, glacial payload',
        description:
            'Rose-to-crimson braces against ice-blue lines on a dark wine tile — warm outside, cool inside. Exactly how your alerting feels at 03:00 on a Friday.',
        href: '/favicons/favicon-03-rose.svg',
        palette: [
            { hex: '#fb7185', label: 'Rose' },
            { hex: '#e11d48', label: 'Crimson' },
            { hex: '#bae6fd', label: 'Ice' },
            { hex: '#38bdf8', label: 'Glacial' },
        ],
    },
    {
        id: 'glacier',
        index: '04',
        name: 'Glacier',
        codename: 'Steel & Gold',
        tagline: 'Silver braces, gold payload',
        description:
            'Brushed-silver braces with a molten champagne-to-copper line ramp on deep carbon. The stealth option — reads as serious infrastructure from across the room.',
        href: '/favicons/favicon-04-glacier.svg',
        palette: [
            { hex: '#f1f5f9', label: 'Silver' },
            { hex: '#94a3b8', label: 'Steel' },
            { hex: '#f59e0b', label: 'Gold' },
            { hex: '#b45309', label: 'Copper' },
        ],
    },
    {
        id: 'ultraviolet',
        index: '05',
        name: 'Ultraviolet',
        codename: 'Dusk Circuit',
        tagline: 'Orchid braces, sunset payload',
        description:
            'Orchid-to-violet braces over a rose-to-gold sunset ramp on a midnight-plum tile. Loud, synthetic, and unmistakably ours at 16px.',
        href: '/favicons/favicon-05-ultraviolet.svg',
        palette: [
            { hex: '#f0abfc', label: 'Orchid' },
            { hex: '#7c3aed', label: 'Ultraviolet' },
            { hex: '#fb7185', label: 'Rose' },
            { hex: '#facc15', label: 'Gold' },
        ],
    },
];

export const FAVICON_IDS = FAVICON_CANDIDATES.map((candidate) => candidate.id);
