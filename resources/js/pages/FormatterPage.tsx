import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Formatter',
        href: '/',
    },
];

type FormattedLog = {
    id: number;
    raw_log: string;
    formatted_log: object;
    created_at: string;
    updated_at: string;
};

interface FormatterPageProps {
    formatted_log: FormattedLog | null;
}

export default function FormatterPage({ formatted_log }: FormatterPageProps) {
    const { data, setData, post, processing, errors } = useForm({
        raw_log: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/format');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Log Formatter" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Raw Log Input</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <Textarea
                                    name="raw_log"
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
                                    {processing && <Spinner className="mr-2" />}
                                    Format Log
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {formatted_log && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Formatted JSON Output</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="overflow-x-auto rounded-md bg-neutral-100 p-4 dark:bg-neutral-800">
                                {JSON.stringify(
                                    formatted_log.formatted_log,
                                    null,
                                    2,
                                )}
                            </pre>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
