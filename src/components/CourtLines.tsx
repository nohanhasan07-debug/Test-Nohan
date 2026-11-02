interface CourtLinesProps {
  className?: string;
}

export default function CourtLines({ className = '' }: CourtLinesProps) {
  return (
    <svg
      viewBox="0 0 400 240"
      preserveAspectRatio="xMidYMid slice"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      vectorEffect="non-scaling-stroke"
      aria-hidden="true"
    >
      <rect x="24" y="24" width="352" height="192" />
      <line x1="80" y1="24" x2="80" y2="216" />
      <line x1="320" y1="24" x2="320" y2="216" />
      <line x1="80" y1="72" x2="320" y2="72" />
      <line x1="80" y1="168" x2="320" y2="168" />
      <line x1="200" y1="72" x2="200" y2="168" />
    </svg>
  );
}
