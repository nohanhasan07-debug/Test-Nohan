import { Clock, X } from 'lucide-react';
import { formatDisplayDate } from '@/lib/date';
import type { Match } from '@/types';

interface MySubmissionsCardProps {
  matches: Match[];
  playerNames: Map<string, string>;
}

export default function MySubmissionsCard({ matches, playerNames }: MySubmissionsCardProps) {
  if (matches.length === 0) return null;

  const nameOf = (id: string) => playerNames.get(id) ?? 'Pemain terhapus';
  const teamNames = (ids: string[]) => ids.map(nameOf).join(' & ');

  return (
    <section className="rounded-2xl border-2 border-neon/50 bg-white/5 p-4 md:p-5">
      <p className="font-display text-base font-bold">Input Pertandingan Saya</p>
      <ul className="mt-3 flex flex-col gap-2">
        {matches.map((match) => {
          const rejected = match.status === 'rejected';
          return (
            <li
              key={match.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm"
            >
              <span className="min-w-0 truncate">
                {formatDisplayDate(match.date)} · {teamNames(match.teamA)} {match.gamesA}-{match.gamesB}{' '}
                {teamNames(match.teamB)}
              </span>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                  rejected ? 'bg-loss text-ink-950' : 'bg-paper/10 text-paper'
                }`}
              >
                {rejected ? <X className="h-3 w-3" aria-hidden="true" /> : <Clock className="h-3 w-3" aria-hidden="true" />}
                {rejected ? 'Ditolak' : 'Menunggu persetujuan'}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
