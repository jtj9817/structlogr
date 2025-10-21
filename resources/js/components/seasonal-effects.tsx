import { useEffect, useState } from 'react';

interface SeasonalEffectsProps {
    enabled?: boolean;
}

export const SeasonalEffects = ({ enabled = true }: SeasonalEffectsProps) => {
    const [effect, setEffect] = useState<
        'snow' | 'fireworks' | 'hearts' | null
    >(null);

    useEffect(() => {
        if (!enabled) return;

        const today = new Date();
        const month = today.getMonth();
        const date = today.getDate();

        // December: Snow
        if (month === 11) {
            setEffect('snow');
        }
        // January 1st: Fireworks
        else if (month === 0 && date === 1) {
            setEffect('fireworks');
        }
        // February: Hearts
        else if (month === 1) {
            setEffect('hearts');
        }
    }, [enabled]);

    if (!effect) return null;

    if (effect === 'snow') {
        return <SnowEffect />;
    }

    if (effect === 'fireworks') {
        return <FireworksEffect />;
    }

    if (effect === 'hearts') {
        return <HeartsEffect />;
    }

    return null;
};

const SnowEffect = () => {
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <style>{`
        @keyframes snowfall {
          to {
            transform: translateY(100vh);
            opacity: 0;
          }
        }

        .snowflake {
          position: fixed;
          top: -10px;
          color: #fff;
          font-size: 1.5em;
          animation: snowfall linear infinite;
          z-index: 10;
        }
      `}</style>
            {Array.from({ length: 30 }).map((_, i) => (
                <div
                    key={i}
                    className="snowflake"
                    style={{
                        left: `${Math.random() * 100}%`,
                        animationDuration: `${Math.random() * 5 + 5}s`,
                        animationDelay: `${Math.random() * 2}s`,
                        opacity: Math.random() * 0.5 + 0.3,
                    }}
                >
                    ❄
                </div>
            ))}
        </div>
    );
};

const FireworksEffect = () => {
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <style>{`
        @keyframes explode {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(0);
            opacity: 0;
          }
        }

        .firework {
          position: fixed;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          animation: explode 1s ease-out forwards;
          z-index: 10;
        }
      `}</style>
            {Array.from({ length: 50 }).map((_, i) => {
                const angle = (i / 50) * Math.PI * 2;
                const distance = 150;
                const tx = Math.cos(angle) * distance;
                const ty = Math.sin(angle) * distance;
                const colors = [
                    '#ff0000',
                    '#00ff00',
                    '#0000ff',
                    '#ffff00',
                    '#ff00ff',
                    '#00ffff',
                ];
                const color = colors[i % colors.length];

                return (
                    <div
                        key={i}
                        className="firework"
                        style={
                            {
                                left: '50%',
                                top: '50%',
                                backgroundColor: color,
                                '--tx': `${tx}px`,
                                '--ty': `${ty}px`,
                            } as React.CSSProperties
                        }
                    />
                );
            })}
        </div>
    );
};

const HeartsEffect = () => {
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <style>{`
        @keyframes heartFloat {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }

        .heart {
          position: fixed;
          font-size: 1.5em;
          animation: heartFloat linear infinite;
          z-index: 10;
        }
      `}</style>
            {Array.from({ length: 20 }).map((_, i) => (
                <div
                    key={i}
                    className="heart"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: '100vh',
                        animationDuration: `${Math.random() * 3 + 4}s`,
                        animationDelay: `${Math.random() * 2}s`,
                        opacity: Math.random() * 0.5 + 0.3,
                    }}
                >
                    ❤️
                </div>
            ))}
        </div>
    );
};
