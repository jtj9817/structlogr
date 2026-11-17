import AppLogoIcon from '@/components/app-logo-icon';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { home as formatterShow } from '@/routes';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-transparent p-6 md:p-10">
            <div className="flex w-full max-w-md flex-col gap-6">
                <Link
                    href={formatterShow()}
                    className="flex items-center gap-2 self-center font-medium"
                >
                    <div className="nebula-glow flex size-11 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500">
                        <AppLogoIcon className="size-6 fill-current text-white/90" />
                    </div>
                </Link>

                <div className="flex flex-col gap-6">
                    <Card className="nebula-glass rounded-2xl border-0 shadow-none">
                        <CardHeader className="px-10 pt-8 pb-0 text-center">
                            <CardTitle className="text-xl">{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </CardHeader>
                        <CardContent className="px-10 py-8">
                            {children}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
