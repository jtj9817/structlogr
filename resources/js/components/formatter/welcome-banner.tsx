import { Button } from '@/components/ui/button';
import { ArrowDown, Sparkles, X } from 'lucide-react';

interface WelcomeBannerProps {
    onDismiss: () => void;
    onGetStarted: () => void;
}

export function WelcomeBanner({ onDismiss, onGetStarted }: WelcomeBannerProps) {
    return (
        <div className="relative mb-6 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:border-blue-800 dark:from-blue-950/20 dark:to-indigo-950/20">
            <button
                onClick={onDismiss}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
                <X className="h-4 w-4" />
            </button>

            <div className="mb-3 flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Welcome to StructLogr!
                </h2>
            </div>

            <p className="mb-4 max-w-2xl text-gray-700 dark:text-gray-300">
                Transform unstructured logs into clean JSON with AI. Extract
                timestamps, levels, messages, and metadata automatically from
                any log format.
            </p>

            <div className="flex items-center gap-3">
                <Button onClick={onGetStarted} className="gap-2">
                    Get Started
                    <ArrowDown className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    Try an example or paste your own logs
                </span>
            </div>
        </div>
    );
}
