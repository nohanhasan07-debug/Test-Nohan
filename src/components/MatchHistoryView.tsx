import { useMemo, useState } from 'react';
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
  // State filter tanggal (default: 'all')
  const [selectedDate, setSelectedDate] = useState<string>('all');

  // 1. Ekstrak hanya tanggal-tanggal unik yang memiliki data pertandingan
  const uniqueDates = useMemo(() => {
    return [...new Set(matches.map((m) => m.date))].sort((a, b) => b.localeCompare(a));
  }, [matches]);

  // 2. Filter data pertandingan berdasarkan pilihan tanggal
  const filteredMatches = useMemo(() => {
    if (selectedDate === 'all') return matches;
    return matches.filter((m) => m.date === selectedDate);
  }, [matches, selectedDate]);

  // Urutkan pertandingan dari yang paling baru
  const sorted = useMemo(() => {
    return [...filteredMatches].sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredMatches]);

  const nameOf = (id: string) => playerNames.get(id) ?? 'Pemain terhapus';
  const teamNames = (ids: string[]) => ids.map(nameOf).join(' & ');

  // Tampilan jika database masih kosong
  if (matches.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#1A0A06]/50 p-8 text-center backdrop-blur-md">
        <p className="font-serif text-lg font-bold text-[#FDF8F5]">Belum ada riwayat pertandingan</p>
        <p className="mt-1 text-xs text-[#FDF8F5]/60 font-sans">
          Pertandingan yang dicatat akan muncul di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ======================================================== */}
      {/* HEADER & FILTER TANGGAL (DROPDOWN TANGGAL AKTIF) */}
      {/* ======================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 mb-5">
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-base sm:text-lg font-bold tracking-widest text-[#FDF8F5] uppercase">
            Riwayat Match
          </h2>
          <span className="rounded-full border border-[#FF7A45]/40 bg-[#FF7A45]/15 px-2 py-0.5 text-[10px] font-bold text-[#FF7A45]">
            {sorted.length} {sorted.length === 1 ? 'Match' : 'Matches'}
          </span>
        </div>

        {/* Dropdown Pemilih Tanggal */}
        <div className="flex items-center gap-2">
          <label htmlFor="match-date-filter" className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#FDF8F5]/70 hidden sm:inline">
            Tanggal:
          </label>
          <select
            id="match-date-filter"
            aria-label="Filter berdasarkan tanggal pertandingan"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              colorScheme: 'dark',
              color: '#FDF8F5',
              backgroundColor: '#120402',
              borderColor: 'rgba(255, 122, 69, 0.45)',
            }}
            className="cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold outline-none transition hover:border-[#FF7A45]"
          >
            <option value="all" style={{ backgroundColor: '#1F0703', color: '#FFFFFF' }}>
              Semua Tanggal
            </option>
            {uniqueDates.map((d) => (
              <option key={d} value={d} style={{ backgroundColor: '#1F0703', color: '#FFFFFF' }}>
                {formatDisplayDate(d)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tampilan jika filter tanggal tidak memiliki data */}
      {sorted.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#1A0A06]/50 p-8 text-center backdrop-blur-md">
          <p className="font-serif text-base font-bold text-[#FDF8F5]">
            Tidak ada pertandingan pada tanggal ini
          </p>
          <button
            type="button"
            onClick={() => setSelectedDate('all')}
            className="mt-3 rounded-full border border-[#FF7A45]/40 bg-[#FF7A45]/15 px-4 py-1.5 text-xs font-bold text-[#FF7A45] hover:bg-[#FF7A45]/25 transition"
          >
            Tampilkan Semua Tanggal
          </button>
        </div>
      ) : (
        /* ======================================================== */
        /* DAFTAR KARTU PERTANDINGAN (MATCH CARDS) */
        /* ======================================================== */
        <ul className="flex flex-col gap-3">
          {sorted.map((match) => {
            const teamAWon = match.gamesA > match.gamesB;
            const teamBWon = match.gamesB > match.gamesA;
            const isDraw = !teamAWon && !teamBWon;

            return (
              <li
                key={match.id}
                className="group relative rounded-3xl border border-white/10 bg-[#1A0A06]/50 p-5 shadow-lg backdrop-blur-md transition-all hover:border-[#FF7A45]/40"
              >
                {/* HEADER CARD: TANGGAL, FORMAT & AKSI MASTER */}
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Teks Tanggal Oranye Terang */}
                    <span className="font-sans text-xs font-bold uppercase tracking-widest text-[#FF7A45]">
                      {formatDisplayDate(match.date)}
                    </span>
                    {/* Badge Format Singles / Doubles */}
                    <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[#FDF8F5] uppercase">
                      {match.format === 'singles' ? 'Singles' : 'Doubles'}
                    </span>
                  </div>

                  {/* Tombol Edit & Hapus (Khusus Master Admin) */}
                  {isMaster && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(match)}
                        aria-label="Edit pertandingan"
                        className="rounded-full p-1.5 text-[#FDF8F5]/50 transition-colors hover:bg-white/10 hover:text-[#FF7A45]"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(match)}
                        aria-label="Hapus pertandingan"
                        className="rounded-full p-1.5 text-[#FDF8F5]/50 transition-colors hover:bg-white/10 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>

                {/* AREA UTAMA: TIM A VS TIM B & KOTAK SKOR */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  {/* Sisi Tim A */}
                  <div className="text-left">
                    <p className={`font-serif text-base sm:text-lg leading-snug text-[#FDF8F5] ${teamAWon ? 'font-bold' : 'font-medium opacity-90'}`}>
                      {teamNames(match.teamA)}
                    </p>
                    {teamAWon && (
                      <span className="mt-1 inline-block rounded bg-[#B84013] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow">
                        Menang
                      </span>
                    )}
                  </div>

                  {/* Kotak Skor Tengah Kontras Tinggi */}
                  <div className="rounded-2xl bg-[#FDF8F5] px-4 py-1.5 text-center font-serif text-xl sm:text-2xl font-black text-[#0F0402] shadow-[0_4px_15px_rgba(0,0,0,0.3)] select-none">
                    {match.gamesA} <span className="text-[#FF7A45]">-</span> {match.gamesB}
                  </div>

                  {/* Sisi Tim B */}
                  <div className="text-right">
                    <p className={`font-serif text-base sm:text-lg leading-snug text-[#FDF8F5] ${teamBWon ? 'font-bold' : 'font-medium opacity-90'}`}>
                      {teamNames(match.teamB)}
                    </p>
                    {teamBWon && (
                      <span className="mt-1 inline-block rounded bg-[#B84013] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow">
                        Menang
                      </span>
                    )}
                  </div>
                </div>

                {/* Indikator Jika Hasil Seri */}
                {isDraw && (
                  <p className="mt-3 text-center font-sans text-xs font-bold uppercase tracking-widest text-[#FF7A45]">
                    — Hasil Seri —
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
