export function EmptyLogIllustration() {
    return (
        <div className="relative h-32 w-32 text-gray-400 dark:text-gray-500">
            <svg
                viewBox="0 0 128 128"
                className="h-full w-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* File background */}
                <rect
                    x="24"
                    y="32"
                    width="80"
                    height="64"
                    rx="8"
                    fill="currentColor"
                    fillOpacity="0.1"
                    stroke="currentColor"
                    strokeWidth="2"
                />

                {/* File lines */}
                <rect
                    x="40"
                    y="48"
                    width="48"
                    height="2"
                    fill="currentColor"
                    fillOpacity="0.4"
                />
                <rect
                    x="40"
                    y="56"
                    width="32"
                    height="2"
                    fill="currentColor"
                    fillOpacity="0.4"
                />
                <rect
                    x="40"
                    y="64"
                    width="40"
                    height="2"
                    fill="currentColor"
                    fillOpacity="0.4"
                />
                <rect
                    x="40"
                    y="72"
                    width="24"
                    height="2"
                    fill="currentColor"
                    fillOpacity="0.4"
                />

                {/* Search icon overlay */}
                <circle
                    cx="80"
                    cy="80"
                    r="16"
                    fill="currentColor"
                    fillOpacity="0.2"
                />
                <circle
                    cx="80"
                    cy="80"
                    r="12"
                    fill="white"
                    stroke="currentColor"
                    strokeWidth="2"
                />
                <path
                    d="M 92 92 L 100 100"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </svg>
        </div>
    );
}
