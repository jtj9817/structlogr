import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DEFAULT_FAVICON_HREF,
    FAVICON_CANDIDATES,
    type FaviconCandidate,
} from '@/data/favicons';
import { useFavicon } from '@/hooks/use-favicon';
import { cn } from '@/lib/utils';
import { AppWindow, Check, Lock, Plus, RotateCcw, X } from 'lucide-react';
import { HTMLAttributes } from 'react';

const SELECTED_SIZES = [16, 32, 48, 64] as const;

function BrowserMock({ candidate }: { candidate: FaviconCandidate | null }) {
    const href = candidate?.href ?? DEFAULT_FAVICON_HREF;
    const tabTitle = candidate
        ? `StructLogr — ${candidate.name}`
        : 'StructLogr — Structured Logs';

    return (
        <div
            id="favicon-browser-mock"
            aria-hidden
            className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm"
        >
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 border-b border-border/60 bg-muted/70 px-3 py-2 dark:bg-muted/40">
                <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                <span className="size-2.5 rounded-full bg-[#febc2e]" />
                <span className="size-2.5 rounded-full bg-[#28c840]" />
            </div>
            {/* Tab strip */}
            <div className="flex items-end gap-1 bg-muted/40 px-2 pt-2 dark:bg-muted/20">
                <div className="flex max-w-[15rem] items-center gap-2 rounded-t-md border border-b-0 border-border/60 bg-background px-3 py-1.5">
                    <img
                        id="favicon-mock-tab-icon"
                        src={href}
                        alt=""
                        className="size-4 shrink-0"
                    />
                    <span className="truncate text-[11px] font-medium text-foreground">
                        {tabTitle}
                    </span>
                    <X className="size-3 shrink-0 opacity-40" />
                </div>
                <div className="mb-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground">
                    <Plus className="size-3.5" />
                </div>
            </div>
            {/* Address bar */}
            <div className="flex items-center gap-2 border-t border-border/60 bg-background px-3 py-2">
                <Lock className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="flex-1 truncate rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
                    structlogr.com
                </span>
                <img
                    src={href}
                    alt=""
                    className="size-5 shrink-0 rounded-sm border border-border/50"
                />
            </div>
        </div>
    );
}

