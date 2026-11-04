import { ChevronLeft, ChevronRight } from 'lucide-react';
import ClubLogo from '@/components/ClubLogo';
import type { Player } from '@/types';
import { computeStats, sortDailyStandings } from '@/lib/stats';
import { formatDailyDate } from '@/lib/date';
import type { Match } from '@/types';

interface DailyRecapProps {
  players: Player[];
  matches: Match[];
  date: string;
  dates: string[];
  onDateChange: (date: string) => void;
}

export default function DailyRecap({ players, matches, date, dates, onDateChange }: DailyRecapProps) {
  const dailyMatches = matches.filter((match) => match.date === date);
  const standings = sortDailyStandings(computeStats(players, dailyMatches));
  const dateIndex = dates.indexOf(date);
  const canGoNewer = dateIndex > 0;
  const canGoOlder = dateIndex >= 0 && dateIndex < dates.length - 1;

  const moveDate = (direction: -1 | 1) => {
    if (dateIndex < 0) return;
    const nextDate = dates[dateIndex + direction];
    if (nextDate) onDateChange(nextDate);
  };

  return (
    <section className="mx-auto max-w-xl overflow-hidden rounded-[2rem] border-2 border-neon/40 bg-ink-900 shadow-2xl">
      <div className="relative overflow-hidden border-b border-neon/30 bg-neon/10 px-5 py-5 sm:px-7">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full border-[16px] border-neon/10" />
        <div className="relative flex items-center gap-3">
          <ClubLogo className="h-12 w-12 shrink-0 ring-2 ring-neon" />
          <div className="min-w-0">
            <p className="font-display text-xl font-bold tracking-[0.18em] text-neon-light">DAILY RECAP</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-paper/80">{formatDailyDate(date)}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => moveDate(1)}
          disabled={!canGoOlder}
          aria-label="Sesi sebelumnya"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 text-paper transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <input
          type="date"
          aria-label="Pilih tanggal recap"
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-white/20 bg-ink-950 px-3 py-2 text-center text-sm font-semibold text-paper focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon"
        />
        <button
          type="button"
          onClick={() => moveDate(-1)}
          disabled={!canGoNewer}
          aria-label="Sesi berikutnya"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 text-paper transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {standings.length === 0 ? (
        <div className="px-5 py-12 text-center sm:px-7">
          <p className="font-display text-lg font-bold">Belum ada sesi di tanggal ini</p>
          <p className="mt-1 text-sm text-paper/70">Pilih tanggal pertandingan lain untuk melihat recap.</p>
        </div>
      ) : (
        <div className="overflow-x-auto px-3 pb-5 pt-3 sm:px-5 sm:pb-7">
          <table className="w-full min-w-[360px] text-left text-sm">
            <thead className="text-[10px] uppercase tracking-[0.16em] text-paper/60">
              <tr>
                <th className="px-2 py-2 font-semibold">Posisi</th>
                <th className="px-2 py-2 font-semibold">Pemain</th>
                <th className="px-2 py-2 text-center font-semibold">Menang/Kalah</th>
                <th className="px-2 py-2 text-right font-semibold">Poin</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((entry, index) => (
                <tr
                  key={entry.playerId}
                  className={`border-t border-white/10 ${index === 0 ? 'bg-neon/10' : ''}`}
                >
                  <td className="px-2 py-3 font-display text-base font-bold text-neon-light">{index + 1}</td>
                  <td className="px-2 py-3 font-display font-bold">{entry.name}</td>
                  <td className="px-2 py-3 text-center font-semibold">
                    <span className="text-win">{entry.w}</span>
                    <span className="px-1 text-paper/40">/</span>
                    <span className="text-loss">{entry.l}</span>
                  </td>
                  <td className="px-2 py-3 text-right font-display text-lg font-bold text-neon">{entry.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
