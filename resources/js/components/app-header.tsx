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
    onShortcutsOpen?: () => void;
}

export function AppHeader({
    breadcrumbs = [],
    onHistoryOpen,
    onHelpOpen,
    onSettingsOpen,
    onShortcutsOpen,
}: AppHeaderProps) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const user = auth.user;
    const getInitials = useInitials();
    const isScrolled = useScrollShadow();

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
        <div id="desktop-guest-ctas" className="hidden min-w-[210px] flex-col items-stretch gap-1 md:flex">
            <div className="flex items-center gap-2">
                <Button id="desktop-login-button" variant="ghost" size="sm" asChild>
                    <Link href={login()}>Log in</Link>
                </Button>
                <Button
                    id="desktop-register-button"
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


    const desktopCreditsBadge = credits ? (
        <Link
            id="desktop-credits-badge"
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
        <div id="mobile-user-section" className="flex items-center gap-3">
            <Avatar id="mobile-user-avatar" className="size-10 rounded-lg">
                <AvatarImage id="mobile-user-avatar-image" src={user.avatar} alt={user.name} />
                <AvatarFallback id="mobile-user-avatar-fallback" className="rounded-lg bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-100">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                    {user.name}
                </span>
                <Link
                    id="mobile-manage-account-link"
                    href={profileSettingsRoute()}
                    className="text-xs text-muted-foreground hover:text-foreground"
                >
                    Manage account
                </Link>
            </div>
        </div>
    ) : null;

    const mobileCtaSection: ReactNode = user ? (
        <div id="mobile-cta-section" className="space-y-3">
            {showUpgrade && (
                <Button
                    id="mobile-upgrade-button"
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    asChild
                >
                    <Link href={upgradeHref}>Upgrade</Link>
                </Button>
            )}
            {credits && (
                <Link
                    id="mobile-credits-badge"
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
            <AppearanceToggleDropdown id="mobile-appearance-toggle-auth" className="flex justify-start rounded-md border border-border/80 px-3" />
        </div>
    ) : (
        <div id="mobile-guest-ctas" className="space-y-2">
            <Button id="mobile-login-button" variant="ghost" className="w-full justify-center" asChild>
                <Link href={login()}>Log in</Link>
            </Button>
            <Button
                id="mobile-register-button"
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                asChild
            >
                <Link href={register()}>Register</Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
                or continue without account
            </p>
            <AppearanceToggleDropdown id="mobile-appearance-toggle-guest" className="flex justify-start rounded-md border border-border/80 px-3" />
        </div>
    );

    return (
        <>
            <header
                id="app-header"
                className={cn(
                    'sticky top-0 z-50 border-b border-[#928477]/40 bg-[#C6BFBB]/95 backdrop-blur supports-[backdrop-filter]:bg-[#C6BFBB]/95 dark:border-[#285669]/40 dark:bg-[#061417]/95',
                    isScrolled && 'shadow-md',
                )}
            >
                <div id="app-header-container" className="mx-auto flex h-16 items-center gap-3 px-4 sm:px-6 md:max-w-7xl lg:px-8">
                    <div id="mobile-nav-wrapper" className="flex items-center gap-2 lg:hidden">
                        <MobileNavigation
                            mainLinks={primaryNavItems}
                            secondaryLinks={resourceNavItems}
                            userSection={mobileUserSection}
                            ctaSection={mobileCtaSection}
                        />
                    </div>

                    <Link
                        id="app-logo-link"
                        href={formatterHome()}
                        prefetch
                        className="flex items-center gap-2"
                    >
                        <AppLogo />
                    </Link>

                    <div id="header-actions" className="ml-auto flex items-center gap-2">
                        {desktopCreditsBadge}
                        <AppearanceToggleDropdown id="desktop-appearance-toggle" className="hidden sm:block" />
                        {onShortcutsOpen && (
                            <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            id="shortcuts-button"
                                            variant="ghost"
                                            size="icon"
                                            className="hidden h-9 w-9 md:inline-flex"
                                            onClick={onShortcutsOpen}
                                            aria-label="Open keyboard shortcuts"
                                        >
                                            <HelpCircle className="size-5 opacity-80" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Keyboard Shortcuts</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        {onHistoryOpen && (
                            <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            id="history-button"
                                            variant="ghost"
                                            size="icon"
                                            className="hidden h-9 w-9 md:inline-flex"
                                            onClick={onHistoryOpen}
                                            aria-label="Open history"
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
                                            id="help-button"
                                            variant="ghost"
                                            size="icon"
                                            className="hidden h-9 w-9 md:inline-flex"
                                            onClick={onHelpOpen}
                                            aria-label="Open help"
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
                                            id="settings-button"
                                            variant="ghost"
                                            size="icon"
                                            className="hidden h-9 w-9 md:inline-flex"
                                            onClick={onSettingsOpen}
                                            aria-label="Open settings"
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
                            id="search-button"
                            variant="ghost"
                            size="icon"
                            className="hidden h-9 w-9 md:inline-flex"
                            aria-label="Search"
                        >
                            <Search className="size-5 opacity-80" />
                        </Button>
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        id="user-menu-trigger"
                                        variant="ghost"
                                        className="flex h-10 items-center gap-2 rounded-full px-2 md:px-3"
                                        aria-label="User menu"
                                    >
                                        <Avatar id="desktop-user-avatar" className="size-9 rounded-full">
                                            <AvatarImage
                                                id="desktop-user-avatar-image"
                                                src={user.avatar}
                                                alt={user.name}
                                            />
                                            <AvatarFallback id="desktop-user-avatar-fallback" className="rounded-full bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-100">
                                                {getInitials(user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="hidden max-w-[120px] truncate text-sm font-medium md:inline-block">
                                            {user.name}
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    id="user-menu-content"
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
                <div id="breadcrumbs-wrapper" className="flex w-full border-b border-border/70">
                    <div id="breadcrumbs-container" className="mx-auto flex h-12 w-full items-center justify-start px-4 text-neutral-500 sm:px-6 md:max-w-7xl lg:px-8">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}
        </>
    );
}
