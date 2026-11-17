import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DESIGN_META } from '@/data/designs';
import { useDesign } from '@/hooks/use-design';
import { Link } from '@inertiajs/react';
import { Check, Palette } from 'lucide-react';
import { HTMLAttributes } from 'react';

export default function DesignDropdown({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { design, updateDesign } = useDesign();

    return (
        <div className={className} {...props}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-md"
                        aria-label="Switch design"
                    >
                        <Palette className="h-5 w-5 opacity-80" />
                        <span className="sr-only">Switch design</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuLabel className="text-xs tracking-wide text-muted-foreground uppercase">
                        Interface design
                    </DropdownMenuLabel>
                    {DESIGN_META.map((meta) => {
                        const Icon = meta.icon;
                        const selected = design === meta.id;

                        return (
                            <DropdownMenuItem
                                key={meta.id}
                                id={`design-dropdown-item-${meta.id}`}
                                onSelect={() => updateDesign(meta.id)}
                                className="flex cursor-pointer items-center justify-between gap-2"
                                aria-checked={selected}
                                role="menuitemradio"
                            >
                                <span className="flex items-center gap-2">
                                    <Icon className="size-4" aria-hidden />
                                    <span>{meta.name}</span>
                                </span>
                                {selected && (
                                    <Check className="size-4" aria-hidden />
                                )}
                            </DropdownMenuItem>
                        );
                    })}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link
                            href="/designs"
                            className="w-full cursor-pointer text-center text-xs text-muted-foreground"
                        >
                            Compare all in the gallery…
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
