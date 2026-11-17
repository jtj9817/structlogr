import { useDesign } from '@/hooks/use-design';
import AuthCardLayout from '@/layouts/auth/auth-card-layout';
import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';
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
    const { design } = useDesign();

    // Design modes choose how the existing auth layouts are applied.
    // Classic keeps the original centered simple layout.
    if (design === 'phosphor') {
        // Split screen: the dark terminal panel works as a shell poster.
        return (
            <AuthSplitLayout title={title} description={description} {...props}>
                {children}
            </AuthSplitLayout>
        );
    }

    if (design === 'nebula') {
        // Frosted card floating over the aurora background.
        return (
            <AuthCardLayout title={title} description={description} {...props}>
                {children}
            </AuthCardLayout>
        );
    }

    // Classic and Lumen both use the centered column;
    // Lumen renders it as a typeset front page.
    return (
        <AuthLayoutTemplate title={title} description={description} {...props}>
            {children}
        </AuthLayoutTemplate>
    );
}
