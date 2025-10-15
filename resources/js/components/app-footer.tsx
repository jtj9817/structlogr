import { NewsletterSignup } from '@/components/newsletter-signup';
import { StatusIndicator } from '@/components/status-indicator';
import { Icon } from '@/components/icon';
import { cn } from '@/lib/utils';
import { usePage, Link } from '@inertiajs/react';
import {
    Github,
    Twitter,
    MessageSquare,
    ExternalLink,
    ArrowUpRight,
} from 'lucide-react';
import { type ComponentType } from 'react';
import {
    type ApiStatusState,
    type FooterSharedConfig,
    type SharedData,
} from '@/types';

type FooterLink = {
    label: string;
    href: string;
    external?: boolean;
};

const productLinks: FooterLink[] = [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'API Documentation', href: '/api/docs' },
    { label: 'Changelog', href: '/changelog' },
    { label: 'Roadmap', href: '/roadmap' },
];

const resourceLinks: FooterLink[] = [
    { label: 'Documentation', href: '/docs' },
    { label: 'Examples', href: '/#examples' },
    { label: 'Blog', href: '/blog' },
    { label: 'Tutorials', href: '/tutorials' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Support', href: '/support' },
];

const companyLinks: FooterLink[] = [
    { label: 'About Us', href: '/about' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Contact', href: '/contact' },
];

const socialLinks: (FooterLink & { icon: ComponentType<any> })[] = [
    {
        label: 'GitHub',
        href: 'https://github.com/structlogr/structlogr',
        external: true,
        icon: Github,
    },
    {
        label: 'Twitter',
        href: 'https://twitter.com/structlogr',
        external: true,
        icon: Twitter,
    },
    {
        label: 'Discord',
        href: 'https://discord.gg/structlogr',
        external: true,
        icon: MessageSquare,
    },
];

const renderLink = (link: FooterLink) => {
    if (link.external || link.href.startsWith('http')) {
        return (
            <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between text-sm text-muted-foreground transition hover:text-foreground"
            >
                <span>{link.label}</span>
                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
        );
    }

    return (
        <Link
            key={link.label}
            href={link.href}
            className="group flex items-center justify-between text-sm text-muted-foreground transition hover:text-foreground"
        >
            <span>{link.label}</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
    );
};

const normalizeStatus = (
    state?: ApiStatusState | string | null,
): ApiStatusState => {
    if (!state) return 'operational';
    if (state === 'operational' || state === 'degraded' || state === 'outage') {
        return state;
    }
    return 'unknown';
};

export function AppFooter({ className }: { className?: string }) {
    const page = usePage<SharedData>();
    const sharedConfig =
        (page.props.footer as FooterSharedConfig | undefined) ?? {};

    const version =
        sharedConfig.version ??
        import.meta.env.VITE_APP_VERSION ??
        'v1.0.0';

    const statusState = normalizeStatus(sharedConfig.status?.state);

    const statusMessage =
        sharedConfig.status?.message ?? 'All systems go';

    const statusHref = sharedConfig.status?.href ?? null;

    const subscribeUrl = sharedConfig.newsletter?.subscribeUrl ?? null;

    return (
        <footer
            className={cn(
                'border-t border-border/60 bg-gray-50 text-sm text-muted-foreground dark:border-gray-800 dark:bg-gray-900',
                className,
            )}
        >
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-12 sm:px-8 lg:px-10">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
                    <FooterColumn title="Product" links={productLinks} />
                    <FooterColumn title="Resources" links={resourceLinks} />
                    <FooterColumn title="Company" links={companyLinks} />
                    <div className="flex flex-col gap-5">
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">
                                Stay in the loop
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Subscribe for release notes and new parsing recipes.
                            </p>
                        </div>
                        <StatusIndicator
                            status={statusState}
                            message={statusMessage}
                            href={statusHref}
                        />
                        <div className="flex items-center gap-3">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:border-foreground/80 hover:text-foreground dark:border-gray-700 dark:hover:border-gray-500"
                                    aria-label={social.label}
                                >
                                    <Icon iconNode={social.icon} className="h-5 w-5" />
                                </a>
                            ))}
                        </div>
                        <NewsletterSignup subscribeUrl={subscribeUrl} />
                    </div>
                </div>

                <div className="flex flex-col gap-4 border-t border-border/50 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                        <span>© {new Date().getFullYear()} StructLogr. All rights reserved.</span>
                        <span className="hidden sm:inline" aria-hidden="true">
                            •
                        </span>
                        <span>Powered by Laravel • React • Prism</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">Version {version}</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function FooterColumn({
    title,
    links,
}: {
    title: string;
    links: FooterLink[];
}) {
    return (
        <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <div className="flex flex-col gap-2">{links.map(renderLink)}</div>
        </div>
    );
}

AppFooter.displayName = 'AppFooter';
