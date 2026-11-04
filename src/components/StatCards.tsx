import { Crown, Flame, Users, type LucideIcon } from 'lucide-react';
import type { PlayerStats } from '@/types';

interface StatCardsProps {
  potm: PlayerStats | null;
  monthLabel: string;
  totalMatches: number;
  activePlayers: number;
  topStreak: { name: string; streak: number } | null;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-white/15 bg-white/5 p-5 shadow-sm transition hover:border-neon/40">
      {children}
    </div>
  );
}

function StatRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-paper/70">
        <Icon className="h-4 w-4 text-neon" aria-hidden="true" />
        {label}
      </span>
      <span className="font-display text-lg font-bold">{value}</span>
    </div>
  );
}

export default function StatCards({ potm, monthLabel, totalMatches, activePlayers, topStreak }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="relative overflow-hidden rounded-2xl border-2 border-neon/50 bg-gradient-to-br from-neon/15 to-ink-800 p-5 shadow-lg">
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full border-[12px] border-neon/10" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-neon text-ink-950 shadow-lg">
            <Crown className="h-7 w-7" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neon-light">Player of the Month</p>
            <p className="mt-0.5 truncate font-display text-xl font-bold leading-tight">{potm?.name ?? 'Belum ada'}</p>
            <p className="text-xs text-paper/70">
              {potm ? `${potm.winRate}% win rate · ${potm.mp} main` : monthLabel}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-paper/60">Quick Info Season</p>
        <div className="flex flex-col gap-2.5">
          <StatRow icon={Users} label="Total Match" value={totalMatches} />
          <StatRow icon={Crown} label="Pemain Aktif" value={activePlayers} />
          <StatRow
            icon={Flame}
            label="Top Streak"
            value={topStreak ? `${topStreak.name} (${topStreak.streak})` : '—'}
          />
        </div>
      </Card>
    </div>
  );
}
