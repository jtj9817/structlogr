import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import { ErrorBoundary } from './components/error-boundary';
import { useCSRFHandler } from './hooks/use-csrf-handler';
import { initializeTheme } from './hooks/use-appearance';
import { initializeFontSize } from './hooks/use-font-size';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Configure CSRF token for all requests
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            // Set default header for axios (used by Inertia)
            axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;

            // Also set for fetch API if used
            const originalFetch = window.fetch;
            window.fetch = (url, options = {}) => {
                if (options.headers) {
                    options.headers['X-CSRF-TOKEN'] = csrfToken;
                } else {
                    options.headers = { 'X-CSRF-TOKEN': csrfToken };
                }
                return originalFetch(url, options);
            };
        }

        // Component with CSRF error handling
        function AppWithCSRFHandler(componentProps: any) {
            useCSRFHandler({
                enableAutoReload: true,
                reloadDelay: 1000,
                showNotifications: true,
                onTokenExpired: () => {
                    console.log('CSRF token expired - preparing recovery...');
                },
                onTokenRefreshed: () => {
                    console.log('Token recovery completed successfully');
                }
            });

            return <App {...componentProps} />;
        }

        root.render(
            <ErrorBoundary>
                <AppWithCSRFHandler {...props} />
            </ErrorBoundary>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();

// This will set font size on load...
initializeFontSize();
