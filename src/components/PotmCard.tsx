import { Crown } from 'lucide-react';
import CourtLines from '@/components/CourtLines';
import { POTM_MIN_MATCHES } from '@/lib/constants';
import { formatMonthLabel } from '@/lib/date';
import type { PlayerStats } from '@/types';

interface PotmCardProps {
  player: PlayerStats | null;
  monthKey: string;
}

export default function PotmCard({ player, monthKey }: PotmCardProps) {
  const monthLabel = formatMonthLabel(monthKey);

  if (!player) {
    return (
      <section className="animate-fade-up rounded-2xl border-2 border-dashed border-paper/30 bg-white/5 p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-paper/70">
          Player of the Month · {monthLabel}
        </p>
        <p className="mt-2 font-display text-lg font-bold text-paper">Belum ada pemenang bulan ini</p>
        <p className="mt-1 text-sm text-paper/70">
          Pemain perlu minimal {POTM_MIN_MATCHES} pertandingan di bulan ini untuk masuk penilaian.
        </p>
      </section>
    );
  }

  return (
      <section className="animate-fade-up relative overflow-hidden rounded-2xl border-2 border-neon/60 bg-ink-800 p-6 text-paper shadow-lg md:p-8">
      <CourtLines className="text-paper/10" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-neon text-ink-950">
            <Crown className="h-8 w-8" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neon">
              Player of the Month · {monthLabel}
            </p>
            <p className="font-display text-3xl font-bold leading-tight md:text-4xl">{player.name}</p>
          </div>
        </div>
        <div className="flex items-end gap-6 sm:text-right">
          <div>
            <p className="font-display text-4xl font-bold leading-none md:text-5xl">{player.winRate}%</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-paper/70">Win Rate</p>
          </div>
          <div className="pb-1 text-sm text-paper/80">
            <p className="font-semibold">
              {player.w} menang · {player.d} seri · {player.l} kalah
            </p>
            <p>{player.mp} pertandingan</p>
          </div>
        </div>
      </div>
    </section>
  );
}
