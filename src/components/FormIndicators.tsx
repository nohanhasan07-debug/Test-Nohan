import { Check, Flame, Minus, X, type LucideIcon } from 'lucide-react';
import { FORM_LENGTH, HOT_STREAK_MIN } from '@/lib/form';
import type { MatchOutcome } from '@/lib/matchSides';

const SLOT_STYLE: Record<MatchOutcome, { label: string; icon: LucideIcon; className: string }> = {
  win: { label: 'Menang', icon: Check, className: 'border-neon bg-neon text-ink-950' },
  draw: { label: 'Seri', icon: Minus, className: 'border-paper/50 bg-paper/10 text-paper' },
  loss: { label: 'Kalah', icon: X, className: 'border-loss bg-loss text-ink-950' },
};

interface FormDotsProps {
  recent: MatchOutcome[];
}

export function FormDots({ recent }: FormDotsProps) {
  const slots = Array.from({ length: FORM_LENGTH }, (_, index) => recent[index] ?? null);
  const summary = recent.map((outcome) => SLOT_STYLE[outcome].label).join(', ') || 'Belum ada';

  return (
    <div className="flex items-center gap-1.5" role="img" aria-label={`Form terakhir: ${summary}`}>
      {slots.map((outcome, index) => {
        if (!outcome) {
          return (
            <span
              key={`empty-${index}`}
              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-paper/30 text-xs font-semibold text-paper/50"
            >
              o
            </span>
          );
        }
        const { label, icon: Icon, className } = SLOT_STYLE[outcome];
        return (
          <span
            key={`${outcome}-${index}`}
            title={label}
            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${className}`}
          >
            <Icon className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
          </span>
        );
      })}
    </div>
  );
}

export function FormLegend() {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-paper/70">
      <span className="inline-flex items-center gap-1.5">
        <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
        Menang
      </span>
      <span className="inline-flex items-center gap-1.5">
        <X className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
        Kalah
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Minus className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
        Seri
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden="true">o</span>
        Belum ada pertandingan
      </span>
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
