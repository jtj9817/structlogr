<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="description" content="Transform raw logs into structured JSON with AI-powered parsing. Support for Apache, Nginx, Docker, Kubernetes, and more.">
        <meta name="keywords" content="log formatting, JSON, AI, parsing, structured logs, DevOps">
        <meta name="author" content="StructLogr">

        {{-- Open Graph Tags --}}
        <meta property="og:title" content="StructLogr - AI-Powered Log Formatting" />
        <meta property="og:description" content="Transform raw logs into structured JSON automatically using advanced AI parsing." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://structlogr.com" />
        <meta property="og:image" content="https://structlogr.com/og-image.jpg" />
        <meta property="og:image:alt" content="StructLogr - Log formatting made easy" />

        {{-- Twitter Card Tags --}}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="StructLogr - AI-Powered Log Formatting" />
        <meta name="twitter:description" content="Transform raw logs into structured JSON with advanced AI parsing." />
        <meta name="twitter:image" content="https://structlogr.com/twitter-card.jpg" />

        {{-- Additional Meta Tags --}}
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- CSRF Token for JavaScript access --}}
        <script>
            window.csrfToken = '{{ csrf_token() }}';
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
