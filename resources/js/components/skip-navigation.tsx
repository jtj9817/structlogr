import { forwardRef } from 'react';

const SkipNavigation = forwardRef<HTMLAnchorElement>((props, ref) => (
    <a
        ref={ref}
        href="#main-content"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
        {...props}
    >
        Skip to main content
    </a>
));

SkipNavigation.displayName = 'SkipNavigation';

export default SkipNavigation;
