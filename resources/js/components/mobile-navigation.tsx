import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { ExternalLink, Menu } from 'lucide-react';
import { type ReactNode } from 'react';
import { Button } from './ui/button';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from './ui/sheet';
import AppLogo from './app-logo';
import { Icon } from './icon';

interface MobileNavigationProps {
    mainLinks: NavItem[];
    secondaryLinks?: NavItem[];
    userSection?: ReactNode;
    ctaSection?: ReactNode;
    footerSection?: ReactNode;
    triggerClassName?: string;
}

export function MobileNavigation({
    mainLinks,
    secondaryLinks = [],
    userSection,
    ctaSection,
    footerSection,
    triggerClassName,
}: MobileNavigationProps) {
    const cleanup = useMobileNavigation();

    const renderLink = (item: NavItem) => {
        const href =
            typeof item.href === 'string' ? item.href : item.href.url;
        const content = (
            <span className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-base font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
                {item.icon && <Icon iconNode={item.icon} className="size-5" />}
                <span className="flex-1 truncate">{item.title}</span>
                {item.external && (
                    <ExternalLink className="size-4 opacity-70" />
                )}
            </span>
        );

        if (item.external) {
            return (
                <SheetClose asChild key={item.title}>
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                        onClick={cleanup}
                    >
                        {content}
                    </a>
                </SheetClose>
            );
        }

        return (
            <SheetClose asChild key={item.title}>
                <Link
                    href={href}
                    prefetch
                    className="w-full"
                    onClick={cleanup}
                >
                    {content}
                </Link>
            </SheetClose>
        );
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn('h-10 w-10', triggerClassName)}
                >
                    <Menu className="size-5" />
                    <span className="sr-only">Open navigation menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent
                side="left"
                className="flex h-full w-72 flex-col gap-0 bg-background px-0"
            >
                <SheetHeader className="flex flex-row items-center justify-between border-b border-border/70 px-4 pb-4">
                    <SheetTitle className="sr-only">
                        Mobile navigation
                    </SheetTitle>
                    <AppLogo className="text-left" />
                </SheetHeader>
                <div className="flex flex-1 flex-col overflow-y-auto">
                    {userSection && (
                        <div className="border-b border-border/60 px-4 py-4">
                            {userSection}
                        </div>
                    )}
                    <nav className="space-y-1 px-4 py-4">
                        {mainLinks.map((item) => renderLink(item))}
                    </nav>
                    {secondaryLinks.length > 0 && (
                        <div className="mt-2 border-t border-border/60 px-4 py-4">
                            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                                Resources
                            </p>
                            <div className="space-y-1">
                                {secondaryLinks.map((item) => renderLink(item))}
                            </div>
                        </div>
                    )}
                </div>
                {(ctaSection || footerSection) && (
                    <div className="space-y-3 border-t border-border/70 px-4 py-4">
                        {ctaSection}
                        {footerSection}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
