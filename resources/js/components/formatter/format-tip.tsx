import { formatTips } from '@/data/format-tips';
import { useEffect, useState } from 'react';

export function FormatTip() {
    const [tip, setTip] = useState('');

    useEffect(() => {
        const randomTip =
            formatTips[Math.floor(Math.random() * formatTips.length)];
        setTip(randomTip);
    }, []);

    if (!tip) return null;

    return (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{tip}</p>
    );
}
