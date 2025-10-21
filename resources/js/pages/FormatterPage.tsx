import { FormattingPreferences } from '@/components/formatter/formatting-preferences';
import { HistorySidebar } from '@/components/formatter/history-sidebar';
import HeroSection from '@/components/hero-section';
import InputError from '@/components/input-error';
import KeyboardShortcutsModal from '@/components/keyboard-shortcuts-modal';
import { SettingsPanel } from '@/components/settings-panel';
import SkipNavigation from '@/components/skip-navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useHistory } from '@/hooks/use-history';
import {
    commonShortcuts,
    useKeyboardShortcuts,
} from '@/hooks/use-keyboard-shortcuts';
import { usePreferences } from '@/hooks/use-preferences';
import { login, register } from '@/routes';
import { type SharedData } from '@/types';
import type { HistoryEntry } from '@/types/history';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { HelpCircle, Settings } from 'lucide-react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';

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

const clockworkFrames = [
    `   [===]   [===]
  <  o  > <  *  >
   [===]   [===]
     \\\\     //
      \\\\   //
   -- clockwork syncing --`,
    `   [===]   [===]
  <  *  > <  o  >
   [===]   [===]
      ||   ||
      ||   ||
   -- clockwork syncing --`,
    `   [===]   [===]
  <  o  > <  *  >
   [===]   [===]
      //   \\\\
     //     \\\\
   -- clockwork syncing --`,
    `   [===]   [===]
  <  *  > <  o  >
   [===]   [===]
      ==   ==
     ==     ==
   -- clockwork syncing --`,
];

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

    // Generate unique IDs for form elements
    const sampleLogsSelectId = 'formatter-sample-logs-select';
    const sampleLogsTestId = 'test-formatter-sample-logs';

    const rawLogTextareaId = 'formatter-raw-log-textarea';
    const rawLogTestId = 'test-formatter-raw-log';

    const formatButtonId = 'formatter-format-button';
    const formatButtonTestId = 'test-formatter-format';
    const [historyOpen, setHistoryOpen] = useState(false);
    const [preferencesOpen, setPreferencesOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [animationFrame, setAnimationFrame] = useState(0);
    const [displayLog, setDisplayLog] = useState(formattedLog);
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
    const { applyPreferences } = usePreferences();
    const { data, setData, post, processing, errors } = useForm({
        raw_log: '',
    });

    useEffect(() => {
        setDisplayLog(formattedLog);
    }, [formattedLog]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setHasSubmitted(true);
        setAnimationFrame(0);
        setStatusMessage('Processing your log...');
        post('/format', {
            onSuccess: () => {
                setStatusMessage('Log formatting complete');
                // Clear status message after 3 seconds
                setTimeout(() => setStatusMessage(''), 3000);
            },
            onError: () => {
                setStatusMessage('Error formatting log');
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
        } catch (error) {
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
        } catch (error) {
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
                    }) as any;
                    formEvent.preventDefault = () => {};
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
        if (!processing) {
            setAnimationFrame(0);
            return;
        }

        const interval = window.setInterval(() => {
            setAnimationFrame((frame) => (frame + 1) % clockworkFrames.length);
        }, 220);

        return () => window.clearInterval(interval);
    }, [processing]);

    const renderOutputContent = () => {
        if (processing) {
            return (
                <pre className="font-mono text-sm leading-6 whitespace-pre-line text-accent-foreground/90">
                    {clockworkFrames[animationFrame]}
                </pre>
            );
        }

        if (displayLog) {
            return (
                <pre
                    ref={outputRef}
                    className="text-sm"
                    tabIndex={0}
                    aria-label="Formatted JSON output"
                >
                    {JSON.stringify(applyPreferences(displayLog), null, 2)}
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
                        {statusMessage ||
                            'Something went wrong while fetching results. Please try again.'}
                    </p>
                </div>
            );
        }

        return (
            <pre className="text-left text-sm whitespace-pre-wrap text-muted-foreground">
                {dummyFormattedPreview}
            </pre>
        );
    };

    return (
        <>
            <Head title="StructLogr - Log Formatter" />
            <div className="flex min-h-screen flex-col bg-background">
                <SkipNavigation />
                <header className="border-b" role="banner">
                    <div className="container mx-auto flex h-16 items-center justify-between px-4">
                        <h1 className="text-xl font-semibold">StructLogr</h1>
                        <nav
                            className="flex items-center gap-4"
                            role="navigation"
                            aria-label="Main navigation"
                        >
                            <Button
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
                                variant="ghost"
                                size="sm"
                                onClick={handleHistoryOpen}
                                className="text-sm"
                            >
                                History
                            </Button>
                            <Button
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
                                        href={login()}
                                        className="text-sm text-muted-foreground hover:text-foreground"
                                    >
                                        Log in
                                    </Link>
                                    <Link
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

                <main role="main" id="main-content">
                    {/* Screen reader live region for status updates */}
                    <div
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                        className="sr-only"
                    >
                        {statusMessage}
                    </div>

                    <HeroSection />

                    <section
                        id="formatter"
                        ref={formRef}
                        className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
                        aria-labelledby="formatter-heading"
                    >
                        <div className="mx-auto flex max-w-6xl flex-col gap-10">
                            <div className="space-y-4 text-center">
                                <h2
                                    id="formatter-heading"
                                    className="text-3xl leading-tight font-bold lg:text-4xl"
                                >
                                    Log Formatter
                                </h2>
                                <p className="text-lg leading-relaxed text-muted-foreground">
                                    Transform raw log text into structured JSON
                                    with a single request.
                                </p>
                            </div>

                            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                                <Card className="shadow-sm transition-shadow hover:shadow-md">
                                    <CardHeader>
                                        <CardTitle>Raw Log Input</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <form
                                            onSubmit={submit}
                                            className="space-y-6"
                                            aria-label="Log formatting form"
                                        >
                                            {/* Sample Logs Dropdown */}
                                            <div className="space-y-2">
                                                <label
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
                                                    <option value="">
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

                                            {/* Textarea with Clear Button */}
                                            <div className="space-y-2">
                                                <div className="relative">
                                                    <Textarea
                                                        ref={textareaRef}
                                                        id={rawLogTextareaId}
                                                        data-testid={
                                                            rawLogTestId
                                                        }
                                                        name="raw_log"
                                                        placeholder="Paste your raw log text here..."
                                                        className="min-h-[200px] rounded-md pr-10"
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
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>
                                                        {getCharacterCount()}{' '}
                                                        characters •{' '}
                                                        {getLineCount()} lines
                                                    </span>
                                                    <span>
                                                        {getCharacterCount() > 0
                                                            ? '✓ Ready to format'
                                                            : 'Enter log text to format'}
                                                    </span>
                                                </div>

                                                {errors.raw_log && (
                                                    <div
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

                                            <div className="flex items-center">
                                                <Button
                                                    id={formatButtonId}
                                                    data-testid={
                                                        formatButtonTestId
                                                    }
                                                    type="submit"
                                                    disabled={
                                                        processing ||
                                                        !data.raw_log.trim()
                                                    }
                                                    className="rounded-md"
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
                                        </form>
                                    </CardContent>
                                </Card>

                                <Card className="shadow-sm transition-shadow hover:shadow-md">
                                    <CardHeader className="flex flex-col gap-2 text-left sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <CardTitle>Converted Log</CardTitle>
                                            <p className="text-sm text-muted-foreground">
                                                Structured output preview
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                setPreferencesOpen(true)
                                            }
                                            className="h-9 gap-2 px-3"
                                            disabled={!displayLog}
                                            aria-label="Open formatting preferences"
                                        >
                                            <Settings className="h-4 w-4" />
                                            <span className="hidden sm:inline">
                                                Preferences
                                            </span>
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {statusMessage && (
                                            <p
                                                className="text-sm text-muted-foreground"
                                                aria-live="polite"
                                            >
                                                {statusMessage}
                                            </p>
                                        )}
                                        <div className="max-h-[520px] min-h-[320px] overflow-auto rounded-lg border border-border/40 bg-background/80 p-4 font-mono text-sm leading-6">
                                            {renderOutputContent()}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="border-t py-6">
                    <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                        <p>Powered by Laravel + React + Prism</p>
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
        </>
    );
}
