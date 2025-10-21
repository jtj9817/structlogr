import RegisteredUserController from '@/actions/App/Http/Controllers/Auth/RegisteredUserController';
import { login } from '@/routes';
import { Form, Head } from '@inertiajs/react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';

export default function Register() {
    // Generate unique IDs for form elements
    const nameInputId = 'auth-register-name-input';
    const nameTestId = 'test-auth-register-name';

    const emailInputId = 'auth-register-email-input';
    const emailTestId = 'test-auth-register-email';

    const passwordInputId = 'auth-register-password-input';
    const passwordTestId = 'test-auth-register-password';

    const passwordConfirmationInputId =
        'auth-register-password-confirmation-input';
    const passwordConfirmationTestId =
        'test-auth-register-password-confirmation';

    return (
        <AuthLayout
            title="Create an account"
            description="Enter your details below to create your account"
        >
            <Head title="Register" />
            <Form
                {...RegisteredUserController.store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label
                                    htmlFor={nameInputId}
                                    data-testid={nameTestId}
                                >
                                    Name
                                </Label>
                                <Input
                                    id={nameInputId}
                                    data-testid={nameTestId}
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Full name"
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-2"
                                />
                            </div>

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
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor={passwordInputId}
                                    data-testid={passwordTestId}
                                >
                                    Password
                                </Label>
                                <Input
                                    id={passwordInputId}
                                    data-testid={passwordTestId}
                                    type="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor={passwordConfirmationInputId}
                                    data-testid={passwordConfirmationTestId}
                                >
                                    Confirm password
                                </Label>
                                <Input
                                    id={passwordConfirmationInputId}
                                    data-testid={passwordConfirmationTestId}
                                    type="password"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={5}
                                data-testid="test-auth-register-submit"
                            >
                                {processing && <Spinner />}
                                Create account
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink href={login()} tabIndex={6}>
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
