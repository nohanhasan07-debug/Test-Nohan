import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Trophy, Swords } from 'lucide-react';
import ClubLogo from '@/components/ClubLogo';
import { formatDailyDate } from '@/lib/date';
import { computeStats, sortDailyStandings } from '@/lib/stats';
import type { Match, Player } from '@/types';

interface DailyRecapProps {
  players: Player[];
  matches: Match[];
  date: string;
  dates: string[];
  onDateChange: (date: string) => void;
}

export default function DailyRecap({
  players,
  matches,
  date,
  dates,
  onDateChange,
}: DailyRecapProps) {
  // 1. Filter pertandingan yang HANYA berlangsung di tanggal terpilih
  const dailyMatches = useMemo(
    () => matches.filter((m) => m.date === date),
    [matches, date]
  );

  // 2. Hitung klasemen harian berdasarkan laga di hari tersebut
  const standings = useMemo(
    () => sortDailyStandings(computeStats(players, dailyMatches)),
    [players, dailyMatches]
  );

  // 3. Logika navigasi panah mundur / maju antar tanggal pertandingan
  const currentIndex = dates.indexOf(date);
  const hasPrev = currentIndex < dates.length - 1; // Tanggal lebih lama
  const hasNext = currentIndex > 0; // Tanggal lebih baru

  const handlePrevDate = () => {
    if (hasPrev) onDateChange(dates[currentIndex + 1]);
  };

  const handleNextDate = () => {
    if (hasNext) onDateChange(dates[currentIndex - 1]);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-b from-[#2D0D06] via-[#1E0904] to-[#0F0402] p-5 sm:p-7 shadow-2xl">
      {/* Pendar Ambient Glow */}
      <div className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 h-56 w-72 rounded-full bg-[#FF5500]/20 blur-[100px]" />

      {/* HEADER DAILY RECAP */}
      <div className="relative flex flex-col items-center text-center">
        <div className="mb-2 rounded-full border border-[#FF7A45]/40 p-1 bg-[#120402]/80 shadow-md">
          <ClubLogo className="h-12 w-12" />
        </div>
        <h2 style={{ color: '#FF7A45' }} className="font-serif text-xl sm:text-2xl font-black tracking-widest uppercase">
          DAILY RECAP
        </h2>
        <p style={{ color: 'rgba(253, 248, 245, 0.65)' }} className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.25em] font-semibold mt-0.5">
          Panic at the Court
        </p>
      </div>

      {/* SELECTOR TANGGAL KHUSUS HARI PERTANDINGAN (TANPA KALENDER PENUH) */}
      <div className="relative mt-6 mb-7 flex items-center justify-center gap-2 sm:gap-3">
        {/* Tombol Panah Mundur (Hari Pertandingan Sebelumnya) */}
        <button
          type="button"
          onClick={handlePrevDate}
          disabled={!hasPrev}
          title="Hari Pertandingan Sebelumnya"
          style={{
            borderColor: hasPrev ? 'rgba(255, 122, 69, 0.5)' : 'rgba(255, 255, 255, 0.1)',
            backgroundColor: hasPrev ? 'rgba(255, 122, 69, 0.15)' : 'transparent',
            color: hasPrev ? '#FFFFFF' : 'rgba(255, 255, 255, 0.2)',
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-all hover:bg-[#FF7A45]/30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Dropdown Hanya Tanggal yang Ada Gamenya */}
        <div className="relative min-w-[200px] sm:min-w-[260px]">
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#FF7A45]">
            <Calendar className="h-4 w-4" />
          </div>

          <select
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            style={{
              backgroundColor: '#120402',
              borderColor: '#FF7A45',
              color: '#FFFFFF',
            }}
            className="w-full appearance-none cursor-pointer rounded-2xl border-2 py-2.5 pl-10 pr-9 text-xs sm:text-sm font-bold tracking-wide outline-none text-center shadow-lg transition-all hover:border-[#FF7A45]/80"
          >
            {dates.length === 0 ? (
              <option value="">Belum Ada Pertandingan</option>
            ) : (
              dates.map((d) => (
                <option
                  key={d}
                  value={d}
                  style={{ backgroundColor: '#1A0603', color: '#FFFFFF' }}
                >
                  {formatDailyDate(d)}
                </option>
              ))
            )}
          </select>

          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-[#FF7A45]">
            ▾
          </span>
        </div>

        {/* Tombol Panah Maju (Hari Pertandingan Berikutnya) */}
        <button
          type="button"
          onClick={handleNextDate}
          disabled={!hasNext}
          title="Hari Pertandingan Berikutnya"
          style={{
            borderColor: hasNext ? 'rgba(255, 122, 69, 0.5)' : 'rgba(255, 255, 255, 0.1)',
            backgroundColor: hasNext ? 'rgba(255, 122, 69, 0.15)' : 'transparent',
            color: hasNext ? '#FFFFFF' : 'rgba(255, 255, 255, 0.2)',
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-all hover:bg-[#FF7A45]/30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* KLASEMEN HARIAN */}
      {standings.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border border-white/10 bg-white/5">
          <p style={{ color: 'rgba(253, 248, 245, 0.6)' }} className="text-xs">
            Tidak ada pertandingan di tanggal ini.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#120402]/60 backdrop-blur-md shadow-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-[#FF7A45]">
                  <th className="py-3 pl-4 pr-2">#</th>
                  <th className="py-3 px-3">Pemain</th>
                  <th className="py-3 px-2 text-center">MP</th>
                  <th className="py-3 px-2 text-center">W</th>
                  <th className="py-3 px-2 text-center">L</th>
                  <th className="py-3 px-2 text-center">GD</th>
                  <th className="py-3 pr-4 text-right">Poin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {standings.map((player, index) => {
                  const isFirst = index === 0;
                  return (
                    <tr
                      key={player.playerId}
                      className="transition-colors hover:bg-white/5"
                    >
                      <td className="py-3.5 pl-4 pr-2 font-serif font-bold text-sm text-[#FDF8F5]">
                        <span className="flex items-center gap-1">
                          {isFirst && <Trophy className="h-3.5 w-3.5 text-[#D4AF37]" />}
                          #{index + 1}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span style={{ color: '#FFFFFF' }} className="font-serif text-sm font-bold">
                          {player.name}
                        </span>
                      </td>

                      <td className="py-3.5 px-2 text-center font-mono font-medium text-white/80">
                        {player.mp}
                      </td>

                      <td className="py-3.5 px-2 text-center font-mono font-medium text-[#4ADE80]">
                        {player.w}
                      </td>

                      <td className="py-3.5 px-2 text-center font-mono font-medium text-[#F87171]">
                        {player.l}
                      </td>

                      <td className="py-3.5 px-2 text-center font-mono font-medium text-white/80">
                        {player.gd > 0 ? `+${player.gd}` : player.gd}
                      </td>

                      <td className="py-3.5 pr-4 text-right font-serif font-black text-base text-[#FF7A45]">
                        {player.pts}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* RINCIAN PERTANDINGAN HARI INI */}
          <div className="space-y-3 pt-2">
            <h3 style={{ color: '#FFFFFF' }} className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Swords className="h-4 w-4 text-[#FF7A45]" />
              <span>Laga Pertandingan ({dailyMatches.length})</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {dailyMatches.map((m) => {
                const teamANames = m.teamA
                  .map((id) => players.find((p) => p.id === id)?.name || id)
                  .join(' & ');
                const teamBNames = m.teamB
                  .map((id) => players.find((p) => p.id === id)?.name || id)
                  .join(' & ');

                const isWonA = m.gamesA > m.gamesB;
                const isWonB = m.gamesB > m.gamesA;

                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-[#140603] p-3 text-xs shadow-md"
                  >
                    {/* TIM A */}
                    <div className="flex-1 text-left min-w-0 pr-2">
                      <p
                        style={{ color: isWonA ? '#FF7A45' : '#FFFFFF' }}
                        className={`truncate font-serif text-xs ${isWonA ? 'font-black' : 'font-medium'}`}
                      >
                        {teamANames}
                      </p>
                    </div>

                    {/* SKOR GAME */}
                    <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-black/60 border border-white/10 font-mono font-bold text-xs shrink-0">
                      <span style={{ color: isWonA ? '#4ADE80' : '#FFFFFF' }}>{m.gamesA}</span>
                      <span className="text-white/40">-</span>
                      <span style={{ color: isWonB ? '#4ADE80' : '#FFFFFF' }}>{m.gamesB}</span>
                    </div>

                    {/* TIM B */}
                    <div className="flex-1 text-right min-w-0 pl-2">
                      <p
                        style={{ color: isWonB ? '#FF7A45' : '#FFFFFF' }}
                        className={`truncate font-serif text-xs ${isWonB ? 'font-black' : 'font-medium'}`}
                      >
                        {teamBNames}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
