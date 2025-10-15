import { useEffect, useState } from 'react';

export function useFirstVisit() {
    const [isFirstVisit, setIsFirstVisit] = useState(false);
    const [hasSeenTour, setHasSeenTour] = useState(false);

    useEffect(() => {
        const hasVisited = localStorage.getItem('hasVisited');
        const hasSeenTourLocal = localStorage.getItem('hasSeenTour');

        if (!hasVisited) {
            setIsFirstVisit(true);
            localStorage.setItem('hasVisited', 'true');
        }

        if (hasSeenTourLocal) {
            setHasSeenTour(true);
        }
    }, []);

    const markAsVisited = () => {
        localStorage.setItem('hasVisited', 'true');
        setIsFirstVisit(false);
    };

    const markTourAsSeen = () => {
        localStorage.setItem('hasSeenTour', 'true');
        setHasSeenTour(true);
    };

    return {
        isFirstVisit,
        hasSeenTour,
        markAsVisited,
        markTourAsSeen,
    };
}
