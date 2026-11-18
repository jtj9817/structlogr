import AuthSplitLayout from '@/layouts/auth/auth-split-layout';

export default function AuthLayout({
    children,
    title,
    description,
    ...props
}: {
    children: React.ReactNode;
    title: string;
    description: string;
}) {
    // The Phosphor design's split screen — the dark terminal panel
    // works as a shell poster.
    return (
        <AuthSplitLayout title={title} description={description} {...props}>
            {children}
        </AuthSplitLayout>
    );
}
