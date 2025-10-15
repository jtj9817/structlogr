import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useId, useState } from 'react';

interface NewsletterSignupProps {
    className?: string;
    subscribeUrl?: string | null;
}

type SubmissionState = 'idle' | 'sending' | 'success' | 'error';

export function NewsletterSignup({
    className,
    subscribeUrl,
}: NewsletterSignupProps) {
    const [email, setEmail] = useState('');
    const [consent, setConsent] = useState(false);
    const [status, setStatus] = useState<SubmissionState>('idle');
    const [message, setMessage] = useState<string | null>(null);
    const emailId = useId();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!consent) {
            setStatus('error');
            setMessage('Please confirm you would like to receive product updates.');
            return;
        }

        if (!email) {
            setStatus('error');
            setMessage('Email is required.');
            return;
        }

        setStatus('sending');
        setMessage(null);

        try {
            if (subscribeUrl) {
                const response = await fetch(subscribeUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({ email, consent }),
                });

                if (!response.ok) {
                    throw new Error('Unable to subscribe');
                }
            } else {
                await new Promise((resolve) => setTimeout(resolve, 500));
            }

            setStatus('success');
            setMessage('Thanks for subscribing! Check your inbox soon.');
            setEmail('');
            setConsent(false);
        } catch (error) {
            console.error(error);
            setStatus('error');
            setMessage('Subscription failed. Please try again later.');
        }
    };

    return (
        <form
            className={cn('flex flex-col gap-3', className)}
            onSubmit={handleSubmit}
        >
            <div className="flex flex-col gap-2">
                <Label htmlFor={emailId} className="text-sm font-medium">
                    Join our newsletter
                </Label>
                <p className="text-xs text-muted-foreground">
                    Keep up with new parsing features, API improvements, and workflow tips.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                        id={emailId}
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        aria-label="Email address"
                        required
                    />
                    <Button
                        type="submit"
                        className="w-full sm:w-auto"
                        disabled={status === 'sending'}
                    >
                        {status === 'sending' ? 'Subscribing…' : 'Subscribe'}
                    </Button>
                </div>
            </div>

            <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <Checkbox
                    checked={consent}
                    onCheckedChange={(checked) => setConsent(checked === true)}
                    aria-label="I agree to receive updates"
                />
                <span>
                    I agree to receive StructLogr product updates and marketing communications.
                </span>
            </label>

            {message ? (
                <p
                    className={cn(
                        'text-xs',
                        status === 'success'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400',
                    )}
                    role={status === 'error' ? 'alert' : undefined}
                >
                    {message}
                </p>
            ) : null}
        </form>
    );
}

NewsletterSignup.displayName = 'NewsletterSignup';
