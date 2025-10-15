import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

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
    const { data, setData, post, processing, errors } = useForm({
        raw_log: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/format');
    };

    return (
        <>
            <Head title="StructLogr - Log Formatter" />
            <div className="flex min-h-screen flex-col bg-background">
                <header className="border-b">
                    <div className="container mx-auto flex h-16 items-center justify-between px-4">
                        <h1 className="text-xl font-semibold">StructLogr</h1>
                        <nav className="flex items-center gap-4">
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

                <main className="container mx-auto flex-1 px-4 py-8">
                    <div className="mx-auto max-w-4xl space-y-6">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold">
                                Log Formatter
                            </h2>
                            <p className="mt-2 text-muted-foreground">
                                Transform raw log text into structured JSON
                            </p>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Raw Log Input</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={submit} className="space-y-4">
                                    <div>
                                        <Textarea
                                            name="raw_log"
                                            placeholder="Paste your raw log text here..."
                                            className="min-h-[200px]"
                                            value={data.raw_log}
                                            onChange={(e) =>
                                                setData('raw_log', e.target.value)
                                            }
                                        />
                                        <InputError
                                            message={errors.raw_log}
                                            className="mt-2"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <Button type="submit" disabled={processing}>
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
                            <Card>
                                <CardHeader>
                                    <CardTitle>Formatted JSON Output</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
                                        {JSON.stringify(formattedLog, null, 2)}
                                    </pre>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </main>

                <footer className="border-t py-6">
                    <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                        <p>
                            Powered by Laravel + React + Prism
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
