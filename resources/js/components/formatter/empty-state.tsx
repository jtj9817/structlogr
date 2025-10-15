import { LucideIcon } from 'lucide-react';
import { EmptyLogIllustration } from '../illustrations/empty-log-illustration';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: LucideIcon;
}

export function EmptyState({
    title,
    description,
    icon: Icon,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            {Icon ? (
                <Icon className="mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
            ) : (
                <EmptyLogIllustration />
            )}
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                {title}
            </h3>
            <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
                {description}
            </p>
        </div>
    );
}
