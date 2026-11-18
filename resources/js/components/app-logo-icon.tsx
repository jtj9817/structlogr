import { SVGAttributes } from 'react';

/**
 * The StructLogr brand mark — the favicon glyph: three structured log
 * lines nested inside the Prism Braces outline. Stroke-based
 * (`currentColor`) so the badge, the auth layouts and the phosphor
 * CSS re-tints keep working exactly as they do for a filled icon.
 */
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
        >
            <path
                d="M22 9 C17.5 9 15 12 15 16.5 L15 24 C15 28.5 13 30.4 9.5 32 C13 33.6 15 35.5 15 40 L15 47.5 C15 52 17.5 55 22 55"
                stroke="currentColor"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M42 9 C46.5 9 49 12 49 16.5 L49 24 C49 28.5 51 30.4 54.5 32 C51 33.6 49 35.5 49 40 L49 47.5 C49 52 46.5 55 42 55"
                stroke="currentColor"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <line
                x1="23"
                y1="22"
                x2="42"
                y2="22"
                stroke="currentColor"
                strokeWidth={6.4}
                strokeLinecap="round"
            />
            <line
                x1="23"
                y1="32"
                x2="36.5"
                y2="32"
                stroke="currentColor"
                strokeWidth={6.4}
                strokeLinecap="round"
            />
            <line
                x1="23"
                y1="42"
                x2="39.5"
                y2="42"
                stroke="currentColor"
                strokeWidth={6.4}
                strokeLinecap="round"
            />
        </svg>
    );
}
