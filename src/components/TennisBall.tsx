interface TennisBallProps {
  className?: string;
}

export default function TennisBall({ className = '' }: TennisBallProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path d="M4.6 5.4c3.1 2.5 3.1 11.7 0 14.2" stroke="#FBF6EE" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M19.4 5.4c-3.1 2.5-3.1 11.7 0 14.2" stroke="#FBF6EE" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
