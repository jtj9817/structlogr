import { useCallback, useEffect, useRef, useState } from 'react';

interface UseFormattingTimerResult {
    elapsedTime: number;
    isRunning: boolean;
    start: () => void;
    stop: () => number;
    reset: () => void;
}

export function useFormattingTimer(): UseFormattingTimerResult {
    const [elapsedTime, setElapsedTime] = useState<number>(0);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const startTimeRef = useRef<number | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const updateElapsedTime = useCallback(() => {
        if (startTimeRef.current === null) {
            return;
        }

        const now = performance.now();
        const elapsed = now - startTimeRef.current;
        setElapsedTime(elapsed);

        animationFrameRef.current = requestAnimationFrame(updateElapsedTime);
    }, []);

    const start = useCallback(() => {
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        startTimeRef.current = performance.now();
        setIsRunning(true);
        setElapsedTime(0);
        animationFrameRef.current = requestAnimationFrame(updateElapsedTime);
    }, [updateElapsedTime]);

    const stop = useCallback((): number => {
        setIsRunning(false);

        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        let finalElapsed = 0;

        if (startTimeRef.current !== null) {
            finalElapsed = performance.now() - startTimeRef.current;
            setElapsedTime(finalElapsed);
            startTimeRef.current = null;
        }

        return finalElapsed;
    }, []);

    const reset = useCallback(() => {
        stop();
        setElapsedTime(0);
    }, [stop]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && isRunning) {
                stop();
            }
        };

        const handleBeforeUnload = () => {
            if (isRunning) {
                stop();
            }
        };

        const handleOnline = () => {
            if (!navigator.onLine && isRunning) {
                stop();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('offline', handleOnline);

        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('offline', handleOnline);
        };
    }, [isRunning, stop]);

    return {
        elapsedTime,
        isRunning,
        start,
        stop,
        reset,
    };
}
