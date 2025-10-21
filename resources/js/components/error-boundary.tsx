import { AlertTriangle, RotateCcw } from 'lucide-react';
import React from 'react';
import { Button } from './ui/button';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({
            error,
            errorInfo,
        });

        console.error('Error caught by boundary:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
                    <div className="w-full max-w-md space-y-6">
                        {/* Error Icon */}
                        <div className="flex justify-center">
                            <div className="rounded-full bg-destructive/10 p-3">
                                <AlertTriangle className="h-8 w-8 text-destructive" />
                            </div>
                        </div>

                        {/* Error Title */}
                        <div className="space-y-2 text-center">
                            <h1 className="text-2xl font-bold text-foreground">
                                Oops! Something went wrong
                            </h1>
                            <p className="text-muted-foreground">
                                We're sorry, but an unexpected error occurred.
                                Don't worry, we're here to help.
                            </p>
                        </div>

                        {/* Error Details (in development only) */}
                        {process.env.NODE_ENV === 'development' &&
                            this.state.error && (
                                <div className="max-h-48 space-y-2 overflow-auto rounded-lg bg-muted p-4">
                                    <p className="font-mono text-xs font-semibold text-muted-foreground">
                                        Error Details:
                                    </p>
                                    <p className="font-mono text-xs break-words whitespace-pre-wrap text-destructive">
                                        {this.state.error.toString()}
                                    </p>
                                    {this.state.errorInfo?.componentStack && (
                                        <>
                                            <p className="mt-2 font-mono text-xs font-semibold text-muted-foreground">
                                                Component Stack:
                                            </p>
                                            <p className="font-mono text-xs break-words whitespace-pre-wrap text-muted-foreground">
                                                {
                                                    this.state.errorInfo
                                                        .componentStack
                                                }
                                            </p>
                                        </>
                                    )}
                                </div>
                            )}

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={this.handleReset}
                                className="w-full"
                                variant="default"
                            >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Try Again
                            </Button>
                            <Button
                                onClick={this.handleReload}
                                variant="outline"
                                className="w-full"
                            >
                                Reload Page
                            </Button>
                        </div>

                        {/* Support Message */}
                        <div className="text-center text-sm text-muted-foreground">
                            <p>
                                If the problem persists, please{' '}
                                <a
                                    href="mailto:support@structlogr.com"
                                    className="text-primary hover:underline"
                                >
                                    contact our support team
                                </a>
                                .
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
