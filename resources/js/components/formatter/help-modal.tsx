import { Button } from '@/components/ui/button';
import { faqData } from '@/data/faq';
import * as Accordion from '@radix-ui/react-accordion';
import * as Dialog from '@radix-ui/react-dialog';
import {
    AlertTriangle,
    Book,
    FileText,
    HelpCircle,
    MessageSquare,
    Shield,
    X,
} from 'lucide-react';

interface HelpModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function HelpModal({ open, onOpenChange }: HelpModalProps) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed top-[50%] left-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg dark:border-gray-800 dark:bg-gray-900">
                    <Dialog.Title className="flex items-center gap-2 text-lg leading-none font-semibold tracking-tight">
                        <HelpCircle className="h-5 w-5" />
                        Help & Documentation
                    </Dialog.Title>

                    <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400">
                        Everything you need to know about StructLogr
                    </Dialog.Description>

                    <div className="max-h-[60vh] overflow-y-auto">
                        <Accordion.Root type="multiple" className="space-y-4">
                            {/* Overview Section */}
                            <Accordion.Item
                                value="overview"
                                className="rounded-lg border dark:border-gray-700"
                            >
                                <Accordion.Header>
                                    <Accordion.Trigger className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <div className="flex items-center gap-2">
                                            <Book className="h-4 w-4" />
                                            <span className="font-medium">
                                                Overview
                                            </span>
                                        </div>
                                        <div className="h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 data-[state=open]:rotate-180">
                                            ▼
                                        </div>
                                    </Accordion.Trigger>
                                </Accordion.Header>
                                <Accordion.Content className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-300">
                                    <p className="mb-2">
                                        StructLogr is an AI-powered log
                                        formatting tool that transforms
                                        unstructured log text into clean,
                                        structured JSON format.
                                    </p>
                                    <p>
                                        Simply paste your raw logs, click
                                        "Format Log", and watch as our AI
                                        extracts timestamps, log levels,
                                        messages, and metadata automatically.
                                    </p>
                                </Accordion.Content>
                            </Accordion.Item>

                            {/* Supported Formats Section */}
                            <Accordion.Item
                                value="formats"
                                className="rounded-lg border dark:border-gray-700"
                            >
                                <Accordion.Header>
                                    <Accordion.Trigger className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            <span className="font-medium">
                                                Supported Formats
                                            </span>
                                        </div>
                                        <div className="h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 data-[state=open]:rotate-180">
                                            ▼
                                        </div>
                                    </Accordion.Trigger>
                                </Accordion.Header>
                                <Accordion.Content className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-300">
                                    <ul className="space-y-2">
                                        <li>
                                            •{' '}
                                            <strong>Apache Access Logs:</strong>{' '}
                                            Combined and common log formats
                                        </li>
                                        <li>
                                            • <strong>Nginx Logs:</strong>{' '}
                                            Access and error log formats
                                        </li>
                                        <li>
                                            • <strong>Application Logs:</strong>{' '}
                                            Laravel, Node.js, Python, Java
                                        </li>
                                        <li>
                                            • <strong>Syslog:</strong> Standard
                                            syslog format
                                        </li>
                                        <li>
                                            • <strong>JSON Logs:</strong>{' '}
                                            Structured JSON log entries
                                        </li>
                                        <li>
                                            • <strong>Container Logs:</strong>{' '}
                                            Docker and Kubernetes logs
                                        </li>
                                        <li>
                                            • <strong>Multi-line:</strong> Stack
                                            traces and exception logs
                                        </li>
                                    </ul>
                                </Accordion.Content>
                            </Accordion.Item>

                            {/* Field Explanations Section */}
                            <Accordion.Item
                                value="fields"
                                className="rounded-lg border dark:border-gray-700"
                            >
                                <Accordion.Header>
                                    <Accordion.Trigger className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4" />
                                            <span className="font-medium">
                                                Field Explanations
                                            </span>
                                        </div>
                                        <div className="h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 data-[state=open]:rotate-180">
                                            ▼
                                        </div>
                                    </Accordion.Trigger>
                                </Accordion.Header>
                                <Accordion.Content className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-300">
                                    <ul className="space-y-2">
                                        <li>
                                            • <strong>Timestamp:</strong> The
                                            date and time when the log was
                                            generated
                                        </li>
                                        <li>
                                            • <strong>Level:</strong> The
                                            severity level (ERROR, WARN, INFO,
                                            DEBUG)
                                        </li>
                                        <li>
                                            • <strong>Message:</strong> The main
                                            log message content
                                        </li>
                                        <li>
                                            • <strong>Source:</strong> The
                                            origin or service that generated the
                                            log
                                        </li>
                                        <li>
                                            • <strong>Metadata:</strong>{' '}
                                            Additional context and structured
                                            data
                                        </li>
                                    </ul>
                                </Accordion.Content>
                            </Accordion.Item>

                            {/* Troubleshooting Section */}
                            <Accordion.Item
                                value="troubleshooting"
                                className="rounded-lg border dark:border-gray-700"
                            >
                                <Accordion.Header>
                                    <Accordion.Trigger className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span className="font-medium">
                                                Troubleshooting
                                            </span>
                                        </div>
                                        <div className="h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 data-[state=open]:rotate-180">
                                            ▼
                                        </div>
                                    </Accordion.Trigger>
                                </Accordion.Header>
                                <Accordion.Content className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-300">
                                    <ul className="space-y-2">
                                        <li>
                                            • <strong>Poor Results:</strong>{' '}
                                            Ensure logs contain clear timestamps
                                            and consistent formatting
                                        </li>
                                        <li>
                                            • <strong>Large Logs:</strong> Split
                                            into smaller sections for better
                                            accuracy
                                        </li>
                                        <li>
                                            •{' '}
                                            <strong>Processing Errors:</strong>{' '}
                                            Check internet connection and try
                                            again
                                        </li>
                                        <li>
                                            • <strong>Missing Fields:</strong>{' '}
                                            Some log formats may not contain all
                                            possible fields
                                        </li>
                                    </ul>
                                </Accordion.Content>
                            </Accordion.Item>

                            {/* FAQ Section */}
                            <Accordion.Item
                                value="faq"
                                className="rounded-lg border dark:border-gray-700"
                            >
                                <Accordion.Header>
                                    <Accordion.Trigger className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <div className="flex items-center gap-2">
                                            <HelpCircle className="h-4 w-4" />
                                            <span className="font-medium">
                                                Frequently Asked Questions
                                            </span>
                                        </div>
                                        <div className="h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 data-[state=open]:rotate-180">
                                            ▼
                                        </div>
                                    </Accordion.Trigger>
                                </Accordion.Header>
                                <Accordion.Content className="space-y-4 px-4 pb-4">
                                    {faqData.map((faq, index) => (
                                        <div
                                            key={index}
                                            className="border-b border-gray-200 pb-4 last:border-b-0 dark:border-gray-700"
                                        >
                                            <h4 className="mb-2 font-medium text-gray-900 dark:text-gray-100">
                                                {faq.question}
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    ))}
                                </Accordion.Content>
                            </Accordion.Item>

                            {/* Privacy Section */}
                            <Accordion.Item
                                value="privacy"
                                className="rounded-lg border dark:border-gray-700"
                            >
                                <Accordion.Header>
                                    <Accordion.Trigger className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4" />
                                            <span className="font-medium">
                                                Privacy & Security
                                            </span>
                                        </div>
                                        <div className="h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 data-[state=open]:rotate-180">
                                            ▼
                                        </div>
                                    </Accordion.Trigger>
                                </Accordion.Header>
                                <Accordion.Content className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-300">
                                    <p className="mb-2">
                                        Your privacy is our top priority. Here's
                                        how we protect your data:
                                    </p>
                                    <ul className="space-y-1">
                                        <li>
                                            • Logs are processed temporarily and
                                            not permanently stored
                                        </li>
                                        <li>
                                            • No data is shared with third-party
                                            services
                                        </li>
                                        <li>
                                            • All processing happens on our
                                            secure infrastructure
                                        </li>
                                        <li>
                                            • Processed logs are immediately
                                            discarded after formatting
                                        </li>
                                        <li>
                                            • We recommend removing sensitive
                                            information before processing
                                        </li>
                                    </ul>
                                </Accordion.Content>
                            </Accordion.Item>
                        </Accordion.Root>
                    </div>

                    <Dialog.Close asChild>
                        <Button
                            className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                            variant="ghost"
                            size="icon"
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </Button>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
