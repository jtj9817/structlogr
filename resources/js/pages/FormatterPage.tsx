import { FormattingPreferences } from '@/components/formatter/formatting-preferences';
import { HistorySidebar } from '@/components/formatter/history-sidebar';
import HeroSection from '@/components/hero-section';
import InputError from '@/components/input-error';
import KeyboardShortcutsModal from '@/components/keyboard-shortcuts-modal';
import { SettingsPanel } from '@/components/settings-panel';
import SkipNavigation from '@/components/skip-navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useFormattingTimer } from '@/hooks/use-formatting-timer';
import { useHistory } from '@/hooks/use-history';
import {
    commonShortcuts,
    useKeyboardShortcuts,
} from '@/hooks/use-keyboard-shortcuts';
import { usePreferences } from '@/hooks/use-preferences';
import { cn } from '@/lib/utils';
import { login, register } from '@/routes';
import { type SharedData } from '@/types';
import type { HistoryEntry } from '@/types/history';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    Check,
    ClipboardCopy,
    HelpCircle,
    Maximize2,
    Settings,
} from 'lucide-react';
import {
    FormEventHandler,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

// Sample logs data
const sampleLogs = [
    {
        id: 'apache-access',
        name: 'Apache Access Log',
        description: 'Standard Apache web server access log entry',
        difficulty: 'easy',
        content: `127.0.0.1 - - [15/Oct/2025:14:32:01 +0000] "GET /api/users HTTP/1.1" 200 1234 "https://example.com" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"`,
    },
    {
        id: 'nginx-error',
        name: 'Nginx Error Log',
        description: 'Nginx web server error log entry',
        difficulty: 'easy',
        content: `2025/10/15 14:32:01 [error] 12345#12345: *67890 connect() failed (111: Connection refused) while connecting to upstream, client: 192.168.1.100, server: example.com, request: "GET /api/data HTTP/1.1", upstream: "http://127.0.0.1:8080/api/data", host: "example.com"`,
    },
    {
        id: 'application-error',
        name: 'Application Error Log',
        description: 'Generic application error with stack trace',
        difficulty: 'medium',
        content: `2025-10-15 14:32:01 ERROR [main] com.example.app.UserService - Failed to connect to database
java.sql.SQLException: Connection refused: connect
\tat com.example.app.Database.connect(Database.java:123)
\tat com.example.app.UserService.getUser(UserService.java:45)
\tat com.example.app.Main.main(Main.java:12)
Caused by: java.net.ConnectException: Connection refused: connect
\t... 3 more`,
    },
    {
        id: 'docker-logs',
        name: 'Docker Container Log',
        description: 'Docker container application log',
        difficulty: 'medium',
        content: `2025-10-15T14:32:01.123Z INFO  [web-server] Server started on port 8080
2025-10-15T14:32:02.456Z DEBUG [web-server] Processing request from 192.168.1.100
2025-10-15T14:32:03.789Z WARN  [web-server] Slow query detected: 2.5s
2025-10-15T14:32:04.012Z ERROR [web-server] Database connection failed: timeout after 30s`,
    },
];

const dummyFormattedPreview = `{
  "summary": {
    "headline": "Database connection failed after timing out at 30s",
    "level": "ERROR",
    "timestamp": "2024-10-15T14:23:45Z"
  },
  "entities": [
    {
      "type": "service",
      "identifier": "database"
    }
  ],
  "metrics": [
    {
      "name": "timeout_seconds",
      "value": 30
    }
  ]
}`;

const syntaxHighlightJson = (json: string) => {
    const sanitized = json
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return sanitized.replace(
        /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
        (match) => {
            let className = 'text-muted-foreground';

            if (match.startsWith('"')) {
                if (match.endsWith(':')) {
                    className = 'text-sky-500 dark:text-sky-300';
                } else {
                    className = 'text-emerald-500 dark:text-emerald-300';
                }
            } else if (match === 'true' || match === 'false') {
                className = 'text-amber-500 dark:text-amber-300';
            } else if (match === 'null') {
                className = 'text-rose-500 dark:text-rose-300';
            } else {
                className = 'text-indigo-500 dark:text-indigo-300';
            }

            return `<span class="${className}">${match}</span>`;
        },
    );
};

type HistoryPayload = {
    recent: HistoryEntry[];
    saved: HistoryEntry[];
};

type HistoryRoutesConfig = {
    index: string;
    detail: string;
    toggle: string;
    clear: string;
    export: string;
};

interface FormatterPageProps {
    formattedLog?: {
        timestamp?: string;
        level?: string;
        message?: string;
        source?: string;
        metadata?: Record<string, unknown>;
        [key: string]: unknown;
    };
    history?: HistoryPayload | null;
    historyRoutes?: HistoryRoutesConfig | null;
}

export default function FormatterPage({
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
    const { auth } = page.props;
    const initialHistory =
        history ?? (page.props.history as HistoryPayload | null) ?? null;
    const historyRouteConfig =
        historyRoutes ??
        (page.props.historyRoutes as HistoryRoutesConfig | null) ??
        null;
    const formRef = useRef<HTMLElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const outputRef = useRef<HTMLPreElement>(null);
    const copyResetTimeoutRef = useRef<number | undefined>(undefined);
    const inputCopyResetTimeoutRef = useRef<number | undefined>(undefined);

    const sampleLogsSelectId = 'formatter-sample-logs-select';
    const sampleLogsTestId = 'test-formatter-sample-logs';

    const rawLogTextareaId = 'formatter-raw-log-textarea';
    const rawLogTestId = 'test-formatter-raw-log';

    const formatButtonId = 'formatter-format-button';
    const formatButtonTestId = 'test-formatter-format';

    const modelDisplayId = 'formatter-model-display';
    const modelLabelId = 'formatter-model-label';
    const sampleLogsContainerId = 'formatter-sample-logs-container';
    const textareaContainerRelativeId = 'formatter-textarea-container-relative';
    const buttonsContainerId = 'formatter-buttons-container';
    const modelTimerContainerId = 'formatter-model-timer-container';

    const headerId = 'app-header';
    const mainNavId = 'main-navigation';
    const mainContentId = 'main-content';
    const formId = 'formatter-form';
    const shortcutsButtonId = 'shortcuts-button';
    const historyButtonId = 'history-button';
    const settingsButtonId = 'settings-button';
    const loginLinkId = 'login-link';
    const registerLinkId = 'register-link';
    const characterCounterId = 'character-counter';
    const clearButtonId = 'clear-input-button';
    const preferencesButtonId = 'preferences-button';
    const outputDisplayId = 'output-display';
    const statusLiveRegionId = 'status-live-region';
    const formatterHeadingId = 'formatter-heading';
    const inputCardId = 'input-card';
    const outputCardId = 'output-card';
    const footerId = 'app-footer';
    const heroSectionId = 'hero-section';
    const formatterSectionId = 'formatter-section';
    const sampleLogsLabelId = 'sample-logs-label';
    const sampleLogsOptionDefaultId = 'sample-logs-option-default';
    const textareaWrapperId = 'textarea-wrapper';
    const statsCounterId = 'stats-counter';
    const formattingTimerId = 'formatting-timer';
    const formattingCompletedId = 'formatting-completed';
    const outputPreviewDescId = 'output-preview-description';
    const outputToolbarId = 'output-toolbar';
    const outputContentWrapperId = 'output-content-wrapper';
    const copyOutputButtonId = 'copy-output-button';
    const viewFullOutputButtonId = 'view-full-output-button';
    const footerTextId = 'footer-text';
    const processingStatusId = 'processing-status';
    const outputModalId = 'output-modal';
    const outputModalTitleId = 'output-modal-title';
    const outputModalDescId = 'output-modal-description';
    const outputModalScrollAreaId = 'output-modal-scroll-area';
    const outputModalPreId = 'output-modal-pre';
    const outputModalEmptyId = 'output-modal-empty';
    const outputModalFooterId = 'output-modal-footer';
    const outputModalCloseButtonId = 'output-modal-close-button';
    const outputModalCopyButtonId = 'output-modal-copy-button';
    const inputToolbarId = 'input-toolbar';
    const viewFullInputButtonId = 'view-full-input-button';
    const inputModalId = 'input-modal';
    const inputModalTitleId = 'input-modal-title';
    const inputModalDescId = 'input-modal-description';
    const inputModalScrollAreaId = 'input-modal-scroll-area';
    const inputModalPreId = 'input-modal-pre';
    const inputModalEmptyId = 'input-modal-empty';
    const inputModalFooterId = 'input-modal-footer';
    const inputModalCloseButtonId = 'input-modal-close-button';
    const inputModalCopyButtonId = 'input-modal-copy-button';
    const inputCardHeaderId = 'input-card-header';
    const inputCardTitleId = 'input-card-title';
    const inputCardContentId = 'input-card-content';
    const outputCardHeaderId = 'output-card-header';
    const outputCardTitleId = 'output-card-title';
    const outputCardSubtitleId = 'output-card-subtitle';
    const outputCardContentId = 'output-card-content';
    const errorAlertId = 'error-alert';
    const formatterDescriptionId = 'formatter-description';
    const readyStatusId = 'formatter-ready-status';
    const [historyOpen, setHistoryOpen] = useState(false);
    const [preferencesOpen, setPreferencesOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [displayLog, setDisplayLog] = useState(formattedLog);
    const [outputAnimating, setOutputAnimating] = useState(false);
    const [isOutputModalOpen, setOutputModalOpen] = useState(false);
    const [isInputModalOpen, setInputModalOpen] = useState(false);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>(
        'idle',
    );
    const [inputCopyStatus, setInputCopyStatus] = useState<'idle' | 'copied' | 'error'>(
        'idle',
    );
    const { elapsedTime, isRunning: timerRunning, start: startTimer, stop: stopTimer, reset: resetTimer } = useFormattingTimer();
    const [formattingDuration, setFormattingDuration] = useState<number | null>(null);
    const {
        recentEntries,
        savedEntries,
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

    const highlightedOutput = useMemo(() => {
        if (!formattedOutput) {
            return '';
        }

        return syntaxHighlightJson(formattedOutput);
    }, [formattedOutput]);

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

    const handleCopyInput = useCallback(async () => {
        if (!data.raw_log) {
            return;
        }

        try {
            if (typeof navigator === 'undefined' || !navigator.clipboard) {
                throw new Error('Clipboard API unavailable');
            }

            if (inputCopyResetTimeoutRef.current) {
                window.clearTimeout(inputCopyResetTimeoutRef.current);
            }

            await navigator.clipboard.writeText(data.raw_log);
            setInputCopyStatus('copied');
        } catch (error) {
            console.error('Unable to copy input text', error);
            setInputCopyStatus('error');
        } finally {
            inputCopyResetTimeoutRef.current = window.setTimeout(() => {
                setInputCopyStatus('idle');
                inputCopyResetTimeoutRef.current = undefined;
            }, 2000);
        }
    }, [data.raw_log]);

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
            if (inputCopyResetTimeoutRef.current) {
                window.clearTimeout(inputCopyResetTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!isOutputModalOpen) {
            setCopyStatus('idle');
            if (copyResetTimeoutRef.current) {
                window.clearTimeout(copyResetTimeoutRef.current);
                copyResetTimeoutRef.current = undefined;
            }
        }
    }, [isOutputModalOpen]);

    useEffect(() => {
        if (!isInputModalOpen) {
            setInputCopyStatus('idle');
            if (inputCopyResetTimeoutRef.current) {
                window.clearTimeout(inputCopyResetTimeoutRef.current);
                inputCopyResetTimeoutRef.current = undefined;
            }
        }
    }, [isInputModalOpen]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setHasSubmitted(true);
        setStatusMessage('Processing your log...');
        setFormattingDuration(null);
        resetTimer();
        startTimer();
        post('/format', {
            onSuccess: () => {
                const duration = stopTimer();
                setFormattingDuration(duration);
                setStatusMessage(`Log formatting complete in ${(duration / 1000).toFixed(2)}s`);
                setTimeout(() => setStatusMessage(''), 3000);
            },
            onError: (errors) => {
                stopTimer();
                setFormattingDuration(null);
                const errorMessage = errors.raw_log || errors.llm_model || 'Error formatting log';
                setStatusMessage(errorMessage);
                setTimeout(() => setStatusMessage(''), 3000);
            },
        });
    };

    const handleHistoryOpen = () => {
        setHistoryOpen(true);
    };

    const handleLoadHistoryEntry = async (entryId: number) => {
        try {
            const entry = await loadHistoryEntry(entryId);
            if (!entry) {
                setStatusMessage('Unable to load history entry');
                setTimeout(() => setStatusMessage(''), 3000);
                return;
            }

            setData('raw_log', entry.rawLog);
            setDisplayLog(entry.formattedLog);
            setHasSubmitted(true);
            setStatusMessage('History entry loaded');
            setTimeout(() => setStatusMessage(''), 3000);
        } catch {
            setStatusMessage('Unable to load history entry');
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
            setStatusMessage('Unable to copy history entry');
            setTimeout(() => setStatusMessage(''), 3000);

            return null;
        }
    };

    const handleLoadSampleLog = (sampleId: string) => {
        const sample = sampleLogs.find((log) => log.id === sampleId);
        if (sample) {
            setData('raw_log', sample.content);
        }
    };

    const handleClearInput = () => {
        setData('raw_log', '');
    };

    const getCharacterCount = () => {
        return data.raw_log.length;
    };

    const getLineCount = () => {
        return data.raw_log.split('\n').length;
    };

    // Keyboard shortcuts
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
            action: handleClearInput,
        },
        {
            ...commonShortcuts.escape,
            action: () => {
                if (historyOpen) setHistoryOpen(false);
                if (preferencesOpen) setPreferencesOpen(false);
                if (settingsOpen) setSettingsOpen(false);
                if (shortcutsOpen) setShortcutsOpen(false);
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

    // Auto-focus input on desktop (not mobile)
    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        if (!isMobile && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, []);

    useEffect(() => {
        if (!processing && !displayLog) {
            return;
        }

        setOutputAnimating(true);

        const timeout = window.setTimeout(() => {
            setOutputAnimating(false);
        }, 400);

        return () => window.clearTimeout(timeout);
    }, [displayLog, processing]);

    const renderOutputContent = () => {
        if (processing) {
            return (
                <div
                    id={processingStatusId}
                    className="flex min-h-[200px] items-center justify-center gap-3 py-12"
                    role="status"
                    aria-live="polite"
                >
                    <Spinner className="h-5 w-5" />
                    <span className="text-sm text-muted-foreground">
                        Formatting your log...
                    </span>
                </div>
            );
        }

        if (formattedOutput) {
            return (
                <pre
                    ref={outputRef}
                    className="m-0 whitespace-pre-wrap text-sm leading-6"
                    tabIndex={0}
                    aria-label="Formatted JSON output"
                >
                    {formattedOutput}
                </pre>
            );
        }

        if (hasSubmitted) {
            return (
                <div role="alert" className="space-y-2 text-left text-sm">
                    <p className="font-medium text-destructive">
                        Unable to display formatted output.
                    </p>
                    <p className="text-muted-foreground">
                        Something went wrong while fetching results. Please try
                        again.
                    </p>
                </div>
            );
        }

        return (
            <pre className="m-0 whitespace-pre-wrap text-left text-sm text-muted-foreground">
                {dummyFormattedPreview}
            </pre>
        );
    };

    return (
        <>
            <Head title="StructLogr - Log Formatter" />
            <div className="flex min-h-screen flex-col bg-background">
                <SkipNavigation />
                <header id={headerId} className="border-b" role="banner">
                    <div className="container mx-auto flex h-16 items-center justify-between px-4">
                        <h1 className="text-xl font-semibold">StructLogr</h1>
                        <nav
                            id={mainNavId}
                            className="flex items-center gap-4"
                            role="navigation"
                            aria-label="Main navigation"
                        >
                            <Button
                                id={shortcutsButtonId}
                                variant="ghost"
                                size="sm"
                                onClick={() => setShortcutsOpen(true)}
                                className="text-sm"
                                aria-label="Show keyboard shortcuts (Ctrl+/)"
                            >
                                <HelpCircle className="mr-2 h-4 w-4" />
                                Shortcuts
                            </Button>
                            <Button
                                id={historyButtonId}
                                variant="ghost"
                                size="sm"
                                onClick={handleHistoryOpen}
                                className="text-sm"
                            >
                                History
                            </Button>
                            <Button
                                id={settingsButtonId}
                                variant="ghost"
                                size="sm"
                                onClick={() => setSettingsOpen(true)}
                                className="text-sm"
                            >
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </Button>
                            {!auth.user && (
                                <>
                                    <Link
                                        id={loginLinkId}
                                        href={login()}
                                        className="text-sm text-muted-foreground hover:text-foreground"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        id={registerLinkId}
                                        href={register()}
                                        className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                <main id={mainContentId} role="main">
                    {/* Screen reader live region for status updates */}
                    <div
                        id={statusLiveRegionId}
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                        className="sr-only"
                    >
                        {statusMessage}
                    </div>

                    <div id={heroSectionId}>
                        <HeroSection />
                    </div>

                    <section
                        id={formatterSectionId}
                        ref={formRef}
                        className="container mx-auto flex min-h-[90vh] flex-col px-4 py-8 sm:px-6 lg:px-8"
                        aria-labelledby={formatterHeadingId}
                    >
                        <div className="mx-auto flex h-full max-w-6xl flex-1 flex-col gap-8">
                            <div className="space-y-4 text-center">
                                <h2
                                    id={formatterHeadingId}
                                    className="text-3xl leading-tight font-bold lg:text-4xl"
                                >
                                    Log Formatter
                                </h2>
                                <p id={formatterDescriptionId} className="text-lg leading-relaxed text-muted-foreground">
                                    Transform raw log text into structured JSON
                                    with a single request.
                                </p>
                            </div>

                            <div className="grid min-h-0 flex-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                                <Card
                                    id={inputCardId}
                                    className="flex h-full flex-col shadow-sm transition-shadow hover:shadow-md"
                                >
                                    <CardHeader id={inputCardHeaderId}>
                                        <CardTitle id={inputCardTitleId}>Raw Log Input</CardTitle>
                                    </CardHeader>
                                    <CardContent id={inputCardContentId} className="flex flex-1 flex-col gap-6 overflow-hidden">
                                        <form
                                            id={formId}
                                            onSubmit={submit}
                                            className="flex h-full flex-1 flex-col gap-6"
                                            aria-label="Log formatting form"
                                        >
                                            {/* Sample Logs Dropdown */}
                                            <div id={sampleLogsContainerId} className="space-y-2">
                                                <label
                                                    id={sampleLogsLabelId}
                                                    htmlFor={sampleLogsSelectId}
                                                    className="text-sm font-medium"
                                                >
                                                    Try an example
                                                </label>
                                                <select
                                                    id={sampleLogsSelectId}
                                                    data-testid={
                                                        sampleLogsTestId
                                                    }
                                                    onChange={(e) =>
                                                        handleLoadSampleLog(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="focus-ring w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                                                    defaultValue=""
                                                    aria-label="Select a sample log to load"
                                                >
                                                    <option id={sampleLogsOptionDefaultId} value="">
                                                        Select a sample log
                                                        type...
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

                                            {/* Input Toolbar */}
                                            <div id={inputToolbarId} className="flex justify-end">
                                                <Button
                                                    id={viewFullInputButtonId}
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setInputModalOpen(true)}
                                                    disabled={!data.raw_log.trim()}
                                                    className="inline-flex items-center gap-2"
                                                    aria-label="Open full input text in a modal dialog"
                                                >
                                                    <Maximize2 className="h-4 w-4" />
                                                    View Full Input
                                                </Button>
                                            </div>

                                            {/* Textarea with Clear Button */}
                                            <div id={textareaWrapperId} className="flex min-h-0 flex-1 flex-col gap-3">
                                                <div id={textareaContainerRelativeId} className="relative flex min-h-0 flex-1">
                                                    <Textarea
                                                        ref={textareaRef}
                                                        id={rawLogTextareaId}
                                                        data-testid={
                                                            rawLogTestId
                                                        }
                                                        name="raw_log"
                                                        placeholder="Paste your raw log text here..."
                                                        className="min-h-[280px] flex-1 resize-none rounded-md pr-10"
                                                        value={data.raw_log}
                                                        onChange={(e) =>
                                                            setData(
                                                                'raw_log',
                                                                e.target.value,
                                                            )
                                                        }
                                                        aria-label="Raw log input"
                                                    />
                                                    {data.raw_log && (
                                                        <button
                                                            id={clearButtonId}
                                                            type="button"
                                                            onClick={
                                                                handleClearInput
                                                            }
                                                            className="focus-ring absolute top-3 right-3 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                                            aria-label="Clear input"
                                                            tabIndex={0}
                                                        >
                                                            ×
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Character and Line Counter */}
                                                <div id={statsCounterId} className="flex justify-between text-xs text-muted-foreground">
                                                    <span id={characterCounterId}>
                                                        {getCharacterCount()}{' '}
                                                        characters •{' '}
                                                        {getLineCount()} lines
                                                    </span>
                                                    <span id={readyStatusId}>
                                                        {getCharacterCount() > 0
                                                            ? '✓ Ready to format'
                                                            : 'Enter log text to format'}
                                                    </span>
                                                </div>

                                                {errors.raw_log && (
                                                    <div
                                                        id={errorAlertId}
                                                        role="alert"
                                                        aria-live="assertive"
                                                        className="mt-2"
                                                    >
                                                        <InputError
                                                            message={
                                                                errors.raw_log
                                                            }
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div id={buttonsContainerId} className="mt-auto flex flex-col gap-3">
                                                <div className="flex flex-col gap-2">
                                                    <div id={modelTimerContainerId} className="flex items-center justify-between">
                                                        <span id={modelLabelId} className="text-xs font-bold text-muted-foreground">
                                                            Model: <span id={modelDisplayId}>{preferences.llmModel}</span>
                                                        </span>
                                                        {formattingDuration !== null && !processing && (
                                                            <span id={formattingCompletedId} className="text-xs text-emerald-600 dark:text-emerald-400">
                                                                ✓ Completed in {(formattingDuration / 1000).toFixed(2)}s
                                                            </span>
                                                        )}
                                                        {timerRunning && processing && (
                                                            <span id={formattingTimerId} className="text-xs text-muted-foreground">
                                                                {(elapsedTime / 1000).toFixed(2)}s
                                                            </span>
                                                        )}
                                                    </div>
                                                    <Button
                                                        id={formatButtonId}
                                                        data-testid={formatButtonTestId}
                                                        type="submit"
                                                        disabled={
                                                            processing ||
                                                            !data.raw_log.trim()
                                                        }
                                                        className="w-full rounded-md"
                                                        aria-label={
                                                            processing
                                                                ? 'Processing log format request'
                                                                : 'Format log with AI'
                                                        }
                                                    >
                                                        {processing && (
                                                            <Spinner className="mr-2" />
                                                        )}
                                                        Format Log
                                                    </Button>
                                                </div>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>

                                <Card
                                    id={outputCardId}
                                    className={cn(
                                        'flex h-full flex-col shadow-sm transition-shadow hover:shadow-md',
                                        outputAnimating &&
                                            'animate-in fade-in slide-in-from-right-4',
                                    )}
                                >
                                    <CardHeader id={outputCardHeaderId} className="flex flex-col gap-2 text-left">
                                        <div>
                                            <CardTitle id={outputCardTitleId}>Converted Log</CardTitle>
                                            <p id={outputCardSubtitleId} className="text-sm text-muted-foreground">
                                                Structured output preview
                                            </p>
                                        </div>
                                    </CardHeader>
                                    <CardContent id={outputCardContentId} className="flex flex-1 flex-col gap-4 overflow-hidden">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <p
                                                id={outputPreviewDescId}
                                                className="text-sm text-muted-foreground"
                                                aria-live="polite"
                                            >
                                                {statusMessage ||
                                                    (formattedOutput
                                                        ? 'Preview updated. Open the full output to inspect or copy the JSON.'
                                                        : 'Run the formatter or load a sample log to generate structured output.')}
                                            </p>
                                        </div>
                                        <div
                                            id={outputDisplayId}
                                            aria-busy={processing}
                                            className="flex h-[60vh] flex-col overflow-hidden rounded-lg border border-border/40 bg-background/80 text-sm leading-6"
                                        >
                                            <div id={outputToolbarId} className="flex flex-shrink-0 justify-end gap-2 bg-background/95 px-4 py-3 shadow-sm backdrop-blur">
                                                <Button
                                                    id={copyOutputButtonId}
                                                    type="button"
                                                    variant={
                                                        copyStatus === 'error'
                                                            ? 'destructive'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    onClick={handleCopyOutput}
                                                    disabled={!formattedOutput}
                                                    className="inline-flex items-center gap-2"
                                                    aria-live="polite"
                                                    aria-label="Copy formatted output to clipboard"
                                                >
                                                    {copyStatus === 'copied' ? (
                                                        <>
                                                            <Check className="h-4 w-4" />
                                                            Copied!
                                                        </>
                                                    ) : copyStatus === 'error' ? (
                                                        <>
                                                            <ClipboardCopy className="h-4 w-4" />
                                                            Copy Failed
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ClipboardCopy className="h-4 w-4" />
                                                            Copy Output
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    id={viewFullOutputButtonId}
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setOutputModalOpen(true)
                                                    }
                                                    disabled={!formattedOutput}
                                                    className="inline-flex items-center gap-2"
                                                    aria-label="Open full formatted output in a modal dialog"
                                                >
                                                    <Maximize2 className="h-4 w-4" />
                                                    View Full Output
                                                </Button>
                                            </div>
                                            <div id={outputContentWrapperId} className="flex-1 overflow-auto px-4 pb-4">
                                                {renderOutputContent()}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </section>
                </main>

                <footer id={footerId} className="border-t py-6">
                    <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                        <p id={footerTextId}>Powered by Laravel + React + Prism</p>
                    </div>
                </footer>
            </div>

            <Button
                id={preferencesButtonId}
                variant="secondary"
                size="lg"
                onClick={() => setPreferencesOpen(true)}
                className="focus-ring fixed bottom-4 right-4 z-50 inline-flex h-11 gap-2 px-5 shadow-lg sm:bottom-6 sm:right-6"
                aria-label="Open formatting preferences"
            >
                <Settings className="h-4 w-4" />
                Preferences
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
                savedEntries={savedEntries}
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

            <Dialog
                open={isInputModalOpen}
                onOpenChange={setInputModalOpen}
            >
                <DialogContent id={inputModalId} className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle id={inputModalTitleId}>Raw Log Input</DialogTitle>
                        <DialogDescription id={inputModalDescId}>
                            Review the full raw log text and copy it if needed.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea id={inputModalScrollAreaId} className="max-h-[70vh] rounded-md border border-border/40">
                        {data.raw_log.trim() ? (
                            <pre
                                id={inputModalPreId}
                                className="whitespace-pre-wrap p-4 text-sm leading-6"
                            >
                                {data.raw_log}
                            </pre>
                        ) : (
                            <div id={inputModalEmptyId} className="p-4 text-sm text-muted-foreground">
                                No input text is available yet. Enter log text to
                                view it here.
                            </div>
                        )}
                    </ScrollArea>
                    <DialogFooter id={inputModalFooterId} className="gap-2">
                        <Button
                            id={inputModalCloseButtonId}
                            type="button"
                            variant="outline"
                            onClick={() => setInputModalOpen(false)}
                        >
                            Close
                        </Button>
                        <Button
                            id={inputModalCopyButtonId}
                            type="button"
                            variant={
                                inputCopyStatus === 'error' ? 'destructive' : 'default'
                            }
                            onClick={handleCopyInput}
                            disabled={!data.raw_log.trim()}
                            aria-live="polite"
                        >
                            {inputCopyStatus === 'copied' ? (
                                <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Copied!
                                </>
                            ) : inputCopyStatus === 'error' ? (
                                <>
                                    <ClipboardCopy className="mr-2 h-4 w-4" />
                                    Copy Failed
                                </>
                            ) : (
                                <>
                                    <ClipboardCopy className="mr-2 h-4 w-4" />
                                    Copy to Clipboard
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isOutputModalOpen}
                onOpenChange={setOutputModalOpen}
            >
                <DialogContent id={outputModalId} className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle id={outputModalTitleId}>Formatted JSON Output</DialogTitle>
                        <DialogDescription id={outputModalDescId}>
                            Review the full transformed log and copy it for your
                            workflow.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea id={outputModalScrollAreaId} className="max-h-[70vh] rounded-md border border-border/40">
                        {formattedOutput ? (
                            <pre
                                id={outputModalPreId}
                                className="whitespace-pre-wrap p-4 text-sm leading-6"
                                dangerouslySetInnerHTML={{
                                    __html: highlightedOutput,
                                }}
                            />
                        ) : (
                            <div id={outputModalEmptyId} className="p-4 text-sm text-muted-foreground">
                                No formatted output is available yet. Run the
                                formatter to generate a preview.
                            </div>
                        )}
                    </ScrollArea>
                    <DialogFooter id={outputModalFooterId} className="gap-2">
                        <Button
                            id={outputModalCloseButtonId}
                            type="button"
                            variant="outline"
                            onClick={() => setOutputModalOpen(false)}
                        >
                            Close
                        </Button>
                        <Button
                            id={outputModalCopyButtonId}
                            type="button"
                            variant={
                                copyStatus === 'error' ? 'destructive' : 'default'
                            }
                            onClick={handleCopyOutput}
                            disabled={!formattedOutput}
                            aria-live="polite"
                        >
                            {copyStatus === 'copied' ? (
                                <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Copied!
                                </>
                            ) : copyStatus === 'error' ? (
                                <>
                                    <ClipboardCopy className="mr-2 h-4 w-4" />
                                    Copy Failed
                                </>
                            ) : (
                                <>
                                    <ClipboardCopy className="mr-2 h-4 w-4" />
                                    Copy to Clipboard
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
