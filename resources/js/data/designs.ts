import { type Design } from '@/hooks/use-design';
import { type LucideIcon, Globe, Newspaper, Rocket, Terminal } from 'lucide-react';

export interface DesignMeta {
    id: Design;
    index: string;
    name: string;
    codename: string;
    tagline: string;
    description: string;
    flow: string[];
    typeface: string;
    palette: { hex: string; label: string }[];
    icon: LucideIcon;
}

export const DESIGN_META: DesignMeta[] = [
    {
        id: 'classic',
        index: '00',
        name: 'Classic',
        codename: 'The Original',
        tagline: 'The one you know',
        description:
            'The shipping StructLogr experience — warm slate, monospace type and a quiet two-card workspace.',
        flow: [
            'Two-card workspace: raw log in, structured JSON out',
            'Hero strip explains the product in one glance',
            'Floating preferences button over a hero-led page',
        ],
        typeface: 'JetBrains Mono (monospace)',
        palette: [
            { hex: '#c6bfbb', label: 'Desert Sand' },
            { hex: '#061417', label: 'Deep Teal' },
            { hex: '#012c3c', label: 'Petrol' },
            { hex: '#285669', label: 'Fjord' },
            { hex: '#928477', label: 'Khaki' },
        ],
        icon: Globe,
    },
    {
        id: 'phosphor',
        index: '01',
        name: 'Phosphor',
        codename: 'CRT Terminal',
        tagline: 'A shell session, not a web app',
        description:
            'A retro CRT console for people who live in tmux. Paste into the stdin pane, execute, and read scrollback — with a status line that tracks the session.',
        flow: [
            'Single-column console: STDIN pane → $ structlogr execute line → STDOUT readout',
            'Fixed bottom status bar tracks cursor, lines, model and timer',
            'Keyboard-first: everything answers to a prompt, not a pointer',
        ],
        typeface: 'JetBrains Mono + phosphor glow',
        palette: [
            { hex: '#060d07', label: 'Vacuum' },
            { hex: '#3aff6e', label: 'Phosphor Green' },
            { hex: '#ffb000', label: 'Amber' },
            { hex: '#a9f5b4', label: 'Fade Green' },
            { hex: '#1d3a26', label: 'Bezel' },
        ],
        icon: Terminal,
    },
    {
        id: 'lumen',
        index: '02',
        name: 'Lumen',
        codename: 'The Broadsheet',
        tagline: 'Structured logs, set in type',
        description:
            'An editorial front page for your telemetry. Your log is the story, the JSON is the print — delivered as a morning edition with a byline, kicker and column rules.',
        flow: [
            'Masthead → submission desk (left column) → exclusive release (right column)',
            'The structured output is typeset as the day’s headline with a byline',
            'History reads as “The Archive” — a newspaper morgue, not a list',
        ],
        typeface: 'Newsreader (serif) + JetBrains Mono',
        palette: [
            { hex: '#f7f1e6', label: 'Newsprint' },
            { hex: '#26201a', label: 'Ink' },
            { hex: '#a63f1f', label: 'Terracotta' },
            { hex: '#173f4f', label: 'Petrol' },
            { hex: '#ddd2bd', label: 'Rule Grey' },
        ],
        icon: Newspaper,
    },
    {
        id: 'nebula',
        index: '03',
        name: 'Nebula',
        codename: 'Mission Control',
        tagline: 'Launch logs into orbit',
        description:
            'A deep-space flight console. Queue the payload, ignite the formatter and receive the transmission — aurora gradients, frosted glass and a three-step flight plan.',
        flow: [
            'Three-step flight plan: 01 Queue payload → 02 Ignite → 03 Receive transmission',
            'Payload and transmission panes sit side-by-side behind frosted glass',
            'The launch button is a gradient ignition switch with an aurora halo',
        ],
        typeface: 'Space Grotesk + JetBrains Mono',
        palette: [
            { hex: '#070a1e', label: 'Void' },
            { hex: '#8b5cf6', label: 'Ion Violet' },
            { hex: '#22d3ee', label: 'Cyan Burn' },
            { hex: '#f472b6', label: 'Magenta Glow' },
            { hex: '#e8eaff', label: 'Starlight' },
        ],
        icon: Rocket,
    },
];

export const getDesignMeta = (id: Design): DesignMeta =>
    DESIGN_META.find((meta) => meta.id === id) ?? DESIGN_META[0];
