import { home, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="StructLogr">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#061417] px-6 py-10 text-[#c6bfbb]">
                <header className="absolute top-6 right-6 text-sm">
                    <nav className="flex items-center gap-4">
                        {auth.user ? (
                            <Link
                                href={home()}
                                className="rounded-full border border-[#285669] px-4 py-1.5 text-[#c6bfbb] transition hover:bg-[#012c3c]"
                            >
                                Log Formatter
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="rounded-full border border-transparent px-4 py-1.5 text-[#c6bfbb] transition hover:text-white/90"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={register()}
                                    className="rounded-full border border-[#285669] px-4 py-1.5 text-[#c6bfbb] transition hover:bg-[#012c3c]"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                <main className="w-full max-w-2xl space-y-8 text-center">
                    <h1 className="text-4xl font-semibold tracking-tight">
                        StructLogr
                    </h1>

                    <details className="group mx-auto max-w-xl rounded-xl border border-[#285669] bg-[#012c3c]/60 px-6 py-5 text-left text-base shadow-lg">
                        <summary className="cursor-pointer text-sm font-medium tracking-[0.3em] text-[#c6bfbb] uppercase transition select-none group-open:text-white">
                            What does StructLogr do?
                        </summary>
                        <p className="mt-4 text-sm leading-relaxed text-[#c6bfbb]/85">
                            StructLogr reformats raw application log streams
                            into structured JSON using Prism-powered LLM
                            parsing. Drop in your text, select providers, and
                            deliver searchable telemetry for incident response
                            and analytics.
                        </p>
                    </details>
                </main>
            </div>
        </>
    );
}
