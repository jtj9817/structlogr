import { HistorySidebar } from '@/components/formatter/history-sidebar';
import HeroSection from '@/components/hero-section';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useHistory } from '@/hooks/use-history';
import { login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

interface FormatterPageProps {
    formattedLog?: {
        timestamp?: string;
        level?: string;
        message?: string;
        source?: string;
        metadata?: Record<string, unknown>;
        [key: string]: unknown;
    };
}

export default function FormatterPage({ formattedLog }: FormatterPageProps) {
    const { auth } = usePage<SharedData>().props;
    const formRef = useRef<HTMLElement>(null);
    const [historyOpen, setHistoryOpen] = useState(false);
    const { addEntry } = useHistory();
    const { data, setData, post, processing, errors } = useForm({
        raw_log: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/format', {
            onSuccess: () => {
                // Add to history on successful formatting
                if (formattedLog) {
                    addEntry(data.raw_log, formattedLog);
                }
            },
        });
    };

    const handleGetStarted = () => {
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleHistoryOpen = () => {
        setHistoryOpen(true);
    };

    const handleLoadHistoryEntry = (
        rawLog: string,
        _formattedLogData: Record<string, unknown>,
    ) => {
        setData('raw_log', rawLog);
        // The formatted log will be displayed through the props
    };

    return (
        <>
            <Head title="StructLogr - Log Formatter" />
            <div className="flex min-h-screen flex-col bg-background">
                <header className="border-b">
                    <div className="container mx-auto flex h-16 items-center justify-between px-4">
                        <h1 className="text-xl font-semibold">StructLogr</h1>
                        <nav className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleHistoryOpen}
                                className="text-sm"
                            >
                                History
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

                <main>
                    <HeroSection onGetStarted={handleGetStarted} />

                    <section
                        id="formatter"
                        ref={formRef}
                        className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
                    >
                        <div className="mx-auto max-w-4xl space-y-8">
                            <div className="space-y-4 text-center">
                                <h2 className="text-3xl leading-tight font-bold lg:text-4xl">
                                    Log Formatter
                                </h2>
                                <p className="text-lg leading-relaxed text-muted-foreground">
                                    Transform raw log text into structured JSON
                                </p>
                            </div>

                            <Card className="shadow-sm transition-shadow hover:shadow-md">
                                <CardHeader>
                                    <CardTitle>Raw Log Input</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <form
                                        onSubmit={submit}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-2">
                                            <Textarea
                                                name="raw_log"
                                                placeholder="Paste your raw log text here..."
                                                className="min-h-[200px] rounded-md"
                                                value={data.raw_log}
                                                onChange={(e) =>
                                                    setData(
                                                        'raw_log',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.raw_log}
                                                className="mt-2"
                                            />
                                        </div>
                                        <div className="flex items-center">
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                className="rounded-md"
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

                            {formattedLog && (
                                <Card className="shadow-sm transition-shadow hover:shadow-md">
                                    <CardHeader>
                                        <CardTitle>
                                            Formatted JSON Output
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <pre className="overflow-x-auto rounded-lg bg-muted p-6 text-sm">
                                            {JSON.stringify(
                                                formattedLog,
                                                null,
                                                2,
                                            )}
                                        </pre>
                                    </CardContent>
                                </Card>
                            )}
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
            />
        </>
    );
}
