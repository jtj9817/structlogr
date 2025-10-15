export function SuccessCheckmark() {
    return (
        <div className="h-16 w-16 text-green-500">
            <svg
                viewBox="0 0 52 52"
                className="h-full w-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <circle
                    cx="26"
                    cy="26"
                    r="25"
                    fill="currentColor"
                    fillOpacity="0.1"
                    stroke="currentColor"
                    strokeWidth="2"
                />
                <path
                    d="M 14 27 L 22 35 L 38 19"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                >
                    <animate
                        attributeName="stroke-dasharray"
                        values="0,100;100,0"
                        dur="0.6s"
                        fill="freeze"
                    />
                    <animate
                        attributeName="stroke-dashoffset"
                        values="100;0"
                        dur="0.6s"
                        fill="freeze"
                    />
                </path>
            </svg>
        </div>
    );
}
