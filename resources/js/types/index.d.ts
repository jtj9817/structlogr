import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export type OutputFormat = 'json' | 'table' | 'cards';
export type JsonIndentation = 2 | 4 | 'tab';
export type FontSize = 'small' | 'medium' | 'large';

export interface UserPreferences {
    outputFormat: OutputFormat;
    jsonIndentation: JsonIndentation;
    autoCopyResults: boolean;
    showLineNumbers: boolean;
    saveToHistory: boolean;
    anonymousAnalytics: boolean;
    avoidSensitiveStorage: boolean;
    fontSize: FontSize;
    reduceAnimations: boolean;
    customApiEndpoint: string;
    apiKey: string;
    timeoutSeconds: number;
}

export interface Auth {
    user: User | null;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    external?: boolean;
}

export type ApiStatusState = 'operational' | 'degraded' | 'outage' | 'unknown';

export interface FooterSharedConfig {
    version?: string;
    status?: {
        state?: ApiStatusState;
        message?: string;
        href?: string;
    };
    newsletter?: {
        subscribeUrl?: string;
    };
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    footer?: FooterSharedConfig;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    preferences: UserPreferences;
    [key: string]: unknown;
}
