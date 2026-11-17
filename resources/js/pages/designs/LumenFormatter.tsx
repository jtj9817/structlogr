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
import { syntaxHighlightJson } from '@/lib/utils';
import type { FormatterPageProps } from '@/pages/designs/ClassicFormatter';
import { type SharedData } from '@/types';
import type { HistoryEntry } from '@/types/history';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Check, ClipboardCopy, Maximize2, Settings, Stamp } from 'lucide-react';
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

const lumenPlaceholder = `{
  "summary": {
    "headline": "Awaiting the morning post…",
    "level": "—"
  }
}`;

export default function LumenFormatter({
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
    const [dateLine, setDateLine] = useState('');
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

    // The front page headline is whatever the parser found most
    // newsworthy — prefer an explicit summary, fall back to the
    // first concrete error, then to the detected log signature.
    const edition = useMemo(() => {
        if (!displayLog) {
            return null;
        }

        const log = displayLog as {
            summary?: {
                headline?: string;
                level?: string;
                timestamp?: string;
            };
            results_summary?: {
                status?: string | null;
                timestamp?: string | null;
            };
            detected_log_type?: string;
            errors?: Array<{
                message?: string | null;
                error_type?: string | null;
            } | null> | null;
        };

        const rawHeadline =
            log.summary?.headline ??
            log.errors?.find((entry) => entry?.message)?.message ??
            (log.detected_log_type
                ? `${log.detected_log_type}${
                      log.results_summary?.status
                          ? ` — ${log.results_summary.status}`
                          : ''
                  }`
                : null);

        if (!rawHeadline) {
            return null;
        }

        const headline =
            rawHeadline.length > 96
                ? `${rawHeadline.slice(0, 93).trimEnd()}…`
                : rawHeadline;
        const level =
            log.summary?.level ?? log.results_summary?.status ?? undefined;
        const timestamp =
            log.summary?.timestamp ??
            log.results_summary?.timestamp ??
            undefined;

        return { headline, level, timestamp };
    }, [displayLog]);

    const characterCount = data.raw_log.length;
    const lineCount = data.raw_log.length ? data.raw_log.split('\n').length : 0;

    useEffect(() => {
        setDateLine(
            new Date().toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            }),
        );
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

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setHasSubmitted(true);
        setStatusMessage('Setting the type…');
        setFormattingDuration(null);
        resetTimer();
        startTimer();
        post('/format', {
            onSuccess: () => {
                const duration = stopTimer();
                setFormattingDuration(duration);
                setStatusMessage(`Filed in ${(duration / 1000).toFixed(2)}s`);
                setTimeout(() => setStatusMessage(''), 3000);
                setTimeout(() => outputRef.current?.focus(), 100);
            },
            onError: (submissionErrors: SubmissionErrorBag) => {
                stopTimer();
                setFormattingDuration(null);

                if (submissionErrors.response?.status === 419) {
                    setStatusMessage('Session expired — reloading…');
                    setTimeout(() => setStatusMessage(''), 5000);
                    return;
                }

                const errorMessage =
                    submissionErrors.raw_log ||
                    submissionErrors.llm_model ||
                    submissionErrors.response?.data?.message ||
                    'The presses jammed. Please try again.';

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
                setStatusMessage('Unable to retrieve the clipping');
                setTimeout(() => setStatusMessage(''), 3000);
                return;
            }

            setData('raw_log', entry.rawLog);
            setDisplayLog(entry.formattedLog);
            setHasSubmitted(true);
            setStatusMessage('Clipping restored from the archive');
            setTimeout(() => setStatusMessage(''), 3000);
        } catch {
            setStatusMessage('Unable to retrieve the clipping');
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
            setStatusMessage('Unable to retrieve the clipping');
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
                    className="flex min-h-[220px] flex-col items-center justify-center gap-3 py-12"
                    role="status"
                    aria-live="polite"
                >
                    <Spinner className="h-6 w-6 text-primary" />
                    <p className="font-serif text-lg italic">
                        Setting the type…
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
                    className="m-0 font-mono text-[13px] leading-6 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: highlightedOutput }}
                />
            );
        }

        if (hasSubmitted) {
            return (
                <div role="alert" className="space-y-2">
                    <p className="font-serif text-lg font-bold text-destructive">
                        Correction, please.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        The composing room returned nothing we could set. Try{' '}
                        {getShortcutDisplay(commonShortcuts.submit)} again, or
                        choose a different model in Preferences.
                    </p>
                </div>
            );
        }

        return (
            <pre className="m-0 font-mono text-[13px] leading-6 whitespace-pre-wrap text-muted-foreground/70">
                {lumenPlaceholder}
            </pre>
        );
    };

    return (
        <>
            <Head title="StructLogr — The Broadsheet" />
            <div className="flex min-h-screen flex-col bg-background text-foreground">
                <SkipNavigation />
                <AppHeader
                    onShortcutsOpen={() => setShortcutsOpen(true)}
                    onHistoryOpen={() => setHistoryOpen(true)}
                    onSettingsOpen={() => setSettingsOpen(true)}
                    onSearchResultSelect={handleLoadHistoryEntry}
                    searchRoute={historyRouteConfig?.search}
                />

                <main id="main-content" role="main">
                    <div
                        id="status-live-region"
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                        className="sr-only"
                    >
                        {statusMessage}
                    </div>

                    {/* Masthead */}
                    <section
                        aria-label="The StructLogr masthead"
                        className="container mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8"
                    >
                        <p className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold tracking-[0.28em] text-muted-foreground uppercase">
                            <span>Est. MMXXV · Incident Press</span>
                            <span>{dateLine || ' '}</span>
                            <span>Vol. I · No. 1</span>
                        </p>
                        <div className="lumen-rule-double mt-2 pt-3 text-center">
                            <h1
                                id="formatter-heading"
                                className="font-serif text-5xl leading-none font-black tracking-tight text-balance sm:text-6xl lg:text-7xl"
                            >
                                The StructLogr
                            </h1>
                            <p className="mt-2 text-[11px] tracking-[0.42em] text-muted-foreground uppercase">
                                Structured Logs for the Incident Press
                            </p>
                        </div>
                    </section>

                    <section
                        id="formatter-section"
                        aria-labelledby="formatter-heading"
                        className="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"
                    >
                        <form
                            id="formatter-form"
                            onSubmit={submit}
                            className="grid gap-8 lg:grid-cols-12"
                            aria-label="Log formatting form"
                        >
                            {/* Left column — The Submission Desk */}
                            <div className="lg:col-span-7">
                                <p className="lumen-kicker text-primary">
                                    The Submission Desk
                                </p>
                                <h2 className="mt-2 font-serif text-3xl leading-[1.1] font-bold tracking-tight sm:text-4xl">
                                    Paste your raw log.
                                    <br />
                                    We&apos;ll set it in type.
                                </h2>
                                <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                                    StructLogr reads your raw application logs
                                    and prints them as structured JSON —
                                    headline, entities, metrics and all. File
                                    your copy below.
                                </p>

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] font-semibold tracking-[0.25em] text-muted-foreground uppercase">
                                        Filed under:
                                    </span>
                                    <select
                                        id="formatter-sample-logs-select"
                                        data-testid="test-formatter-sample-logs"
                                        aria-label="Load a sample log"
                                        defaultValue=""
                                        onChange={(e) => {
                                            const sample = sampleLogs.find(
                                                (log) =>
                                                    log.id === e.target.value,
                                            );
                                            if (sample) {
                                                setData(
                                                    'raw_log',
                                                    sample.content,
                                                );
                                            }
                                        }}
                                        className="rounded-[2px] border border-input bg-card px-3 py-1.5 font-sans text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                    >
                                        <option value="">
                                            choose a specimen…
                                        </option>
                                        {sampleLogs.map((log) => (
                                            <option key={log.id} value={log.id}>
                                                {log.name}
                                            </option>
                                        ))}
                                    </select>
                                    <Button
                                        id="view-full-input-button"
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setInputModalOpen(true)}
                                        disabled={!data.raw_log.trim()}
                                        className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                                        aria-label="Open full input text in a dialog"
                                    >
                                        <Maximize2
                                            className="size-3.5"
                                            aria-hidden
                                        />
                                        Full copy
                                    </Button>
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
                                    placeholder="Paste your raw log text here…"
                                    aria-label="Raw log input"
                                    className="mt-3 min-h-[280px] resize-y rounded-[2px] border border-border bg-card font-mono text-[13px] leading-6 text-card-foreground shadow-sm placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring"
                                    value={data.raw_log}
                                    onChange={(e) =>
                                        setData('raw_log', e.target.value)
                                    }
                                />

                                <div className="mt-2 flex items-center justify-between border-b border-border pb-3 text-[11px] text-muted-foreground">
                                    <span>
                                        {characterCount} characters ·{' '}
                                        {lineCount} lines
                                    </span>
                                    <span>
                                        {characterCount > 0
                                            ? 'Copy ready — send to the composing room'
                                            : 'Awaiting copy'}
                                    </span>
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

                                <div className="mt-4 flex flex-wrap items-center gap-4">
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
                                                className="h-11 rounded-[2px] px-6 text-sm font-semibold tracking-wide uppercase"
                                            >
                                                {processing ? (
                                                    <Spinner className="mr-2" />
                                                ) : (
                                                    <Stamp
                                                        className="mr-2 size-4"
                                                        aria-hidden
                                                    />
                                                )}
                                                {processing
                                                    ? 'Printing…'
                                                    : 'Print the edition'}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>
                                                Print (
                                                {getShortcutDisplay(
                                                    commonShortcuts.submit,
                                                )}
                                                )
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                    {statusMessage && (
                                        <p
                                            className="font-serif text-sm text-muted-foreground italic"
                                            role="status"
                                        >
                                            {statusMessage}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Right column — Special Edition */}
                            <div className="border-t border-border pt-6 lg:col-span-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
                                <p className="lumen-kicker text-accent">
                                    JSON — Special Edition
                                </p>

                                {edition?.headline && !processing ? (
                                    <div className="mt-2 border-b-2 border-foreground pb-4">
                                        <h3 className="font-serif text-2xl leading-tight font-black tracking-tight text-balance">
                                            {edition.headline}
                                        </h3>
                                        <p className="mt-2 text-[10px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                                            Byline · {edition.level ?? 'FILED'}
                                            {edition.timestamp
                                                ? ` · Filed ${edition.timestamp}`
                                                : ''}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mt-2 border-b-2 border-foreground pb-4">
                                        <h3 className="font-serif text-2xl leading-tight font-black tracking-tight text-muted-foreground/60 italic">
                                            Awaiting the morning post…
                                        </h3>
                                        <p className="mt-2 text-[10px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                                            Byline · — · Press run 001
                                        </p>
                                    </div>
                                )}

                                <div
                                    id="output-content-wrapper"
                                    aria-busy={processing}
                                    className="mt-4 max-h-[46vh] min-h-[200px] overflow-auto rounded-[2px] border-2 border-foreground/80 bg-card p-4 shadow-[4px_4px_0_0_var(--foreground)]"
                                >
                                    {renderOutputContent()}
                                </div>

                                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                    <div className="text-[11px] text-muted-foreground">
                                        <p>
                                            Model:{' '}
                                            <span className="font-mono">
                                                {preferences.llmModel}
                                            </span>
                                        </p>
                                        {formattingDuration !== null &&
                                            !processing && (
                                                <p
                                                    id="formatting-completed"
                                                    className="text-emerald-700 dark:text-emerald-400"
                                                >
                                                    ✓ Printed in{' '}
                                                    {(
                                                        formattingDuration /
                                                        1000
                                                    ).toFixed(2)}
                                                    s
                                                </p>
                                            )}
                                        {timerRunning && processing && (
                                            <p
                                                id="formatting-timer"
                                                className="font-mono"
                                            >
                                                {(elapsedTime / 1000).toFixed(
                                                    2,
                                                )}
                                                s
                                            </p>
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
                                            className="gap-1.5 rounded-[2px]"
                                            aria-live="polite"
                                            aria-label="Copy formatted output to clipboard"
                                        >
                                            {copyStatus === 'copied' ? (
                                                <>
                                                    <Check
                                                        className="size-4"
                                                        aria-hidden
                                                    />
                                                    Clipped!
                                                </>
                                            ) : (
                                                <>
                                                    <ClipboardCopy
                                                        className="size-4"
                                                        aria-hidden
                                                    />
                                                    Clip the JSON
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
                                            className="gap-1.5 rounded-[2px]"
                                            aria-label="Open full formatted output in a dialog"
                                        >
                                            <Maximize2
                                                className="size-4"
                                                aria-hidden
                                            />
                                            Full text
                                        </Button>
                                    </div>
                                </div>

                                <div className="mt-4 border-t border-border pt-4">
                                    <p className="lumen-kicker text-muted-foreground">
                                        The Archive
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                        Every edition is filed in your archive.
                                        Search, re-open or clip a past story.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setHistoryOpen(true)}
                                        className="mt-2 font-serif text-sm font-bold underline underline-offset-4 hover:text-primary"
                                    >
                                        Visit The Archive →
                                    </button>
                                </div>
                            </div>
                        </form>
                    </section>

                    {/* Colophon */}
                    <footer
                        id="app-footer"
                        className="border-t border-border py-4"
                    >
                        <p className="text-center font-serif text-xs text-muted-foreground italic">
                            The StructLogr is set in Newsreader &amp; JetBrains
                            Mono · Printed by Laravel, React &amp; Prism ·{' '}
                            {getShortcutDisplay(commonShortcuts.help)} for keys
                        </p>
                    </footer>
                </main>
            </div>

            {/* Preferences — a single wax-seal button, bottom right */}
            <Button
                id="preferences-button"
                type="button"
                onClick={() => setPreferencesOpen(true)}
                aria-label="Open formatting preferences"
                className="focus-ring fixed right-5 bottom-5 z-50 h-14 w-14 rounded-full border-2 border-foreground/70 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
            >
                <Settings className="size-5" aria-hidden />
            </Button>

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
                    className="sm:max-w-[min(80vw,1200px)]"
                >
                    <DialogHeader>
                        <DialogTitle
                            id="output-modal-title"
                            className="font-serif text-2xl"
                        >
                            The Full Edition
                        </DialogTitle>
                        <DialogDescription id="output-modal-description">
                            The complete structured output. Clip it freely.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea
                        id="output-modal-scroll-area"
                        className="max-h-[70vh] rounded-[2px] border border-border"
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
                                Nothing has been printed yet.
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
                                ? 'Clipped ✓'
                                : 'Clip the JSON'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isInputModalOpen} onOpenChange={setInputModalOpen}>
                <DialogContent
                    id="input-modal"
                    className="sm:max-w-[min(80vw,1200px)]"
                >
                    <DialogHeader>
                        <DialogTitle
                            id="input-modal-title"
                            className="font-serif text-2xl"
                        >
                            The Full Copy
                        </DialogTitle>
                        <DialogDescription id="input-modal-description">
                            The complete raw log as filed.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea
                        id="input-modal-scroll-area"
                        className="max-h-[70vh] rounded-[2px] border border-border"
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
