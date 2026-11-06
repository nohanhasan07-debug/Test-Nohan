import { useMemo, useState } from 'react';
import { Swords, UserX } from 'lucide-react';
import OpponentBreakdown from '@/components/OpponentBreakdown';
import PerformanceSummary from '@/components/PerformanceSummary';
import { computePersonalSummary } from '@/lib/personalStats';
import type { Match, MatchFormat, Player } from '@/types';

interface PerformancePageProps {
  player: Player | null;
  players: Player[];
  matches: Match[];
}

const FORMAT_OPTIONS: { id: MatchFormat; label: string }[] = [
  { id: 'singles', label: 'Singles' },
  { id: 'doubles', label: 'Doubles' },
];

export default function PerformancePage({ player, players, matches }: PerformancePageProps) {
  const [format, setFormat] = useState<MatchFormat>('singles');

  const summary = useMemo(() => {
    if (!player) return null;
    const formatMatches = matches.filter((match) => match.format === format);
    return computePersonalSummary(player.id, formatMatches);
  }, [player, matches, format]);

  if (!player || !summary) {
    return (
      <div className="animate-fade-up flex flex-col items-center rounded-2xl border-2 border-dashed border-paper/30 bg-white/5 p-8 text-center">
        <UserX className="h-10 w-10 text-paper/70" aria-hidden="true" />
        <p className="mt-3 font-display text-lg font-bold">Akun Anda belum terhubung ke pemain</p>
        <p className="mt-1 max-w-sm text-sm text-paper/70">
          Akun Anda seharusnya otomatis terhubung saat dibuat. Hubungi master admin jika data Anda belum muncul.
        </p>
      </div>
    );
  }

  const nameOf = new Map(players.map((item) => [item.id, item.name]));

  return (
    <div className="animate-fade-up flex flex-col gap-8">
      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-paper/70">Performa Saya</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-paper md:text-3xl">{player.name}</h2>
          </div>
          <div
            role="tablist"
            aria-label="Kategori pertandingan"
            className="grid w-full grid-cols-2 gap-1 rounded-full border-2 border-paper/30 bg-white/5 p-1 sm:w-64"
          >
            {FORMAT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={format === option.id}
                onClick={() => setFormat(option.id)}
                className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                  format === option.id ? 'bg-paper text-ink-950 shadow' : 'text-paper/80 hover:bg-paper/10'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <PerformanceSummary summary={summary} />
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Swords className="h-5 w-5 text-paper/80" aria-hidden="true" />
          <h3 className="font-display text-lg font-bold">Rekor Melawan Pemain Lain</h3>
        </div>
        <OpponentBreakdown
          opponents={summary.opponents}
          nameOf={(id) => nameOf.get(id) ?? 'Pemain terhapus'}
        />
      </section>
    </div>
  );
}
