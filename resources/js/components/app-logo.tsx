import { cn } from '@/lib/utils';
import { type HTMLAttributes } from 'react';
import AppLogoIcon from './app-logo-icon';

interface AppLogoProps extends HTMLAttributes<HTMLDivElement> {
    /**
     * Controls whether the StructLogr wordmark is visible.
     * Useful for compact layouts like the collapsed sidebar.
     */
    showWordmark?: boolean;
}

export default function AppLogo({
    className,
    showWordmark = true,
    ...props
}: AppLogoProps) {
    return (
        <div
            className={cn(
                'flex items-center gap-2 text-left text-sm font-semibold',
                className,
            )}
            {...props}
        >
            <span className="flex size-9 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-500 text-white shadow-sm dark:from-blue-500 dark:via-indigo-400 dark:to-purple-400">
                <AppLogoIcon className="size-5 fill-current text-white/90 dark:text-black" />
            </span>
            {showWordmark && (
                <span className="truncate text-base font-bold leading-tight text-neutral-900 dark:text-neutral-50">
                    StructLogr
                </span>
            )}
        </div>
    );
}
