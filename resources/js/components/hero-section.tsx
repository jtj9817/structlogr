import { Button } from '@/components/ui/button';
import { Braces, FileText, Sparkles } from 'lucide-react';

interface HeroSectionProps {
    onGetStarted: () => void;
}

export default function HeroSection({ onGetStarted }: HeroSectionProps) {
    return (
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-16 lg:py-24 dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
                    {/* Left column: Text content */}
                    <div className="space-y-6 text-center lg:text-left">
                        <h1 className="text-4xl leading-tight font-bold text-gray-900 lg:text-5xl dark:text-white">
                            Transform Logs into Structured Data
                        </h1>
                        <p className="text-lg leading-relaxed text-gray-600 lg:text-xl dark:text-gray-300">
                            AI-powered log parsing that extracts timestamps,
                            levels, messages, and metadata automatically
                        </p>
                        <Button
                            size="lg"
                            onClick={onGetStarted}
                            className="inline-flex items-center gap-2"
                        >
                            <Sparkles className="h-5 w-5" />
                            Get Started
                        </Button>
                    </div>

                    {/* Right column: Visual illustration */}
                    <div className="flex justify-center lg:justify-end">
                        <LogTransformationIllustration />
                    </div>
                </div>
            </div>
        </section>
    );
}

function LogTransformationIllustration() {
    return (
        <div className="relative h-64 w-full max-w-md lg:h-80">
            <svg
                viewBox="0 0 400 320"
                className="h-full w-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Background gradient */}
                <defs>
                    <linearGradient
                        id="bgGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                    >
                        <stop
                            offset="0%"
                            stopColor="#3B82F6"
                            stopOpacity="0.1"
                        />
                        <stop
                            offset="100%"
                            stopColor="#8B5CF6"
                            stopOpacity="0.1"
                        />
                    </linearGradient>
                    <linearGradient
                        id="arrowGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                    >
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                </defs>

                {/* Background rect */}
                <rect
                    width="400"
                    height="320"
                    fill="url(#bgGradient)"
                    rx="12"
                />

                {/* Raw log section */}
                <g transform="translate(20, 40)">
                    <rect
                        x="0"
                        y="0"
                        width="140"
                        height="80"
                        fill="white"
                        stroke="#E5E7EB"
                        strokeWidth="2"
                        rx="6"
                    />
                    <FileText
                        className="text-blue-500"
                        size={24}
                        x={10}
                        y={10}
                    />
                    <text
                        x="10"
                        y="50"
                        fontFamily="monospace"
                        fontSize="10"
                        fill="#6B7280"
                    >
                        2024-10-15 14:23:45
                    </text>
                    <text
                        x="10"
                        y="65"
                        fontFamily="monospace"
                        fontSize="10"
                        fill="#6B7280"
                    >
                        ERROR: Database failed
                    </text>
                </g>

                {/* AI Brain/Processing */}
                <g transform="translate(160, 60)">
                    <circle
                        cx="40"
                        cy="40"
                        r="35"
                        fill="white"
                        stroke="url(#arrowGradient)"
                        strokeWidth="2"
                    />
                    <Sparkles
                        className="text-purple-500"
                        size={32}
                        x={24}
                        y={24}
                    />

                    {/* Animated pulse effect */}
                    <circle
                        cx="40"
                        cy="40"
                        r="35"
                        fill="none"
                        stroke="url(#arrowGradient)"
                        strokeWidth="2"
                        opacity="0.3"
                    >
                        <animate
                            attributeName="r"
                            values="35;45;35"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                        <animate
                            attributeName="opacity"
                            values="0.3;0;0.3"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    </circle>
                </g>

                {/* Arrow */}
                <g transform="translate(240, 90)">
                    <path
                        d="M 0 10 L 40 10"
                        stroke="url(#arrowGradient)"
                        strokeWidth="3"
                    />
                    <path
                        d="M 35 5 L 45 10 L 35 15"
                        stroke="url(#arrowGradient)"
                        strokeWidth="3"
                        fill="none"
                    />
                </g>

                {/* JSON Output section */}
                <g transform="translate(240, 140)">
                    <rect
                        x="0"
                        y="0"
                        width="140"
                        height="100"
                        fill="white"
                        stroke="#10B981"
                        strokeWidth="2"
                        rx="6"
                    />
                    <Braces
                        className="text-green-500"
                        size={24}
                        x={10}
                        y={10}
                    />
                    <text
                        x="10"
                        y="45"
                        fontFamily="monospace"
                        fontSize="9"
                        fill="#059669"
                    >
                        "timestamp": "...",
                    </text>
                    <text
                        x="10"
                        y="58"
                        fontFamily="monospace"
                        fontSize="9"
                        fill="#059669"
                    >
                        "level": "ERROR",
                    </text>
                    <text
                        x="10"
                        y="71"
                        fontFamily="monospace"
                        fontSize="9"
                        fill="#059669"
                    >
                        "message": "...",
                    </text>
                    <text
                        x="10"
                        y="84"
                        fontFamily="monospace"
                        fontSize="9"
                        fill="#059669"
                    >
                        "source": "..."
                    </text>
                </g>

                {/* Labels */}
                <text
                    x="90"
                    y="145"
                    textAnchor="middle"
                    fontFamily="system-ui"
                    fontSize="12"
                    fill="#6B7280"
                    fontWeight="500"
                >
                    Raw Log
                </text>
                <text
                    x="200"
                    y="145"
                    textAnchor="middle"
                    fontFamily="system-ui"
                    fontSize="12"
                    fill="#6B7280"
                    fontWeight="500"
                >
                    AI Processing
                </text>
                <text
                    x="310"
                    y="265"
                    textAnchor="middle"
                    fontFamily="system-ui"
                    fontSize="12"
                    fill="#6B7280"
                    fontWeight="500"
                >
                    Structured JSON
                </text>
            </svg>
        </div>
    );
}