function SizeRamp({
    candidate,
    theme,
}: {
    candidate: FaviconCandidate | null;
    theme: 'light' | 'dark';
}) {
    const href = candidate?.href ?? DEFAULT_FAVICON_HREF;
    const isLight = theme === 'light';

    return (
        <div
            id={`favicon-size-ramp-${theme}`}
            className={cn(
                'flex-1 rounded-lg border p-3',
                isLight
                    ? 'border-slate-200 bg-slate-50 text-slate-700'
                    : 'border-slate-800 bg-slate-950 text-slate-300',
            )}
        >
            <p className="mb-2 text-[10px] font-semibold tracking-widest uppercase opacity-70">
                {isLight ? 'Light tab' : 'Dark tab'}
            </p>
            <div className="flex items-end gap-3">
                {SELECTED_SIZES.map((size) => (
                    <div
                        key={size}
                        className="flex flex-col items-center gap-1.5"
                    >
                        <img
                            src={href}
                            alt={`Favicon at ${size}px`}
                            width={size}
                            height={size}
                            style={{ width: size, height: size }}
                        />
                        <span className="text-[9px] tabular-nums opacity-60">
                            {size}px
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CandidateCard({
    candidate,
    selected,
    onSelect,
}: {
    candidate: FaviconCandidate;
    selected: boolean;
    onSelect: (id: FaviconCandidate['id']) => void;
}) {
    return (
        <button
            type="button"
            role="radio"
            aria-checked={selected}
            id={`favicon-candidate-${candidate.id}`}
            onClick={() => onSelect(candidate.id)}
            className={cn(
                'group relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all duration-150',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/70 focus-visible:outline-dashed',
                selected
                    ? 'border-primary/60 bg-primary/5 shadow-md ring-2 ring-primary/70'
                    : 'border-border/70 bg-card hover:border-border hover:shadow-md',
            )}
        >
            {selected && (
                <span
                    className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    aria-hidden
                >
                    <Check className="size-3" strokeWidth={3} />
                </span>
            )}
            <span className="flex h-20 items-center justify-center">
                <img
                    src={candidate.href}
                    alt={`${candidate.name} favicon preview`}
                    className="size-16 drop-shadow-sm transition-transform duration-150 group-hover:scale-105"
                />
            </span>
            <span className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                    {candidate.index} · {candidate.codename}
                </span>
                <span className="text-sm leading-tight font-semibold text-foreground">
                    {candidate.name}
                </span>
                <span className="text-[10px] leading-snug text-muted-foreground italic">
                    {candidate.tagline}
                </span>
            </span>
            <span className="flex items-center gap-1" aria-hidden>
                {candidate.palette.map((swatch) => (
                    <span
                        key={swatch.hex}
                        title={swatch.label}
                        className="size-2.5 rounded-full border border-black/15 dark:border-white/20"
                        style={{ backgroundColor: swatch.hex }}
                    />
                ))}
            </span>
        </button>
    );
}

interface FaviconPickerProps extends HTMLAttributes<HTMLDivElement> {
    id?: string;
}

export function FaviconPicker({
    className,
    id = 'favicon-picker',
    ...props
}: FaviconPickerProps) {
    const { favicon, updateFavicon, resetFavicon } = useFavicon();
    const selected =
        FAVICON_CANDIDATES.find((candidate) => candidate.id === favicon) ??
        null;

    return (
        <div id={id} className={className} {...props}>
            <Dialog>
                <DialogTrigger asChild>
                    <Button
                        id={`${id}-trigger`}
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-md"
                        aria-label="Open favicon picker"
                    >
                        <AppWindow className="h-5 w-5 opacity-80" />
                        <span className="sr-only">Favicon picker</span>
                    </Button>
                </DialogTrigger>
                <DialogContent
                    id={`${id}-dialog`}
                    className="max-h-[88vh] max-w-4xl overflow-y-auto"
                >
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <AppWindow className="size-5" aria-hidden />
                            Favicon Picker
                        </DialogTitle>
                        <DialogDescription>
                            Five hand-drawn SVG candidates for the new
                            StructLogr icon. Picking one applies it to this tab
                            instantly and remembers it on this device.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4">
                        <BrowserMock candidate={selected} />

                        <div className="flex flex-col gap-2 sm:flex-row">
                            <SizeRamp theme="light" candidate={selected} />
                            <SizeRamp theme="dark" candidate={selected} />
                        </div>

                        <div
                            id={`${id}-grid`}
                            role="radiogroup"
                            aria-label="Favicon candidates"
                            className="grid grid-cols-2 gap-3 pt-1 sm:grid-cols-3 lg:grid-cols-5"
                        >
                            {FAVICON_CANDIDATES.map((candidate) => (
                                <CandidateCard
                                    key={candidate.id}
                                    candidate={candidate}
                                    selected={favicon === candidate.id}
                                    onSelect={updateFavicon}
                                />
                            ))}
                        </div>

                        <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                            {selected ? (
                                <>
                                    <span className="font-semibold text-foreground">
                                        {selected.name}.
                                    </span>{' '}
                                    {selected.description}
                                </>
                            ) : (
                                <>
                                    <span className="font-semibold text-foreground">
                                        Default icon.
                                    </span>{' '}
                                    Nothing picked yet — the site ships with the
                                    legacy favicon until you choose a candidate
                                    above.
                                </>
                            )}
                        </div>

                        <div className="flex flex-col-reverse items-stretch justify-between gap-2 border-t border-border/60 pt-3 sm:flex-row sm:items-center">
                            <p className="text-[11px] text-muted-foreground">
                                Stored locally in your browser · no account
                                needed · ships as a pure SVG, no raster assets
                            </p>
                            <Button
                                id={`${id}-reset`}
                                variant="outline"
                                size="sm"
                                onClick={resetFavicon}
                                disabled={favicon === null}
                                className="shrink-0"
                            >
                                <RotateCcw className="size-3.5" aria-hidden />
                                Reset to default
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default FaviconPicker;
