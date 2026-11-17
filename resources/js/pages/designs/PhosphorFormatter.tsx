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
import { cn } from '@/lib/utils';
import type { FormatterPageProps } from '@/pages/designs/ClassicFormatter';
import { type SharedData } from '@/types';
import type { HistoryEntry } from '@/types/history';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Check,
    ChevronRight,
    ClipboardCopy,
    History,
    Maximize2,
    Terminal,
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

const phosphorPreview = `{
  "summary": {
    "headline": "Database connection failed after timing out at 30s",
    "level": "ERROR"
  }
}`;

export default function PhosphorFormatter({
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

    const characterCount = data.raw_log.length;
    const lineCount = data.raw_log.length ? data.raw_log.split('\n').length : 0;

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
        setStatusMessage('processing payload...');
        setFormattingDuration(null);
        resetTimer();
        startTimer();
        post('/format', {
            onSuccess: () => {
                const duration = stopTimer();
                setFormattingDuration(duration);
                setStatusMessage(`done in ${(duration / 1000).toFixed(2)}s`);
                setTimeout(() => setStatusMessage(''), 3000);
                setTimeout(() => outputRef.current?.focus(), 100);
            },
            onError: (submissionErrors: SubmissionErrorBag) => {
                stopTimer();
                setFormattingDuration(null);

                if (submissionErrors.response?.status === 419) {
                    setStatusMessage('session expired — reloading...');
                    setTimeout(() => setStatusMessage(''), 5000);
                    return;
                }

                const errorMessage =
                    submissionErrors.raw_log ||
                    submissionErrors.llm_model ||
                    submissionErrors.response?.data?.message ||
                    'format failed';

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
                setStatusMessage('history read failed');
                setTimeout(() => setStatusMessage(''), 3000);
                return;
            }

            setData('raw_log', entry.rawLog);
            setDisplayLog(entry.formattedLog);
            setHasSubmitted(true);
            setStatusMessage('history entry restored');
            setTimeout(() => setStatusMessage(''), 3000);
        } catch {
            setStatusMessage('history read failed');
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
            setStatusMessage('history read failed');
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
                    className="flex min-h-[220px] items-center justify-center gap-3 py-12"
                    role="status"
                    aria-live="polite"
                >
                    <Spinner className="h-5 w-5 text-[#3aff6e]" />
                    <span className="text-sm text-[#5fa874]">
                        parsing payload…
                    </span>
                </div>
            );
        }

        if (formattedOutput) {
            return (
                <pre
                    ref={outputRef}
                    id="output-display"
                    tabIndex={0}
                    aria-label="Formatted JSON output"
                    className="m-0 text-sm leading-6 whitespace-pre-wrap text-[#a9f5b4]"
                >
                    {formattedOutput}
                </pre>
            );
        }

        if (hasSubmitted) {
            return (
                <div role="alert" className="space-y-2 text-sm">
                    <p className="font-medium text-[#ff5f4d]">
                        ERR: format failed.
                    </p>
                    <p className="text-[#5fa874]">
                        The parser returned nothing usable. Retry with{' '}
                        {getShortcutDisplay(commonShortcuts.submit)} or pick
                        another model in preferences.
                    </p>
                </div>
            );
        }

        return (
            <pre className="m-0 text-sm leading-6 whitespace-pre-wrap text-[#2f6b41]">
                {phosphorPreview}
            </pre>
        );
    };

    return (
        <>
            <Head title="StructLogr — Phosphor Terminal" />
            <div className="flex min-h-screen flex-col bg-background pb-14 text-foreground">
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

                    {/* Boot banner */}
                    <section
                        aria-label="Phosphor session banner"
                        className="border-b border-border/60"
                    >
                        <div className="container mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs text-[#5fa874]">
                                <span className="inline-flex items-center gap-2 text-[#3aff6e]">
                                    <Terminal className="size-4" aria-hidden />
                                    <span className="phosphor-glow text-sm font-bold tracking-widest uppercase">
                                        StructLogr v1.0.4
                                    </span>
                                </span>
                                <span>LLM PARSE SHELL</span>
                                <span>model: {preferences.llmModel}</span>
                                <span>samples: {sampleLogs.length} loaded</span>
                                <span className="ml-auto inline-flex items-center gap-2">
                                    <span
                                        className="size-2 animate-pulse rounded-full bg-[#3aff6e]"
                                        aria-hidden
                                    />
                                    ONLINE
                                </span>
                            </div>
                        </div>
                    </section>

                    <section
                        id="formatter-section"
                        aria-labelledby="formatter-heading"
                        className="container mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8"
                    >
                        <h1 id="formatter-heading" className="sr-only">
                            StructLogr log formatter — Phosphor terminal
                        </h1>

                        <form
                            id="formatter-form"
                            onSubmit={submit}
                            className="flex flex-col gap-0"
                            aria-label="Log formatting form"
                        >
                            {/* STDIN pane */}
                            <div
                                className="phosphor-panel overflow-hidden rounded-md border border-border bg-card"
                                aria-labelledby="stdin-title"
                            >
                                <div className="phosphor-titlebar flex items-center gap-2 border-b border-border px-4 py-2">
                                    <span className="flex gap-1.5" aria-hidden>
                                        <span className="size-2.5 rounded-full border border-[#ff5f4d]" />
                                        <span className="size-2.5 rounded-full border border-[#ffb000]" />
                                        <span className="size-2.5 rounded-full bg-[#3aff6e] shadow-[0_0_6px_rgba(58,255,110,0.8)]" />
                                    </span>
                                    <span
                                        id="stdin-title"
                                        className="ml-2 font-mono text-[11px] tracking-[0.25em] text-[#5fa874] uppercase"
                                    >
                                        stdin — raw log
                                    </span>
                                    <div className="ml-auto flex items-center gap-2">
                                        <select
                                            id="formatter-sample-logs-select"
                                            data-testid="test-formatter-sample-logs"
                                            aria-label="Load a sample log"
                                            defaultValue=""
                                            onChange={(e) => {
                                                const sample = sampleLogs.find(
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
                                            className="rounded border border-border bg-background px-2 py-1 font-mono text-[11px] text-[#a9f5b4] focus-visible:ring-1 focus-visible:ring-[#3aff6e] focus-visible:outline-none"
                                        >
                                            <option value="">
                                                : load sample…
                                            </option>
                                            {sampleLogs.map((log) => (
                                                <option
                                                    key={log.id}
                                                    value={log.id}
                                                >
                                                    {log.name} [{log.difficulty}
                                                    ]
                                                </option>
                                            ))}
                                        </select>
                                        <Button
                                            id="view-full-input-button"
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                setInputModalOpen(true)
                                            }
                                            disabled={!data.raw_log.trim()}
                                            className="h-7 px-2 font-mono text-[11px] text-[#5fa874] hover:text-[#3aff6e]"
                                            aria-label="Open full input text in a dialog"
                                        >
                                            <Maximize2
                                                className="size-3.5"
                                                aria-hidden
                                            />
                                            expand
                                        </Button>
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
                                    className="min-h-[240px] resize-none rounded-none border-0 bg-transparent font-mono text-sm leading-6 text-[#a9f5b4] caret-[#3aff6e] placeholder:text-[#2f6b41] focus-visible:ring-0"
                                    value={data.raw_log}
                                    onChange={(e) =>
                                        setData('raw_log', e.target.value)
                                    }
                                />
                                {errors.raw_log && (
                                    <div
                                        ref={errorRef}
                                        role="alert"
                                        className="border-t border-[#ff5f4d]/30 px-4 py-2"
                                        tabIndex={-1}
                                    >
                                        <InputError message={errors.raw_log} />
                                    </div>
                                )}
                            </div>

                            {/* Execute line */}
                            <div className="flex flex-wrap items-center gap-3 px-2 py-3 font-mono text-xs text-[#ffb000] sm:text-sm">
                                <ChevronRight
                                    className="size-4 shrink-0"
                                    aria-hidden
                                />
                                <code
                                    id="command-echo"
                                    className="truncate"
                                    aria-hidden
                                >
                                    structlogr format --model=
                                    {preferences.llmModel} --chars=
                                    {characterCount}
                                </code>
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
                                            className="ml-auto h-9 rounded-sm border border-[#3aff6e]/60 bg-[#3aff6e] px-5 font-mono text-xs font-bold tracking-[0.25em] text-[#03140a] uppercase shadow-[0_0_18px_rgba(58,255,110,0.35)] hover:bg-[#6cff96] disabled:opacity-40"
                                        >
                                            {processing && (
                                                <Spinner className="mr-2" />
                                            )}
                                            Execute
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>
                                            Execute (
                                            {getShortcutDisplay(
                                                commonShortcuts.submit,
                                            )}
                                            )
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>

                            {/* STDOUT pane */}
                            <div
                                className="phosphor-panel overflow-hidden rounded-md border border-border bg-card"
                                aria-labelledby="stdout-title"
                            >
                                <div className="phosphor-titlebar flex items-center gap-2 border-b border-border px-4 py-2">
                                    <span
                                        id="stdout-title"
                                        className="font-mono text-[11px] tracking-[0.25em] text-[#5fa874] uppercase"
                                    >
                                        stdout — structured json
                                    </span>
                                    <div className="ml-auto flex items-center gap-2">
                                        {timerRunning && processing && (
                                            <span
                                                id="formatting-timer"
                                                className="font-mono text-[11px] text-[#ffb000]"
                                            >
                                                {(elapsedTime / 1000).toFixed(
                                                    2,
                                                )}
                                                s
                                            </span>
                                        )}
                                        {formattingDuration !== null &&
                                            !processing && (
                                                <span
                                                    id="formatting-completed"
                                                    className="font-mono text-[11px] text-[#3aff6e]"
                                                >
                                                    ✓ exit 0 —{' '}
                                                    {(
                                                        formattingDuration /
                                                        1000
                                                    ).toFixed(2)}
                                                    s
                                                </span>
                                            )}
                                        <Button
                                            id="copy-output-button"
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleCopyOutput}
                                            disabled={!formattedOutput}
                                            className="h-7 px-2 font-mono text-[11px] text-[#5fa874] hover:text-[#3aff6e]"
                                            aria-live="polite"
                                            aria-label="Copy formatted output to clipboard"
                                        >
                                            {copyStatus === 'copied' ? (
                                                <>
                                                    <Check
                                                        className="size-3.5"
                                                        aria-hidden
                                                    />
                                                    copied
                                                </>
                                            ) : copyStatus === 'error' ? (
                                                'copy !'
                                            ) : (
                                                <>
                                                    <ClipboardCopy
                                                        className="size-3.5"
                                                        aria-hidden
                                                    />
                                                    copy
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            id="view-full-output-button"
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                setOutputModalOpen(true)
                                            }
                                            disabled={!formattedOutput}
                                            className="h-7 px-2 font-mono text-[11px] text-[#5fa874] hover:text-[#3aff6e]"
                                            aria-label="Open full formatted output in a dialog"
                                        >
                                            <Maximize2
                                                className="size-3.5"
                                                aria-hidden
                                            />
                                            expand
                                        </Button>
                                    </div>
                                </div>
                                {statusMessage && (
                                    <p className="border-b border-border px-4 py-1.5 font-mono text-[11px] text-[#ffb000]">
                                        &gt; {statusMessage}
                                    </p>
                                )}
                                <div
                                    id="output-content-wrapper"
                                    className="max-h-[46vh] min-h-[200px] overflow-auto px-4 py-4"
                                    aria-busy={processing}
                                >
                                    {renderOutputContent()}
                                </div>
                            </div>

                            {/* Session hint row */}
                            <div className="flex items-center gap-4 px-2 pt-2 font-mono text-[11px] text-[#2f6b41]">
                                <button
                                    type="button"
                                    onClick={() => setHistoryOpen(true)}
                                    className="inline-flex items-center gap-1.5 transition-colors hover:text-[#3aff6e]"
                                    aria-label="Open format history"
                                >
                                    <History className="size-3.5" aria-hidden />
                                    :history
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShortcutsOpen(true)}
                                    className="transition-colors hover:text-[#3aff6e]"
                                >
                                    :help — keys
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPreferencesOpen(true)}
                                    className="transition-colors hover:text-[#3aff6e]"
                                >
                                    :preferences
                                </button>
                            </div>
                        </form>
                    </section>
                </main>

                {/* Tmux-style status line */}
                <footer
                    id="app-footer"
                    className="fixed inset-x-0 bottom-0 z-40 border-t border-[#3aff6e]/25 bg-[#050a06]/95 backdrop-blur"
                    aria-label="Session status bar"
                >
                    <div className="mx-auto flex h-10 max-w-6xl items-center gap-4 px-4 font-mono text-[11px] text-[#5fa874] sm:px-6 lg:px-8">
                        <span className="hidden font-bold text-[#3aff6e] sm:inline">
                            STRUCTLOGR
                        </span>
                        <span>
                            {lineCount} LN · {characterCount} CH
                        </span>
                        <span className="hidden md:inline">UTF-8 · LF</span>
                        <span className="ml-auto inline-flex items-center gap-3">
                            <span
                                className={cn(
                                    'inline-flex items-center gap-1.5',
                                    processing
                                        ? 'text-[#ffb000]'
                                        : 'text-[#3aff6e]',
                                )}
                            >
                                <span
                                    className={cn(
                                        'size-1.5 rounded-full',
                                        processing
                                            ? 'animate-pulse bg-[#ffb000]'
                                            : 'bg-[#3aff6e]',
                                    )}
                                    aria-hidden
                                />
                                {processing
                                    ? 'BUSY'
                                    : formattingDuration !== null
                                      ? 'DONE'
                                      : 'READY'}
                            </span>
                            <span className="max-w-[140px] truncate">
                                {preferences.llmModel}
                            </span>
                        </span>
                    </div>
                </footer>
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
                    className="border-border bg-card sm:max-w-[min(80vw,1200px)]"
                >
                    <DialogHeader>
                        <DialogTitle
                            id="output-modal-title"
                            className="font-mono tracking-widest uppercase"
                        >
                            stdout — full edition
                        </DialogTitle>
                        <DialogDescription id="output-modal-description">
                            Full structured output. Copy it below.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea
                        id="output-modal-scroll-area"
                        className="max-h-[70vh] rounded-md border border-border"
                    >
                        {formattedOutput ? (
                            <pre
                                id="output-modal-pre"
                                className="p-4 font-mono text-sm leading-6 whitespace-pre-wrap text-[#a9f5b4]"
                            >
                                {formattedOutput}
                            </pre>
                        ) : (
                            <div
                                id="output-modal-empty"
                                className="p-4 text-sm text-[#5fa874]"
                            >
                                No output yet. Execute the formatter first.
                            </div>
                        )}
                    </ScrollArea>
                    <DialogFooter id="output-modal-footer">
                        <Button
                            id="output-modal-close-button"
                            variant="outline"
                            onClick={() => setOutputModalOpen(false)}
                        >
                            close
                        </Button>
                        <Button
                            id="output-modal-copy-button"
                            onClick={handleCopyOutput}
                            disabled={!formattedOutput}
                        >
                            {copyStatus === 'copied'
                                ? 'copied ✓'
                                : 'copy output'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isInputModalOpen} onOpenChange={setInputModalOpen}>
                <DialogContent
                    id="input-modal"
                    className="border-border bg-card sm:max-w-[min(80vw,1200px)]"
                >
                    <DialogHeader>
                        <DialogTitle
                            id="input-modal-title"
                            className="font-mono tracking-widest uppercase"
                        >
                            stdin — full payload
                        </DialogTitle>
                        <DialogDescription id="input-modal-description">
                            Full raw log text as queued.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea
                        id="input-modal-scroll-area"
                        className="max-h-[70vh] rounded-md border border-border"
                    >
                        <pre
                            id="input-modal-pre"
                            className="p-4 font-mono text-sm leading-6 whitespace-pre-wrap text-[#a9f5b4]"
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
                            close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
