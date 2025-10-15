import { cn } from '@/lib/utils';
import { type ApiStatusState } from '@/types';

export type StatusState = ApiStatusState;

interface StatusIndicatorProps {
    status?: StatusState;
    message?: string | null;
    href?: string | null;
    className?: string;
}

const STATUS_STYLES: Record<
    StatusState,
    { dot: string; text: string; bg: string; label: string }
> = {
    operational: {
        dot: 'bg-emerald-500',
        text: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        label: 'Operational',
    },
    degraded: {
        dot: 'bg-amber-500',
        text: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        label: 'Degraded performance',
    },
    outage: {
        dot: 'bg-red-500',
        text: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-500/10 dark:bg-red-500/20',
        label: 'Service outage',
    },
    unknown: {
        dot: 'bg-muted-foreground/60',
        text: 'text-muted-foreground',
        bg: 'bg-muted',
        label: 'Status unknown',
    },
};

export function StatusIndicator({
    status = 'operational',
    message,
    href,
    className,
}: StatusIndicatorProps) {
    const variant = STATUS_STYLES[status] ?? STATUS_STYLES.unknown;

    const content = (
        <span
            className={cn(
                'inline-flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                variant.bg,
                variant.text,
                className,
            )}
        >
            <span className="flex items-center gap-2">
                <span
                    aria-hidden="true"
                    className={cn('h-2.5 w-2.5 rounded-full', variant.dot)}
                />
                <span className="font-medium">{variant.label}</span>
            </span>
            {message ? (
                <span className="text-xs font-normal text-muted-foreground dark:text-muted-foreground/80">
                    {message}
                </span>
            ) : null}
        </span>
    );

    if (href) {
        return (
            <a
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={
                    href.startsWith('http')
                        ? 'noopener noreferrer'
                        : undefined
                }
                className="block"
                aria-label={`API status: ${variant.label}`}
            >
                {content}
            </a>
        );
    }

    return (
        <div className="block" aria-label={`API status: ${variant.label}`}>
            {content}
        </div>
    );
}

StatusIndicator.displayName = 'StatusIndicator';
