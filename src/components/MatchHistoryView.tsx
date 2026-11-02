import { Pencil, Trash2 } from 'lucide-react';
import { formatDisplayDate } from '@/lib/date';
import type { Match } from '@/types';

interface MatchHistoryViewProps {
  matches: Match[];
  playerNames: Map<string, string>;
  isMaster: boolean;
  onEdit: (match: Match) => void;
  onDelete: (match: Match) => void;
}

export default function MatchHistoryView({
  matches,
  playerNames,
  isMaster,
  onEdit,
  onDelete,
}: MatchHistoryViewProps) {
  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-maroon/30 bg-cream-dark p-8 text-center">
        <p className="font-display text-lg font-bold">Belum ada riwayat pertandingan</p>
        <p className="mt-1 text-sm text-maroon/80">Pertandingan yang tercatat akan muncul di sini.</p>
      </div>
    );
  }

  const sorted = [...matches].sort((a, b) => b.date.localeCompare(a.date));
  const nameOf = (id: string) => playerNames.get(id) ?? 'Pemain terhapus';
  const teamNames = (ids: string[]) => ids.map(nameOf).join(' & ');

  return (
    <ul className="flex flex-col gap-4">
      {sorted.map((match) => {
        const teamAWon = match.gamesA > match.gamesB;
        const teamBWon = match.gamesB > match.gamesA;
        const isDraw = !teamAWon && !teamBWon;
        return (
          <li
            key={match.id}
            className="rounded-2xl border-2 border-maroon/15 bg-white/70 p-4 shadow-sm transition hover:shadow-md md:p-5"
          >
            <div className="mb-3 flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wider text-maroon/80">
              <div className="flex items-center gap-2">
                <span>{formatDisplayDate(match.date)}</span>
                <span className="rounded-full bg-maroon px-2 py-0.5 text-[10px] text-cream">
                  {match.format === 'singles' ? 'Singles' : 'Doubles'}
                </span>
              </div>
              {isMaster && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(match)}
                    aria-label="Edit pertandingan"
                    className="rounded-full p-2 text-maroon transition hover:bg-maroon/10"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(match)}
                    aria-label="Hapus pertandingan"
                    className="rounded-full p-2 text-clay transition hover:bg-clay/10"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <p className={`text-left font-display text-base leading-snug md:text-lg ${teamAWon ? 'font-bold' : ''}`}>
                {teamNames(match.teamA)}
                {teamAWon && <span className="ml-2 inline-block rounded bg-gold px-1.5 text-[10px] font-semibold uppercase text-maroon-dark">Menang</span>}
              </p>
              <div className="rounded-xl bg-maroon px-4 py-2 font-display text-xl font-bold text-cream md:text-2xl">
                {match.gamesA} <span className="text-gold">-</span> {match.gamesB}
              </div>
              <p className={`text-right font-display text-base leading-snug md:text-lg ${teamBWon ? 'font-bold' : ''}`}>
                {teamBWon && <span className="mr-2 inline-block rounded bg-gold px-1.5 text-[10px] font-semibold uppercase text-maroon-dark">Menang</span>}
                {teamNames(match.teamB)}
              </p>
            </div>

            {isDraw && <p className="mt-3 text-center text-xs font-semibold uppercase tracking-wider text-olive">Seri</p>}
          </li>
        );
      })}
    </ul>
  );
}
