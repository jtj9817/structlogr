import { Head } from '@inertiajs/react';

import AppearanceTabs from '@/components/appearance-tabs';
import HeadingSmall from '@/components/heading-small';
import { type BreadcrumbItem } from '@/types';

import { DESIGN_META } from '@/data/designs';
import { useDesign } from '@/hooks/use-design';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { cn } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { Check } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Appearance settings',
        href: editAppearance().url,
    },
];

export default function Appearance() {
    const { design, updateDesign } = useDesign();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Appearance settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Appearance settings"
                        description="Update your account's appearance settings"
                    />
                    <AppearanceTabs />
                </div>

                <div className="space-y-6">
                    <HeadingSmall
                        title="Interface design"
                        description="Choose the visual identity of StructLogr — classic, or one of the three alternative designs"
                    />
                    <div
                        role="radiogroup"
                        aria-label="Interface design"
                        className="grid gap-3 sm:grid-cols-2"
                    >
                        {DESIGN_META.map((meta) => {
                            const Icon = meta.icon;
                            const selected = design === meta.id;

                            return (
                                <button
                                    key={meta.id}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    id={`design-option-${meta.id}`}
                                    onClick={() => updateDesign(meta.id)}
                                    className={cn(
                                        'group flex items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                                        'hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                        selected
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border',
                                    )}
                                >
                                    <span
                                        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-border/60"
                                        aria-hidden
                                    >
                                        <Icon className="size-4" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-center justify-between gap-2">
                                            <span className="font-semibold">
                                                {meta.name}
                                            </span>
                                            {selected && (
                                                <Check
                                                    className="size-4 text-primary"
                                                    aria-hidden
                                                />
                                            )}
                                        </span>
                                        <span className="mt-0.5 block text-xs text-muted-foreground">
                                            {meta.tagline}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
