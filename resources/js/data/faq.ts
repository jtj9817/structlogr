export interface FAQ {
    question: string;
    answer: string;
}

export const faqData: FAQ[] = [
    {
        question: 'What log formats are supported?',
        answer: 'StructLogr supports a wide variety of log formats including Apache access logs, Nginx error logs, application logs (Laravel, Node.js, Python), syslog format, JSON structured logs, Docker container logs, Kubernetes pod logs, and multi-line stack traces. The AI-powered parser can handle both structured and unstructured log formats.',
    },
    {
        question: 'How accurate is the parsing?',
        answer: 'Our AI-powered parsing achieves over 95% accuracy for common log formats. The system is trained on millions of log entries and can extract timestamps, log levels, messages, source information, and metadata with high precision. For best results, ensure your logs contain clear timestamps and consistent formatting.',
    },
    {
        question: 'Is my data stored or sent to third parties?',
        answer: 'Your privacy is our priority. Log data is processed temporarily for formatting and is not permanently stored on our servers. We do not send your data to any third-party services. All processing happens securely on our infrastructure, and processed logs are immediately discarded after the formatting is complete.',
    },
    {
        question: 'Can I format multiple logs at once?',
        answer: "Currently, StructLogr processes one log entry at a time to ensure maximum accuracy. However, you can format multiple logs sequentially by pasting them one after another. We're working on batch processing capabilities that will allow you to format multiple log entries simultaneously in a future update.",
    },
    {
        question: 'What AI model is used?',
        answer: "StructLogr uses the Prism AI model specifically trained for log parsing and structured data extraction. The model is optimized for understanding various log formats, identifying patterns, and extracting meaningful fields. It's continuously improved based on user feedback and new log format patterns.",
    },
    {
        question: 'Is there a limit to log size?',
        answer: 'For optimal performance, we recommend processing logs under 50,000 characters. Larger logs may take longer to process and could impact accuracy. If you have very large log files, consider splitting them into smaller sections or processing the most relevant portions first.',
    },
];
