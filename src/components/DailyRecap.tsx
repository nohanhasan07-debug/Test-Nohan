import { ChevronLeft, ChevronRight } from 'lucide-react';
import ClubLogo from '@/components/ClubLogo';
import type { Player, Match } from '@/types';
import { computeStats, sortDailyStandings } from '@/lib/stats';
import { formatDailyDate } from '@/lib/date';

interface DailyRecapProps {
  players: Player[];
  matches: Match[];
  date: string;
  dates: string[];
  onDateChange: (date: string) => void;
}

export default function DailyRecap({ players, matches, date, dates, onDateChange }: DailyRecapProps) {
  const dailyMatches = matches.filter((m) => m.date === date);
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
    <section className="relative mx-auto max-w-md overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-b from-[#2E0D05]/90 to-[#120402]/95 p-5 shadow-2xl backdrop-blur-xl">
      {/* Ornamen sudut crosshair '+' */}
      <span className="absolute top-2 left-3 font-mono text-[10px] text-white/30">+</span>
      <span className="absolute top-2 right-3 font-mono text-[10px] text-white/30">+</span>
      <span className="absolute bottom-2 left-3 font-mono text-[10px] text-white/30">+</span>
      <span className="absolute bottom-2 right-3 font-mono text-[10px] text-white/30">+</span>

      {/* Header Rekap */}
      <div className="flex flex-col items-center border-b border-white/10 pb-4 text-center">
        <ClubLogo className="mb-2 h-12 w-12 rounded-full border border-[#FF7A45]/40 p-1" />
        <p className="font-serif text-lg font-bold tracking-[0.25em] text-[#FF7A45] uppercase">
          Daily Recap
        </p>
        <p className="text-[10px] font-sans tracking-[0.3em] text-[#FDF8F5]/60 uppercase">
          Panic At The Court
        </p>
        <p className="mt-1 text-xs font-semibold text-[#FDF8F5]">
          {formatDailyDate(date)}
        </p>
      </div>

      {/* Date Picker Switcher */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 py-3">
        <button
          type="button"
          onClick={() => moveDate(1)}
          disabled={!canGoOlder}
          aria-label="Tanggal sebelumnya"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:bg-white/10 disabled:opacity-20"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <input
          type="date"
          aria-label="Pilih tanggal recap"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-center text-xs font-semibold text-[#FDF8F5] outline-none"
        />
        <button
          type="button"
          onClick={() => moveDate(-1)}
          disabled={!canGoNewer}
          aria-label="Tanggal berikutnya"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:bg-white/10 disabled:opacity-20"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Konten Tabel Rekap Harian */}
      {standings.length === 0 ? (
        <div className="py-10 text-center">
          <p className="font-serif text-sm font-bold text-[#FDF8F5]/80">Belum ada match di tanggal ini</p>
          <p className="mt-1 text-[11px] text-[#FDF8F5]/50">Pilih sesi lain untuk melihat hasil pertandingan.</p>
        </div>
      ) : (
        <div className="py-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[9px] uppercase tracking-wider text-[#FDF8F5]/40 font-sans">
                <th className="py-2 pl-2">#</th>
                <th className="py-2 px-2">Pemain</th>
                <th className="py-2 text-center">W / L</th>
                <th className="py-2 pr-2 text-right">Poin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {standings.map((entry, index) => (
                <tr key={entry.playerId} className="transition-colors hover:bg-white/[0.03]">
                  <td className="py-2.5 pl-2 font-serif text-xs text-[#FF7A45]">
                    #{index + 1}
                  </td>
                  <td className="py-2.5 px-2 font-serif font-bold text-[#FDF8F5]">
                    {entry.name}
                  </td>
                  <td className="py-2.5 text-center font-mono">
                    <span className="text-emerald-400 font-bold">{entry.w}</span>
                    <span className="px-1 text-white/30">/</span>
                    <span className="text-rose-400 font-bold">{entry.l}</span>
                  </td>
                  <td className="py-2.5 pr-2 text-right font-serif font-bold text-[#FF7A45]">
                    {entry.pts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Tag Instagram */}
      <div className="border-t border-white/10 pt-3 text-center">
        <p className="font-sans text-[10px] tracking-[0.25em] text-[#FF7A45] uppercase">
          @panicatthecourt
        </p>
      </div>
    </section>
  );
}
