export default function HeroSection() {
    return (
        <section
            id="hero-section"
            className="relative flex h-[10vh] min-h-[10vh] max-h-[10vh] flex-col items-center justify-center overflow-hidden bg-[#061417] px-4 py-4 text-center text-[#c6bfbb]"
        >
            <div className="w-full max-w-2xl space-y-4 overflow-y-auto">
                <h1
                    id="hero-title"
                    className="text-2xl font-semibold tracking-tight sm:text-3xl"
                >
                    StructLogr
                </h1>

                <details
                    id="hero-details"
                    className="group mx-auto max-w-lg rounded-xl border border-[#285669] bg-[#012c3c]/60 px-4 py-4 text-left text-sm shadow-lg"
                >
                    <summary
                        id="hero-summary"
                        className="select-none cursor-pointer text-xs font-medium uppercase tracking-[0.3em] text-[#c6bfbb] transition group-open:text-white"
                    >
                        What does StructLogr do?
                    </summary>
                    <p
                        id="hero-description"
                        className="mt-3 text-xs leading-relaxed text-[#c6bfbb]/85"
                    >
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
