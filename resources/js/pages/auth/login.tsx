import AuthenticatedSessionController from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    // Generate unique IDs for form elements
    const emailInputId = 'auth-login-email-input';
    const emailTestId = 'test-auth-login-email';
    const emailErrorId = 'auth-login-email-error';

    const passwordInputId = 'auth-login-password-input';
    const passwordTestId = 'test-auth-login-password';
    const passwordErrorId = 'auth-login-password-error';

    const rememberInputId = 'auth-login-remember-input';
    const rememberTestId = 'test-auth-login-remember';

    return (
        <AuthLayout
            title="Log in to your account"
            description="Enter your email and password below to log in"
        >
            <Head title="Log in" />

            <Form
                {...AuthenticatedSessionController.store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label
                                    htmlFor={emailInputId}
                                    data-testid={emailTestId}
                                >
                                    Email address
                                </Label>
                                <Input
                                    id={emailInputId}
                                    data-testid={emailTestId}
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                    aria-describedby={
                                        errors.email ? emailErrorId : undefined
                                    }
                                />
                                <InputError
                                    message={errors.email}
                                    id={emailErrorId}
                                    data-testid={emailTestId}
                                />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label
                                        htmlFor={passwordInputId}
                                        data-testid={passwordTestId}
                                    >
                                        Password
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <Input
                                    id={passwordInputId}
                                    data-testid={passwordTestId}
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                    aria-describedby={
                                        errors.password
                                            ? passwordErrorId
                                            : undefined
                                    }
                                />
                                <InputError
                                    message={errors.password}
                                    id={passwordErrorId}
                                    data-testid={passwordTestId}
                                />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id={rememberInputId}
                                    data-testid={rememberTestId}
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label
                                    htmlFor={rememberInputId}
                                    data-testid={rememberTestId}
                                >
                                    Remember me
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                tabIndex={4}
                                disabled={processing}
                                data-testid="test-auth-login-submit"
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Don't have an account?{' '}
                            <TextLink href={register()} tabIndex={5}>
                                Sign up
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
