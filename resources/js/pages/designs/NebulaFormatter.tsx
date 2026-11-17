import { AppHeader } from '@/components/app-header';
import { FormattingPreferences } from '@/components/formatter/formatting-preferences';
import { HistorySidebar } from '@/components/formatter/history-sidebar';
import InputError from '@/components/input-error';
import KeyboardShortcutsModal from '@/components/keyboard-shortcuts-modal';
import { SettingsPanel } from '@/components/settings-panel';
import SkipNavigation from '@/components/skip-navigation';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { sampleLogs } from '@/data/sample-logs';
import { useFormattingTimer } from '@/hooks/use-formatting-timer';
import { useHistory } from '@/hooks/use-history';
import {
    commonShortcuts,
    getShortcutDisplay,
    useKeyboardShortcuts,
} from '@/hooks/use-keyboard-shortcuts';
import { usePreferences } from '@/hooks/use-preferences';
import { cn, syntaxHighlightJson } from '@/lib/utils';
import type { FormatterPageProps } from '@/pages/designs/ClassicFormatter';
import { type SharedData } from '@/types';
import type { HistoryEntry } from '@/types/history';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Check,
    Copy,
    Maximize2,
    Radio,
    Rocket,
    Satellite,
    SlidersHorizontal,
} from 'lucide-react';
import {
    FormEventHandler,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

type HistoryPayload = {
    recent: HistoryEntry[];
};

type HistoryRoutesConfig = {
    index: string;
    detail: string;
    toggle: string;
    clear: string;
    export: string;
    search: string;
};

type SubmissionErrorBag = Record<string, string> & {
    response?: {
        status?: number;
        data?: {
            message?: string;
        };
    };
};

const nebulaPreview = `{
  "summary": {
    "headline": "Awaiting transmission…",
    "level": "SIGNAL"
  }
}`;

const flightPlan = [
    { step: '01', label: 'Queue payload' },
    { step: '02', label: 'Ignite parser' },
    { step: '03', label: 'Receive transmission' },
] as const;

export default function NebulaFormatter({
    formattedLog,
    history,
    historyRoutes,
}: FormatterPageProps) {
    const page = usePage<
        SharedData & {
            history?: HistoryPayload | null;
            historyRoutes?: HistoryRoutesConfig | null;
        }
    >();
    const initialHistory =
        history ?? (page.props.history as HistoryPayload | null) ?? null;
    const historyRouteConfig =
        historyRoutes ??
        (page.props.historyRoutes as HistoryRoutesConfig | null) ??
        null;
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const outputRef = useRef<HTMLPreElement>(null);
    const errorRef = useRef<HTMLDivElement>(null);
    const copyResetTimeoutRef = useRef<number | undefined>(undefined);

    const [historyOpen, setHistoryOpen] = useState(false);
    const [preferencesOpen, setPreferencesOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [displayLog, setDisplayLog] = useState(formattedLog);
    const [isOutputModalOpen, setOutputModalOpen] = useState(false);
    const [isInputModalOpen, setInputModalOpen] = useState(false);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>(
        'idle',
    );
    const {
        elapsedTime,
        isRunning: timerRunning,
        start: startTimer,
        stop: stopTimer,
        reset: resetTimer,
    } = useFormattingTimer();
    const [formattingDuration, setFormattingDuration] = useState<number | null>(
        null,
    );
    const {
        recentEntries,
        loadEntry: loadHistoryEntry,
        removeEntry,
        toggleSaved,
        clearHistory,
        exportHistory,
        isLoading: historyLoading,
        canManage,
    } = useHistory({
        initialHistory: initialHistory ?? undefined,
        routes: historyRouteConfig ?? undefined,
    });
    const { applyPreferences, preferences } = usePreferences();
    const { data, setData, post, processing, errors } = useForm({
        raw_log: '',
        llm_model: preferences.llmModel,
        preferences: {
            includeMetadata: preferences.includeMetadata,
            parseTimestamps: preferences.parseTimestamps,
            normalizeLogLevels: preferences.normalizeLogLevels,
            timezone: preferences.timezone,
            dateFormat: preferences.dateFormat,
        },
        _token:
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') || '',
    });

    const formattedOutput = useMemo(() => {
        if (!displayLog) {
            return '';
        }

        try {
            return JSON.stringify(applyPreferences(displayLog), null, 2);
        } catch (error) {
            console.error('Unable to format output preview', error);
            return '';
        }
    }, [applyPreferences, displayLog]);

    const highlightedOutput = useMemo(
        () => (formattedOutput ? syntaxHighlightJson(formattedOutput) : ''),
        [formattedOutput],
    );

    const characterCount = data.raw_log.length;
    const lineCount = data.raw_log.length ? data.raw_log.split('\n').length : 0;
    const flightStep = processing ? 2 : formattedOutput ? 3 : 1;

    useEffect(() => {
        setDisplayLog(formattedLog);
    }, [formattedLog]);

    useEffect(() => {
        setData('llm_model', preferences.llmModel);
    }, [preferences.llmModel, setData]);

    useEffect(() => {
        setData('preferences', {
            includeMetadata: preferences.includeMetadata,
            parseTimestamps: preferences.parseTimestamps,
            normalizeLogLevels: preferences.normalizeLogLevels,
            timezone: preferences.timezone,
            dateFormat: preferences.dateFormat,
        });
    }, [
        preferences.includeMetadata,
        preferences.parseTimestamps,
        preferences.normalizeLogLevels,
        preferences.timezone,
        preferences.dateFormat,
        setData,
    ]);

    useEffect(() => {
        return () => {
            if (copyResetTimeoutRef.current) {
                window.clearTimeout(copyResetTimeoutRef.current);
            }
        };
    }, []);

    const handleCopyOutput = useCallback(async () => {
        if (!formattedOutput) {
            return;
        }

        try {
            if (typeof navigator === 'undefined' || !navigator.clipboard) {
                throw new Error('Clipboard API unavailable');
            }

            if (copyResetTimeoutRef.current) {
                window.clearTimeout(copyResetTimeoutRef.current);
            }

            await navigator.clipboard.writeText(formattedOutput);
            setCopyStatus('copied');
        } catch (error) {
            console.error('Unable to copy formatted output', error);
            setCopyStatus('error');
        } finally {
            copyResetTimeoutRef.current = window.setTimeout(() => {
                setCopyStatus('idle');
                copyResetTimeoutRef.current = undefined;
            }, 2000);
        }
    }, [formattedOutput]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setHasSubmitted(true);
        setStatusMessage('Establishing uplink…');
        setFormattingDuration(null);
        resetTimer();
        startTimer();
        post('/format', {
            onSuccess: () => {
                const duration = stopTimer();
                setFormattingDuration(duration);
                setStatusMessage(
                    `Transmission received in ${(duration / 1000).toFixed(2)}s`,
                );
                setTimeout(() => setStatusMessage(''), 3000);
                setTimeout(() => outputRef.current?.focus(), 100);
            },
            onError: (submissionErrors: SubmissionErrorBag) => {
                stopTimer();
                setFormattingDuration(null);

                if (submissionErrors.response?.status === 419) {
                    setStatusMessage(
                        'Signal lost — session expired. Reloading…',
                    );
                    setTimeout(() => setStatusMessage(''), 5000);
                    return;
                }

                const errorMessage =
                    submissionErrors.raw_log ||
                    submissionErrors.llm_model ||
                    submissionErrors.response?.data?.message ||
                    'Uplink failed. Retry or switch model.';

                setStatusMessage(errorMessage);
                setTimeout(() => setStatusMessage(''), 3000);
                setTimeout(() => errorRef.current?.focus(), 100);
            },
        });
    };

    const handleLoadHistoryEntry = async (entryId: number) => {
        try {
            const entry = await loadHistoryEntry(entryId);
            if (!entry) {
                setStatusMessage('Archive recall failed');
                setTimeout(() => setStatusMessage(''), 3000);
                return;
            }

            setData('raw_log', entry.rawLog);
            setDisplayLog(entry.formattedLog);
            setHasSubmitted(true);
            setStatusMessage('Archive entry restored');
            setTimeout(() => setStatusMessage(''), 3000);
        } catch {
            setStatusMessage('Archive recall failed');
            setTimeout(() => setStatusMessage(''), 3000);
        }
    };

    const handleCopyHistoryEntry = async (entryId: number) => {
        try {
            const entry = await loadHistoryEntry(entryId);
            if (!entry) {
                return null;
            }

            return JSON.stringify(entry.formattedLog, null, 2);
        } catch {
            setStatusMessage('Archive recall failed');
            setTimeout(() => setStatusMessage(''), 3000);
            return null;
        }
    };

    useKeyboardShortcuts([
        {
            ...commonShortcuts.submit,
            action: () => {
                if (data.raw_log.trim() && !processing) {
                    const formEvent = new Event('submit', {
                        cancelable: true,
                    }) as unknown as React.FormEvent<HTMLFormElement>;
                    Object.defineProperty(formEvent, 'preventDefault', {
                        value: () => {},
                    });
                    submit(formEvent);
                }
            },
        },
        {
            ...commonShortcuts.clear,
            action: () => setData('raw_log', ''),
        },
        {
            ...commonShortcuts.escape,
            action: () => {
                setHistoryOpen(false);
                setPreferencesOpen(false);
                setSettingsOpen(false);
                setShortcutsOpen(false);
            },
        },
        {
            ...commonShortcuts.help,
            action: () => setShortcutsOpen(true),
        },
        {
            ...commonShortcuts.focusInput,
            action: () => textareaRef.current?.focus(),
        },
        {
            ...commonShortcuts.focusOutput,
            action: () => outputRef.current?.focus(),
        },
    ]);

    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        if (!isMobile && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, []);

    const renderOutputContent = () => {
        if (processing) {
            return (
                <div
                    id="processing-status"
                    className="flex min-h-[240px] flex-col items-center justify-center gap-4 py-12"
                    role="status"
                    aria-live="polite"
                >
                    <div className="relative">
                        <span
                            className="absolute inset-0 animate-ping rounded-full bg-cyan-400/20"
                            aria-hidden
                        />
                        <Radio
                            className="relative size-8 text-cyan-300"
                            aria-hidden
                        />
                    </div>
                    <p className="text-sm font-medium text-cyan-200/90">
                        Establishing uplink…
                    </p>
                </div>
            );
        }

        if (highlightedOutput) {
            return (
                <pre
                    ref={outputRef}
                    id="output-display"
                    tabIndex={0}
                    aria-label="Formatted JSON output"
                    className="m-0 text-[13px] leading-6 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: highlightedOutput }}
                />
            );
        }

        if (hasSubmitted) {
            return (
                <div role="alert" className="space-y-2">
                    <p className="font-semibold text-rose-300">
                        Uplink failed.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        The parser never responded. Retry{' '}
                        {getShortcutDisplay(commonShortcuts.submit)} or select a
                        different model in preferences.
                    </p>
                </div>
            );
        }

        return (
            <pre className="m-0 text-[13px] leading-6 whitespace-pre-wrap text-indigo-200/40">
                {nebulaPreview}
            </pre>
        );
    };

    return (
        <>
            <Head title="StructLogr — Mission Control" />
            <div className="relative flex min-h-screen flex-col overflow-x-clip bg-background text-foreground">
                <SkipNavigation />

                {/* Ambient aurora orbs */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-32 right-[-10%] size-[480px] rounded-full bg-violet-600/25 blur-3xl"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute top-40 left-[-12%] size-[420px] rounded-full bg-cyan-500/20 blur-3xl"
                />

                <AppHeader
                    onShortcutsOpen={() => setShortcutsOpen(true)}
                    onHistoryOpen={() => setHistoryOpen(true)}
                    onSettingsOpen={() => setSettingsOpen(true)}
                    onSearchResultSelect={handleLoadHistoryEntry}
                    searchRoute={historyRouteConfig?.search}
                />

                <main id="main-content" role="main" className="relative">
                    <div
                        id="status-live-region"
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                        className="sr-only"
                    >
                        {statusMessage}
                    </div>

                    {/* Command hero */}
                    <section
                        aria-label="Mission brief"
                        className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8"
                    >
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl">
                                <p className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-[10px] font-semibold tracking-[0.3em] text-violet-200 uppercase">
                                    <Satellite
                                        className="size-3.5"
                                        aria-hidden
                                    />
                                    Nebula Flight Console
                                </p>
                                <h1
                                    id="formatter-heading"
                                    className="mt-4 text-5xl leading-[0.95] font-bold tracking-tight text-balance sm:text-6xl lg:text-7xl"
                                >
                                    From noise,{' '}
                                    <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
                                        nebula.
                                    </span>
                                </h1>
                                <p className="mt-4 max-w-md text-base leading-6 text-muted-foreground">
                                    Raw logs in. Structured signal out. Fly the
                                    three-step plan below — the parser does the
                                    rest.
                                </p>
                            </div>

                            {/* Flight plan stepper */}
                            <ol
                                aria-label="Flight plan"
                                className="flex items-center gap-2 sm:gap-3"
                            >
                                {flightPlan.map((item, index) => {
                                    const position = index + 1;
                                    const state =
                                        flightStep > position
                                            ? 'done'
                                            : flightStep === position
                                              ? 'active'
                                              : 'idle';
                                    return (
                                        <li
                                            key={item.step}
                                            className="flex items-center gap-2 sm:gap-3"
                                            aria-current={
                                                state === 'active'
                                                    ? 'step'
                                                    : undefined
                                            }
                                        >
                                            <span
                                                className={cn(
                                                    'flex size-9 items-center justify-center rounded-full border text-[11px] font-bold transition-all duration-500',
                                                    state === 'done' &&
                                                        'border-cyan-400/50 bg-cyan-400/15 text-cyan-300',
                                                    state === 'active' &&
                                                        'border-violet-400/60 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[0_0_18px_rgba(139,92,246,0.5)]',
                                                    state === 'idle' &&
                                                        'border-white/10 bg-white/5 text-muted-foreground',
                                                )}
                                            >
                                                {state === 'done' ? (
                                                    <Check
                                                        className="size-4"
                                                        aria-hidden
                                                    />
                                                ) : (
                                                    item.step
                                                )}
                                            </span>
                                            <span className="hidden max-w-[76px] text-[10px] leading-tight font-medium text-muted-foreground sm:block">
                                                {item.label}
                                            </span>
                                            {index < flightPlan.length - 1 && (
                                                <span
                                                    aria-hidden
                                                    className="h-px w-4 bg-white/15 sm:w-8"
                                                />
                                            )}
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>
                    </section>

                    {/* Payload / transmission deck */}
                    <section
                        id="formatter-section"
                        aria-labelledby="formatter-heading"
                        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
                    >
                        <form
                            id="formatter-form"
                            onSubmit={submit}
                            className="grid gap-6 lg:grid-cols-12"
                            aria-label="Log formatting form"
                        >
                            {/* Payload bay */}
                            <div className="nebula-glass flex flex-col rounded-2xl p-5 lg:col-span-5">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-[10px] font-bold tracking-[0.3em] text-cyan-300 uppercase">
                                        01 · Payload Bay
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    id="preferences-button"
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        setPreferencesOpen(
                                                            true,
                                                        )
                                                    }
                                                    aria-label="Open formatting preferences"
                                                    className="size-8 text-muted-foreground hover:text-cyan-200"
                                                >
                                                    <SlidersHorizontal
                                                        className="size-4"
                                                        aria-hidden
                                                    />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Preferences</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <select
                                            id="formatter-sample-logs-select"
                                            data-testid="test-formatter-sample-logs"
                                            aria-label="Load a sample log"
                                            defaultValue=""
                                            onChange={(e) => {
                                                const sample =
                                                    sampleLogs.find(
                                                        (log) =>
                                                            log.id ===
                                                            e.target.value,
                                                    );
                                                if (sample) {
                                                    setData(
                                                        'raw_log',
                                                        sample.content,
                                                    );
                                                }
                                            }}
                                            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-indigo-100 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
                                        >
                                            <option value="">
                                                Load specimen…
                                            </option>
                                            {sampleLogs.map((log) => (
                                                <option
                                                    key={log.id}
                                                    value={log.id}
                                                >
                                                    {log.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <label
                                    htmlFor="formatter-raw-log-textarea"
                                    className="sr-only"
                                >
                                    Raw log input
                                </label>
                                <Textarea
                                    ref={textareaRef}
                                    id="formatter-raw-log-textarea"
                                    data-testid="test-formatter-raw-log"
                                    name="raw_log"
                                    placeholder="// paste raw log text here…"
                                    aria-label="Raw log input"
                                    className="mt-4 min-h-[260px] flex-1 resize-none rounded-xl border border-white/10 bg-black/30 font-mono text-[13px] leading-6 text-cyan-50 placeholder:text-indigo-300/40 focus-visible:ring-2 focus-visible:ring-violet-400"
                                    value={data.raw_log}
                                    onChange={(e) =>
                                        setData('raw_log', e.target.value)
                                    }
                                />

                                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                                    <span className="font-mono">
                                        {characterCount} ch · {lineCount} ln
                                    </span>
                                    <Button
                                        id="view-full-input-button"
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setInputModalOpen(true)}
                                        disabled={!data.raw_log.trim()}
                                        className="h-7 gap-1.5 px-2 text-[11px] text-muted-foreground hover:text-cyan-200"
                                        aria-label="Open full input text in a dialog"
                                    >
                                        <Maximize2
                                            className="size-3.5"
                                            aria-hidden
                                        />
                                        expand
                                    </Button>
                                </div>

                                {errors.raw_log && (
                                    <div
                                        ref={errorRef}
                                        role="alert"
                                        className="mt-2"
                                        tabIndex={-1}
                                    >
                                        <InputError message={errors.raw_log} />
                                    </div>
                                )}

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            id="formatter-format-button"
                                            data-testid="test-formatter-format"
                                            type="submit"
                                            disabled={
                                                processing ||
                                                !data.raw_log.trim()
                                            }
                                            aria-label={
                                                processing
                                                    ? 'Processing log format request'
                                                    : 'Format log with AI'
                                            }
                                            className="nebula-glow mt-4 h-14 w-full rounded-xl border-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 text-sm font-bold tracking-[0.2em] text-white uppercase transition-transform hover:scale-[1.01] disabled:opacity-40"
                                        >
                                            {processing ? (
                                                <Spinner className="mr-2" />
                                            ) : (
                                                <Rocket
                                                    className="mr-2 size-5"
                                                    aria-hidden
                                                />
                                            )}
                                            {processing
                                                ? 'Igniting…'
                                                : 'Ignite Formatter'}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>
                                            Ignite (
                                            {getShortcutDisplay(
                                                commonShortcuts.submit,
                                            )}
                                            )
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                                <p className="mt-2 text-center font-mono text-[10px] text-muted-foreground">
                                    model:{' '}
                                    <span className="text-cyan-300">
                                        {preferences.llmModel}
                                    </span>
                                </p>
                            </div>

                            {/* Transmission window */}
                            <div className="nebula-glass flex flex-col rounded-2xl p-5 lg:col-span-7">
                                <div className="flex items-center gap-3">
                                    <span className="flex gap-1.5" aria-hidden>
                                        <span className="size-2.5 rounded-full bg-rose-400/80" />
                                        <span className="size-2.5 rounded-full bg-amber-300/80" />
                                        <span className="size-2.5 rounded-full bg-emerald-400/80" />
                                    </span>
                                    <p className="text-[10px] font-bold tracking-[0.3em] text-violet-300 uppercase">
                                        03 · Transmission
                                    </p>
                                    {statusMessage && (
                                        <p
                                            className="ml-auto max-w-[45%] truncate text-[11px] text-cyan-200/90"
                                            role="status"
                                        >
                                            {statusMessage}
                                        </p>
                                    )}
                                </div>

                                <div
                                    id="output-content-wrapper"
                                    aria-busy={processing}
                                    className="mt-4 max-h-[52vh] min-h-[240px] flex-1 overflow-auto rounded-xl border border-white/8 bg-black/40 p-4"
                                >
                                    {renderOutputContent()}
                                </div>

                                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                        {formattingDuration !== null &&
                                            !processing && (
                                                <span
                                                    id="formatting-completed"
                                                    className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 font-mono text-emerald-300"
                                                >
                                                    <Check
                                                        className="size-3"
                                                        aria-hidden
                                                    />
                                                    signal locked ·{' '}
                                                    {(
                                                        formattingDuration /
                                                        1000
                                                    ).toFixed(2)}
                                                    s
                                                </span>
                                            )}
                                        {timerRunning && processing && (
                                            <span
                                                id="formatting-timer"
                                                className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 font-mono text-amber-300"
                                            >
                                                t+
                                                {(elapsedTime / 1000).toFixed(
                                                    2,
                                                )}
                                                s
                                            </span>
                                        )}
                                        {!formattedOutput && !processing && (
                                            <span className="font-mono text-indigo-300/70">
                                                channel idle
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            id="copy-output-button"
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCopyOutput}
                                            disabled={!formattedOutput}
                                            className="gap-1.5 rounded-lg border-cyan-400/30 bg-cyan-400/5 text-cyan-200 hover:bg-cyan-400/15"
                                            aria-live="polite"
                                            aria-label="Copy formatted output to clipboard"
                                        >
                                            {copyStatus === 'copied' ? (
                                                <>
                                                    <Check
                                                        className="size-4"
                                                        aria-hidden
                                                    />
                                                    Captured!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy
                                                        className="size-4"
                                                        aria-hidden
                                                    />
                                                    Capture transmission
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            id="view-full-output-button"
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setOutputModalOpen(true)
                                            }
                                            disabled={!formattedOutput}
                                            className="gap-1.5 rounded-lg border-white/10 bg-white/5"
                                            aria-label="Open full formatted output in a dialog"
                                        >
                                            <Maximize2
                                                className="size-4"
                                                aria-hidden
                                            />
                                            Expand
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </section>

                    <footer
                        id="app-footer"
                        className="relative border-t border-white/5 py-4"
                    >
                        <p className="text-center font-mono text-[10px] tracking-[0.2em] text-indigo-300/60 uppercase">
                            StructLogr Nebula · ride the aurora ·{' '}
                            {getShortcutDisplay(commonShortcuts.help)} for keys
                        </p>
                    </footer>
                </main>
            </div>

            <HistorySidebar
                open={historyOpen}
                onOpenChange={setHistoryOpen}
                onLoadEntry={handleLoadHistoryEntry}
                onCopyEntry={handleCopyHistoryEntry}
                onRemoveEntry={removeEntry}
                onToggleSaved={toggleSaved}
                onClearHistory={clearHistory}
                onExportHistory={exportHistory}
                recentEntries={recentEntries}
                isProcessing={historyLoading}
                canManage={canManage}
            />

            <FormattingPreferences
                open={preferencesOpen}
                onOpenChange={setPreferencesOpen}
            />

            <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />

            <KeyboardShortcutsModal
                open={shortcutsOpen}
                onOpenChange={setShortcutsOpen}
            />

            <Dialog open={isOutputModalOpen} onOpenChange={setOutputModalOpen}>
                <DialogContent
                    id="output-modal"
                    className="nebula-glass sm:max-w-[min(80vw,1200px)]"
                >
                    <DialogHeader>
                        <DialogTitle
                            id="output-modal-title"
                            className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-xl font-bold text-transparent"
                        >
                            Full Transmission
                        </DialogTitle>
                        <DialogDescription id="output-modal-description">
                            The complete structured signal. Capture it below.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea
                        id="output-modal-scroll-area"
                        className="max-h-[70vh] rounded-xl border border-white/10"
                    >
                        {formattedOutput ? (
                            <pre
                                id="output-modal-pre"
                                className="p-4 font-mono text-sm leading-6 whitespace-pre-wrap"
                            >
                                {formattedOutput}
                            </pre>
                        ) : (
                            <div
                                id="output-modal-empty"
                                className="p-4 text-sm text-muted-foreground"
                            >
                                No transmission yet. Ignite the formatter first.
                            </div>
                        )}
                    </ScrollArea>
                    <DialogFooter id="output-modal-footer">
                        <Button
                            id="output-modal-close-button"
                            variant="outline"
                            onClick={() => setOutputModalOpen(false)}
                        >
                            Close
                        </Button>
                        <Button
                            id="output-modal-copy-button"
                            onClick={handleCopyOutput}
                            disabled={!formattedOutput}
                        >
                            {copyStatus === 'copied'
                                ? 'Captured ✓'
                                : 'Capture transmission'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isInputModalOpen} onOpenChange={setInputModalOpen}>
                <DialogContent
                    id="input-modal"
                    className="nebula-glass sm:max-w-[min(80vw,1200px)]"
                >
                    <DialogHeader>
                        <DialogTitle
                            id="input-modal-title"
                            className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-xl font-bold text-transparent"
                        >
                            Full Payload
                        </DialogTitle>
                        <DialogDescription id="input-modal-description">
                            The complete payload queued for ignition.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea
                        id="input-modal-scroll-area"
                        className="max-h-[70vh] rounded-xl border border-white/10"
                    >
                        <pre
                            id="input-modal-pre"
                            className="p-4 font-mono text-sm leading-6 whitespace-pre-wrap"
                        >
                            {data.raw_log}
                        </pre>
                    </ScrollArea>
                    <DialogFooter id="input-modal-footer">
                        <Button
                            id="input-modal-close-button"
                            variant="outline"
                            onClick={() => setInputModalOpen(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
