export default function HeroSection() {
    return (
        <section className="relative flex min-h-[60vh] flex-col items-center justify-center bg-[#061417] px-6 py-24 text-center text-[#c6bfbb]">
            <div className="w-full max-w-2xl space-y-10">
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                    StructLogr
                </h1>

                <details className="group mx-auto max-w-lg rounded-xl border border-[#285669] bg-[#012c3c]/60 px-6 py-5 text-left text-base shadow-lg">
                    <summary className="cursor-pointer select-none text-sm font-medium uppercase tracking-[0.3em] text-[#c6bfbb] transition group-open:text-white">
                        What does StructLogr do?
                    </summary>
                    <p className="mt-4 text-sm leading-relaxed text-[#c6bfbb]/85">
                        StructLogr reformats raw application log streams into
                        structured JSON using Prism-powered LLM parsing. Drop in
                        your text, select providers, and deliver searchable
                        telemetry for incident response and analytics.
                    </p>
                </details>
            </div>
        </section>
    );
}
