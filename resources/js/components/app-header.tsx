import AppLogo from '@/components/app-logo';
import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { MobileNavigation } from '@/components/mobile-navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { useScrollShadow } from '@/hooks/use-scroll-shadow';
import { cn } from '@/lib/utils';
import { login, register } from '@/routes';
import { show as formatterHome } from '@/routes/formatter';
import { edit as profileSettingsRoute } from '@/routes/profile';
import { type BreadcrumbItem, type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Github,
    HelpCircle,
    History as HistoryIcon,
    Home,
    Info,
    Search,
    Server,
    Settings,
    Sparkles,
} from 'lucide-react';
import { type ReactNode, useMemo } from 'react';

const primaryNavItems: NavItem[] = [
    {
        title: 'Home',
        href: formatterHome(),
        icon: Home,
    },
    {
        title: 'Examples',
        href: '/#examples',
        icon: Sparkles,
    },
    {
        title: 'Documentation',
        href: '/docs',
        icon: BookOpen,
    },
    {
        title: 'API',
        href: '/api/docs',
        icon: Server,
    },
    {
        title: 'About',
        href: '/about',
        icon: Info,
    },
];

const resourceNavItems: NavItem[] = [
    {
        title: 'GitHub',
        href: 'https://github.com/structlogr/structlogr',
        icon: Github,
        external: true,
    },
    {
        title: 'Docs Portal',
        href: 'https://docs.structlogr.com',
        icon: BookOpen,
        external: true,
    },
];

interface AppHeaderProps {
    breadcrumbs?: BreadcrumbItem[];
    onHistoryOpen?: () => void;
    onHelpOpen?: () => void;
    onSettingsOpen?: () => void;
}

