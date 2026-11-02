import { Flame } from 'lucide-react';
import { HOT_STREAK_MIN } from '@/lib/form';
import type { MatchOutcome } from '@/lib/matchSides';

const DOT_STYLE: Record<MatchOutcome, { label: string; className: string }> = {
  win: { label: 'Menang', className: 'bg-neon' },
  draw: { label: 'Seri', className: 'bg-[#F5C542]' },
  loss: { label: 'Kalah', className: 'bg-loss' },
};

interface FormDotsProps {
  recent: MatchOutcome[];
}

export function FormDots({ recent }: FormDotsProps) {
  if (recent.length === 0) {
    return <span className="text-xs text-paper/50">Belum ada</span>;
  }

  return (
    <div
      className="flex items-center gap-1.5"
      role="img"
      aria-label={`Form terakhir: ${recent.map((outcome) => DOT_STYLE[outcome].label).join(', ')}`}
    >
      {recent.map((outcome, index) => (
        <span
          key={`${outcome}-${index}`}
          title={DOT_STYLE[outcome].label}
          className={`h-2.5 w-2.5 rounded-full ${DOT_STYLE[outcome].className}`}
        />
      ))}
    </div>
  );
}

interface HotStreakBadgeProps {
  streak: number;
}

export function HotStreakBadge({ streak }: HotStreakBadgeProps) {
  if (streak < HOT_STREAK_MIN) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-neon px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-950">
      <Flame className="h-3 w-3" aria-hidden="true" />
      Hot Streak {streak}
    </span>
  );
}
