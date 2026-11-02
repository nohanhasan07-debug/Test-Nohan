import { Flame, Minus, Target, Trophy, X } from 'lucide-react';
import type { PersonalSummary } from '@/lib/personalStats';

interface PerformanceSummaryProps {
  summary: PersonalSummary;
}

export default function PerformanceSummary({ summary }: PerformanceSummaryProps) {
  const stats = [
    { label: 'Total Match', value: summary.total, icon: Target, tone: 'text-maroon' },
    { label: 'Menang', value: summary.wins, icon: Trophy, tone: 'text-olive' },
    { label: 'Kalah', value: summary.losses, icon: X, tone: 'text-clay' },
    { label: 'Seri', value: summary.draws, icon: Minus, tone: 'text-maroon/70' },
  ];

  return (
    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1.4fr_2fr]">
      <div className="relative overflow-hidden rounded-2xl bg-maroon p-6 text-cream shadow-lg">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold-light">
          <Flame className="h-4 w-4" aria-hidden="true" />
          Win Rate Pribadi
        </div>
        <p className="mt-3 font-display text-5xl font-bold leading-none md:text-6xl">
          {summary.winRate}
          <span className="text-2xl text-gold">%</span>
        </p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-cream/20" role="presentation">
          <div
            className="h-full rounded-full bg-gold transition-all duration-700"
            style={{ width: `${summary.winRate}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className="rounded-2xl border-2 border-maroon/15 bg-white/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-maroon/80">
              {label}
              <Icon className={`h-4 w-4 ${tone}`} aria-hidden="true" />
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-maroon-dark">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
