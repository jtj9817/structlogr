import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TourStep {
    id: string;
    title: string;
    content: string;
    target: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
    {
        id: 'input',
        title: 'Paste Your Logs',
        content:
            'Start by pasting your raw log text in this textarea. Supports Apache, Nginx, application logs, and more.',
        target: '#raw-log-input',
        position: 'top',
    },
    {
        id: 'examples',
        title: 'Try Examples',
        content:
            'Not sure what to format? Click here to try pre-loaded examples of different log formats.',
        target: '#examples-button',
        position: 'bottom',
    },
    {
        id: 'format',
        title: 'Format with AI',
        content:
            'Click this button to transform your unstructured logs into clean, structured JSON using AI.',
        target: '#format-button',
        position: 'top',
    },
    {
        id: 'output',
        title: 'View Results',
        content:
            'Your formatted logs will appear here with timestamps, levels, messages, and metadata extracted.',
        target: '#output-section',
        position: 'left',
    },
];

interface OnboardingTourProps {
    isOpen: boolean;
    onComplete: () => void;
    onSkip: () => void;
}

export function OnboardingTour({
    isOpen,
    onComplete,
    onSkip,
}: OnboardingTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [highlightedElement, setHighlightedElement] =
        useState<HTMLElement | null>(null);

    useEffect(() => {
        if (!isOpen) {
            if (highlightedElement) {
                highlightedElement.style.boxShadow = '';
                highlightedElement.style.zIndex = '';
            }
            return;
        }

        const step = tourSteps[currentStep];
        const element = document.querySelector(step.target) as HTMLElement;

        if (element) {
            // Remove previous highlight
            if (highlightedElement) {
                highlightedElement.style.boxShadow = '';
                highlightedElement.style.zIndex = '';
            }

            // Add highlight to current element
            element.style.boxShadow =
                '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.2)';
            element.style.zIndex = '50';
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedElement(element);
        }
    }, [isOpen, currentStep]);

    const handleNext = () => {
        if (currentStep < tourSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        onSkip();
    };

    if (!isOpen) return null;

    const step = tourSteps[currentStep];

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-40 bg-black/50"
                onClick={handleSkip}
            />

            {/* Tooltip */}
            <div className="fixed z-50 max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                {/* Close button */}
                <button
                    onClick={handleSkip}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Progress dots */}
                <div className="mb-4 flex gap-1">
                    {tourSteps.map((_, index) => (
                        <div
                            key={index}
                            className={`h-1 w-8 rounded-full transition-colors ${
                                index === currentStep
                                    ? 'bg-blue-500'
                                    : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                        />
                    ))}
                </div>

                {/* Content */}
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {step.title}
                </h3>
                <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
                    {step.content}
                </p>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        {currentStep > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrevious}
                            >
                                <ArrowLeft className="mr-1 h-4 w-4" />
                                Previous
                            </Button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={handleSkip}>
                            Skip tour
                        </Button>
                        <Button size="sm" onClick={handleNext}>
                            {currentStep === tourSteps.length - 1 ? (
                                <>
                                    <Check className="mr-1 h-4 w-4" />
                                    Get Started
                                </>
                            ) : (
                                <>
                                    Next
                                    <ArrowRight className="ml-1 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
