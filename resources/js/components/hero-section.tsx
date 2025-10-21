export default function HeroSection() {
    return (
        <section
            id="hero-section"
            className="relative flex min-h-[60vh] flex-col items-center justify-center bg-[#061417] px-6 py-24 text-center text-[#c6bfbb]"
        >
            <div className="w-full max-w-2xl space-y-10">
                <h1
                    id="hero-title"
                    className="text-4xl font-semibold tracking-tight sm:text-5xl"
                >
                    StructLogr
                </h1>

                <details
                    id="hero-details"
                    className="group mx-auto max-w-lg rounded-xl border border-[#285669] bg-[#012c3c]/60 px-6 py-5 text-left text-base shadow-lg"
                >
                    <summary
                        id="hero-summary"
                        className="cursor-pointer text-sm font-medium tracking-[0.3em] text-[#c6bfbb] uppercase transition select-none group-open:text-white"
                    >
                        What does StructLogr do?
                    </summary>
                    <p
                        id="hero-description"
                        className="mt-4 text-sm leading-relaxed text-[#c6bfbb]/85"
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
