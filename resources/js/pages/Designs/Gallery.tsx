import { AppHeader } from '@/components/app-header';
import SkipNavigation from '@/components/skip-navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DESIGN_META, type DesignMeta } from '@/data/designs';
import { useDesign, type Design } from '@/hooks/use-design';
import { cn } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import { ArrowRight, Check, ExternalLink, RotateCcw } from 'lucide-react';

/**
 * Miniature, dependency-free previews of each design — pure markup
 * and inline styles so the gallery stays accurate to what ships.
 */
function DesignPreview({ id }: { id: Design }) {
    switch (id) {
        case 'phosphor':
            return (
                <div
                    className="flex h-full w-full flex-col bg-[#060d07] p-3 font-mono text-[9px] leading-4 text-[#3aff6e]"
                    style={{
                        backgroundImage:
                            'repeating-linear-gradient(to bottom, rgba(74,255,110,0.07) 0 1px, transparent 1px 4px)',
                    }}
                >
                    <div className="flex items-center gap-1.5 border-b border-[#1d3a26] pb-1.5">
                        <div className="size-2 rounded-full border border-[#ff5f4d]" />
                        <div className="size-2 rounded-full border border-[#ffb000]" />
                        <div className="size-2 rounded-full border border-[#3aff6e]" />
                        <span className="ml-2 text-[#5fa874]">
                            structlogr — session
                        </span>
                    </div>
                    <div className="mt-2 space-y-1">
                        <p className="text-[#ffb000]">
                            $ structlogr format --model=deepseek-chat
                        </p>
                        <p className="text-[#5fa874]">&gt; reading stdin…</p>
                        <p className="text-[#a9f5b4]">
                            {'{ "level": "ERROR",'}
                        </p>
                        <p className="pl-3 text-[#a9f5b4]">
                            &nbsp;&nbsp;"headline": "DB timeout 30s"
                        </p>
                        <p className="text-[#a9f5b4]">{'}'}</p>
                        <p className="animate-pulse">█</p>
                    </div>
                </div>
            );
        case 'lumen':
            return (
                <div
                    className="flex h-full w-full flex-col bg-[#f7f1e6] p-3 text-[#26201a]"
                    style={{ fontFamily: "'Newsreader', Georgia, serif" }}
                >
                    <div className="border-b-[3px] border-double border-[#26201a] pb-1 text-center">
                        <p className="text-[13px] leading-none font-black tracking-tight">
                            The StructLogr
                        </p>
                        <p className="mt-0.5 text-[5px] tracking-[0.3em] text-[#6d6252] uppercase">
                            Structured Logs — Est. MMXXV
                        </p>
                    </div>
                    <div className="mt-2 flex gap-2">
                        <div className="w-3/5 space-y-1 border-r border-[#ddd2bd] pr-2">
                            <p className="text-[5px] font-bold tracking-[0.25em] text-[#a63f1f] uppercase">
                                Submission Desk
                            </p>
                            <p className="text-[8px] leading-tight font-bold">
                                Paste your raw log. We&apos;ll set it in type.
                            </p>
                            <div className="space-y-0.5">
                                <div className="h-1 w-11/12 bg-[#26201a]/15" />
                                <div className="h-1 w-full bg-[#26201a]/15" />
                                <div className="h-1 w-4/5 bg-[#26201a]/15" />
                            </div>
                        </div>
                        <div className="w-2/5 space-y-1">
                            <p className="text-[5px] font-bold tracking-[0.25em] text-[#173f4f] uppercase">
                                Special Edition
                            </p>
                            <div className="border border-[#26201a]/30 bg-[#fffdf5] p-1">
                                <p className="font-mono text-[4.5px] leading-tight text-[#26201a]/80">
                                    {'{ "level": "ERROR" }'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        case 'nebula':
            return (
                <div
                    className="relative flex h-full w-full flex-col overflow-hidden bg-[#070a1e] p-3"
                    style={{
                        background:
                            'radial-gradient(120px 80px at 15% -10%, rgba(139,92,246,0.5), transparent 60%), radial-gradient(110px 80px at 90% 0%, rgba(34,211,238,0.4), transparent 55%), radial-gradient(140px 90px at 50% 120%, rgba(244,114,182,0.35), transparent 60%), #070a1e',
                    }}
                >
                    <p
                        className="text-[11px] leading-tight font-bold text-[#e8eaff]"
                        style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                        }}
                    >
                        From noise,{' '}
                        <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
                            nebula.
                        </span>
                    </p>
                    <div className="mt-1.5 flex gap-1">
                        {['01 Queue', '02 Ignite', '03 Receive'].map((step) => (
                            <span
                                key={step}
                                className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[5px] text-[#c4c9ff]"
                            >
                                {step}
                            </span>
                        ))}
                    </div>
                    <div className="mt-2 flex flex-1 gap-1.5">
                        <div className="w-2/5 rounded-lg border border-white/10 bg-white/5 p-1.5 backdrop-blur">
                            <div className="h-1 w-2/3 rounded bg-white/20" />
                            <div className="mt-1 h-1 w-full rounded bg-white/10" />
                            <div className="mt-1 h-1 w-4/5 rounded bg-white/10" />
                        </div>
                        <div className="flex flex-1 flex-col rounded-lg border border-white/10 bg-white/5 p-1.5 backdrop-blur">
                            <div className="h-1 w-1/2 rounded bg-cyan-300/40" />
                            <div className="mt-1 h-1 w-full rounded bg-violet-400/25" />
                            <div className="mt-1 h-1 w-5/6 rounded bg-violet-400/25" />
                            <div className="mt-auto h-1.5 w-2/3 self-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" />
                        </div>
                    </div>
                </div>
            );
        default: // classic
            return (
                <div className="flex h-full w-full flex-col bg-[#c6bfbb] p-3 font-mono text-[9px] text-[#061417]">
                    <div className="flex items-center gap-2 border-b border-[#928477]/50 pb-1.5">
                        <div className="size-2.5 rounded-sm bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-500" />
                        <span className="font-bold">StructLogr</span>
                    </div>
                    <div className="mt-2 flex flex-1 gap-2">
                        <div className="flex-1 space-y-1 rounded border border-[#928477]/60 bg-[#f3efec] p-1.5">
                            <div className="h-1 w-1/2 rounded bg-[#061417]/30" />
                            <div className="h-1 w-full rounded bg-[#061417]/15" />
                            <div className="h-1 w-4/5 rounded bg-[#061417]/15" />
                        </div>
                        <div className="flex-1 space-y-1 rounded border border-[#928477]/60 bg-[#f3efec] p-1.5">
                            <div className="h-1 w-1/2 rounded bg-[#061417]/30" />
                            <div className="h-1 w-full rounded bg-[#012c3c]/25" />
                            <div className="h-1 w-3/5 rounded bg-[#012c3c]/25" />
                        </div>
                    </div>
                </div>
            );
    }
}

function ActivateButton({ meta }: { meta: DesignMeta }) {
    const { design, updateDesign } = useDesign();
    const isActive = design === meta.id;

    if (isActive) {
        return (
            <div className="flex items-center justify-between gap-2">
                <Badge
                    variant="secondary"
                    className="inline-flex items-center gap-1.5"
                >
                    <Check className="size-3.5" aria-hidden />
                    Active design
                </Badge>
                <Button
                    size="sm"
                    onClick={() => router.visit('/')}
                    aria-label={`Open the app in ${meta.name}`}
                >
                    Open the app
                    <ArrowRight className="size-4" aria-hidden />
                </Button>
            </div>
        );
    }

    return (
        <Button
            size="sm"
            className="w-full"
            onClick={() => {
                updateDesign(meta.id);
                router.visit('/');
            }}
            aria-label={`Activate ${meta.name} design and open the app`}
        >
            Activate &amp; open app
            <ArrowRight className="size-4" aria-hidden />
        </Button>
    );
}

export default function Gallery() {
    const { design, updateDesign } = useDesign();
    const active = DESIGN_META.find((meta) => meta.id === design);

    return (
        <>
            <Head title="Design Gallery" />
            <SkipNavigation />
            <AppHeader />

            <main
                id="main-content"
                role="main"
                className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
            >
                <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border/60 pb-8">
                    <div className="max-w-2xl space-y-3">
                        <p className="text-xs font-semibold tracking-[0.3em] text-muted-foreground uppercase">
                            StructLogr · Design Gallery
                        </p>
                        <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
                            Four ways to read a log.
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Every design drives the same product — the
                            formatter, authentication, settings and your history
                            — with its own identity, palette and flow. Switching
                            is instant and remembered on this device.
                        </p>
                    </div>

                    {design !== 'classic' && (
                        <Button
                            variant="outline"
                            onClick={() => updateDesign('classic')}
                            className="gap-2"
                        >
                            <RotateCcw className="size-4" aria-hidden />
                            Reset to Classic
                        </Button>
                    )}
                </div>

                {active && (
                    <p
                        className="mt-4 text-sm text-muted-foreground"
                        role="status"
                    >
                        Currently viewing in{' '}
                        <span className="font-semibold text-foreground">
                            {active.name}
                        </span>
                        . Pick another below — the change applies instantly.
                    </p>
                )}

                <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {DESIGN_META.map((meta) => {
                        const Icon = meta.icon;
                        const isActive = design === meta.id;

                        return (
                            <article
                                key={meta.id}
                                id={`design-card-${meta.id}`}
                                aria-labelledby={`design-card-${meta.id}-name`}
                                className={cn(
                                    'flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground transition-shadow',
                                    isActive
                                        ? 'border-primary/60 shadow-lg ring-2 ring-ring/40'
                                        : 'border-border/70 shadow-sm hover:shadow-md',
                                )}
                            >
                                <div className="h-44 overflow-hidden border-b border-border/60">
                                    <DesignPreview id={meta.id} />
                                </div>

                                <div className="flex flex-1 flex-col gap-4 p-5">
                                    <div>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-mono text-xs text-muted-foreground">
                                                {meta.index} / {meta.codename}
                                            </span>
                                            <Icon
                                                className="size-4 text-muted-foreground"
                                                aria-hidden
                                            />
                                        </div>
                                        <h2
                                            id={`design-card-${meta.id}-name`}
                                            className="mt-1 text-2xl font-bold tracking-tight"
                                        >
                                            {meta.name}
                                        </h2>
                                        <p className="text-sm font-medium text-muted-foreground italic">
                                            {meta.tagline}
                                        </p>
                                    </div>

                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                        {meta.description}
                                    </p>

                                    <div>
                                        <p className="text-[10px] font-semibold tracking-[0.25em] text-muted-foreground uppercase">
                                            The Flow
                                        </p>
                                        <ul className="mt-1.5 space-y-1.5 text-xs leading-snug text-muted-foreground">
                                            {meta.flow.map((step) => (
                                                <li
                                                    key={step}
                                                    className="flex gap-1.5"
                                                >
                                                    <ArrowRight
                                                        className="mt-0.5 size-3 shrink-0"
                                                        aria-hidden
                                                    />
                                                    <span>{step}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="mt-auto space-y-3">
                                        <div>
                                            <p className="text-[10px] font-semibold tracking-[0.25em] text-muted-foreground uppercase">
                                                Palette
                                            </p>
                                            <div className="mt-1.5 flex items-center gap-2">
                                                {meta.palette.map((swatch) => (
                                                    <span
                                                        key={swatch.hex}
                                                        className="flex flex-col items-center gap-1"
                                                        title={`${swatch.label} · ${swatch.hex}`}
                                                    >
                                                        <span
                                                            className="size-5 rounded-full border border-black/15 shadow-sm dark:border-white/15"
                                                            style={{
                                                                backgroundColor:
                                                                    swatch.hex,
                                                            }}
                                                        />
                                                        <span className="font-mono text-[8px] text-muted-foreground">
                                                            {swatch.hex}
                                                        </span>
                                                    </span>
                                                ))}
                                            </div>
                                            <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
                                                {meta.typeface}
                                            </p>
                                        </div>

                                        <ActivateButton meta={meta} />
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>

                <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                    <ExternalLink className="size-3.5" aria-hidden />
                    All designs reuse the same backend — one formatter endpoint,
                    your history and preferences carry over untouched.
                </p>
            </main>
        </>
    );
}
