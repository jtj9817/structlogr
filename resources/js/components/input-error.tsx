import { cn } from '@/lib/utils';
import { type HTMLAttributes } from 'react';

interface InputErrorProps extends HTMLAttributes<HTMLParagraphElement> {
    message?: string;
    id?: string;
    'data-testid'?: string;
}

export default function InputError({
    message,
    className = '',
    id,
    'data-testid': dataTestId,
    ...props
}: InputErrorProps) {
    return message ? (
        <p
            id={id}
            data-testid={dataTestId}
            role="alert"
            aria-live="polite"
            {...props}
            className={cn('text-sm text-red-600 dark:text-red-400', className)}
        >
            {message}
        </p>
    ) : null;
}