export function AppHeader({
    breadcrumbs = [],
    onHistoryOpen,
    onHelpOpen,
    onSettingsOpen,
}: AppHeaderProps) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const user = auth.user;
    const getInitials = useInitials();
    const isScrolled = useScrollShadow();

    const currentPath = useMemo(() => {
        const [path] = page.url.split('?');
        return path;
    }, [page.url]);

    const isItemActive = (item: NavItem) => {
        const href = typeof item.href === 'string' ? item.href : item.href.url;
        if (href.startsWith('http')) {
            return false;
        }
        if (href.startsWith('/#')) {
            return currentPath === '/' && page.url.includes(href.split('#')[1]);
        }
        const normalizedHref = href.replace(/#.*$/, '');
        return currentPath === normalizedHref;
    };

    const resolveLinkHref = (item: NavItem) =>
        typeof item.href === 'string' ? item.href : item.href.url;

    const stringUserProp = (prop: string) => {
        if (!user) return null;
        const value = (user as Record<string, unknown>)[prop];
        return typeof value === 'string' ? value : null;
    };

    const booleanUserProp = (prop: string) => {
        if (!user) return null;
        const value = (user as Record<string, unknown>)[prop];
        return typeof value === 'boolean' ? value : null;
    };

    const credits = useMemo(() => {
        if (!user) return null;

        const numericUserProp = (prop: string) => {
            const value = (user as Record<string, unknown>)[prop];
            return typeof value === 'number' ? value : null;
        };

        const current =
            numericUserProp('credits') ??
            numericUserProp('remaining_credits') ??
            numericUserProp('credit_balance') ??
            numericUserProp('available_credits');

        const limit =
            numericUserProp('credit_limit') ??
            numericUserProp('monthly_credits') ??
            numericUserProp('total_credits');

        if (current === null && limit === null) {
            return null;
        }

        return {
            current,
            limit,
            isLow: current !== null && current < 100,
        };
    }, [user]);

    const planName =
        stringUserProp('plan') ??
        stringUserProp('subscription') ??
        stringUserProp('subscription_tier');

    const isProUser =
        booleanUserProp('is_pro') ??
        booleanUserProp('isPro') ??
        (planName
            ? ['pro', 'team', 'enterprise'].includes(planName.toLowerCase())
            : false) ??
        false;

    const showUpgrade = Boolean(user) && !isProUser;

    const upgradeHref = '/pricing';

    const desktopGuestCtas = (
        <div className="hidden min-w-[210px] flex-col items-stretch gap-1 md:flex">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={login()}>Log in</Link>
                </Button>
                <Button
                    size="sm"
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    asChild
                >
                    <Link href={register()}>Register</Link>
                </Button>
            </div>
            <span className="text-center text-xs text-muted-foreground">
                or continue without account
            </span>
        </div>
    );

    const desktopUpgradeButton = showUpgrade ? (
        <Button
            size="sm"
            asChild
            className="hidden bg-blue-600 text-white hover:bg-blue-700 md:inline-flex"
        >
            <Link href={upgradeHref}>Upgrade</Link>
        </Button>
    ) : null;

    const desktopCreditsBadge = credits ? (
        <Link
            href={profileSettingsRoute()}
            className={cn(
                'hidden items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors md:inline-flex',
                credits.isLow
                    ? 'border-amber-500/80 text-amber-600 dark:text-amber-400'
                    : 'border-border/70 text-muted-foreground hover:border-border hover:text-foreground',
            )}
        >
            <span>Credits</span>
            <span>
                {credits.current ?? '—'}
                {credits.limit !== null ? ` / ${credits.limit}` : ''}
            </span>
        </Link>
    ) : null;

    const mobileUserSection = user ? (
        <div className="flex items-center gap-3">
            <Avatar className="size-10 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-100">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                    {user.name}
                </span>
                <Link
                    href={profileSettingsRoute()}
                    className="text-xs text-muted-foreground hover:text-foreground"
                >
                    Manage account
                </Link>
            </div>
        </div>
    ) : null;

    const mobileCtaSection: ReactNode = user ? (
        <div className="space-y-3">
            {showUpgrade && (
                <Button
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    asChild
                >
                    <Link href={upgradeHref}>Upgrade</Link>
                </Button>
            )}
            {credits && (
                <Link
                    href={profileSettingsRoute()}
                    className={cn(
                        'flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                        credits.isLow
                            ? 'border-amber-500/80 text-amber-600 dark:text-amber-400'
                            : 'border-border/70 text-muted-foreground hover:border-border hover:text-foreground',
                    )}
                >
                    <span>Credits</span>
                    <span>
                        {credits.current ?? '—'}
                        {credits.limit !== null ? ` / ${credits.limit}` : ''}
                    </span>
                </Link>
            )}
            <AppearanceToggleDropdown className="flex justify-start rounded-md border border-border/80 px-3" />
        </div>
    ) : (
        <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-center" asChild>
                <Link href={login()}>Log in</Link>
            </Button>
            <Button
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                asChild
            >
                <Link href={register()}>Register</Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
                or continue without account
            </p>
            <AppearanceToggleDropdown className="flex justify-start rounded-md border border-border/80 px-3" />
        </div>
    );

    return (
        <>
            <header
                className={cn(
                    'sticky top-0 z-50 border-b border-border/80 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-neutral-950/80',
                    isScrolled && 'shadow-md',
                )}
            >
                <div className="mx-auto flex h-16 items-center gap-3 px-4 sm:px-6 md:max-w-7xl lg:px-8">
                    <div className="flex items-center gap-2 lg:hidden">
                        <MobileNavigation
                            mainLinks={primaryNavItems}
                            secondaryLinks={resourceNavItems}
                            userSection={mobileUserSection}
                            ctaSection={mobileCtaSection}
                        />
                    </div>

                    <Link
                        href={formatterHome()}
                        prefetch
                        className="flex items-center gap-2"
                    >
                        <AppLogo />
                    </Link>

                    <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
                        {primaryNavItems.map((item) => {
                            const href = resolveLinkHref(item);
                            const active = isItemActive(item);
                            return item.external ? (
                                <a
                                    key={item.title}
                                    href={href}
                                    className={cn(
                                        'inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground',
                                    )}
                                >
                                    {item.title}
                                </a>
                            ) : (
                                <Link
                                    key={item.title}
                                    href={href}
                                    prefetch
                                    className={cn(
                                        'inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition',
                                        active
                                            ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                                            : 'text-muted-foreground hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800/60',
                                    )}
                                >
                                    {item.title}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="ml-auto flex items-center gap-2">
                        {desktopCreditsBadge}
                        {desktopUpgradeButton}
                        <AppearanceToggleDropdown className="hidden sm:block" />
                        {onHistoryOpen && (
                            <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="hidden h-9 w-9 md:inline-flex"
                                            onClick={onHistoryOpen}
                                        >
                                            <HistoryIcon className="size-5 opacity-80" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>History</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        {onHelpOpen && (
                            <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="hidden h-9 w-9 md:inline-flex"
                                            onClick={onHelpOpen}
                                        >
                                            <HelpCircle className="size-5 opacity-80" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Help</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        {onSettingsOpen && (
                            <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="hidden h-9 w-9 md:inline-flex"
                                            onClick={onSettingsOpen}
                                        >
                                            <Settings className="size-5 opacity-80" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Settings</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hidden h-9 w-9 md:inline-flex"
                        >
                            <Search className="size-5 opacity-80" />
                        </Button>
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="flex size-10 items-center justify-center rounded-full p-1"
                                    >
                                        <Avatar className="size-9 rounded-full">
                                            <AvatarImage
                                                src={user.avatar}
                                                alt={user.name}
                                            />
                                            <AvatarFallback className="rounded-full bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-100">
                                                {getInitials(user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-64"
                                    align="end"
                                >
                                    <UserMenuContent user={user} />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            desktopGuestCtas
                        )}
                    </div>
                </div>
            </header>
            {breadcrumbs.length > 1 && (
                <div className="flex w-full border-b border-border/70">
                    <div className="mx-auto flex h-12 w-full items-center justify-start px-4 text-neutral-500 sm:px-6 md:max-w-7xl lg:px-8">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}
        </>
    );
}
