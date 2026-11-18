import { cn } from '@/lib/utils';
import { type HTMLAttributes } from 'react';
import AppLogoIcon from './app-logo-icon';

interface AppLogoProps extends HTMLAttributes<HTMLDivElement> {
    /**
     * Controls whether the StructLogr wordmark is visible.
     * Useful for compact layouts.
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
            <span className="app-logo-badge flex size-9 items-center justify-center rounded-md">
                <AppLogoIcon className="size-5 fill-current" />
            </span>
            {showWordmark && (
                <span className="app-logo-wordmark truncate text-base leading-tight font-bold text-inherit">
                    StructLogr
                </span>
            )}
        </div>
    );
}
