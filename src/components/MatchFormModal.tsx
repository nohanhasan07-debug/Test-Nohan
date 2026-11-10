import { useState, useEffect, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { toIsoDate } from '@/lib/date';
import { getErrorMessage } from '@/lib/errors';
import type { Match, MatchFormat, MatchInput, Player } from '@/types';

interface MatchFormModalProps {
  players: Player[];
  initial?: Match;
  onSubmit: (input: MatchInput) => Promise<void>;
  onClose: () => void;
}

const isScore = (value: string) => /^\d{1,2}$/.test(value);
const padTeam = (ids: string[] = []) => [ids[0] ?? '', ids[1] ?? ''];

export default function MatchFormModal({ players, initial, onSubmit, onClose }: MatchFormModalProps) {
  const [date, setDate] = useState(initial?.date ?? toIsoDate(new Date()));
  const [format, setFormat] = useState<MatchFormat>(initial?.format ?? 'singles');
  const [teamA, setTeamA] = useState<string[]>(() => padTeam(initial?.teamA));
  const [teamB, setTeamB] = useState<string[]>(() => padTeam(initial?.teamB));
  const [gamesA, setGamesA] = useState(initial ? String(initial.gamesA) : '');
  const [gamesB, setGamesB] = useState(initial ? String(initial.gamesB) : '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const size = format === 'singles' ? 1 : 2;
  const activeA = teamA.slice(0, size);
  const activeB = teamB.slice(0, size);
  const requiredPlayers = size * 2;
  const isEdit = Boolean(initial);

  // Tutup dengan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const updateSlot = (team: 'A' | 'B', index: number, value: string) => {
    const setter = team === 'A' ? setTeamA : setTeamB;
    const current = team === 'A' ? teamA : teamB;
    setter(current.map((item, i) => (i === index ? value : item)));
  };

  const validate = (): string | null => {
    if (!date) return 'Tanggal wajib diisi.';
    if (players.length < requiredPlayers) {
      return `Format ini membutuhkan minimal ${requiredPlayers} pemain.`;
    }
    const picked = [...activeA, ...activeB];
    if (picked.some((id) => !id)) return 'Pilih semua pemain terlebih dahulu.';
    if (new Set(picked).size !== picked.length) return 'Satu pemain tidak boleh muncul lebih dari sekali.';
    if (!isScore(gamesA) || !isScore(gamesB)) return 'Skor game harus berupa angka 0 sampai 99.';
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        date,
        format,
        teamA: activeA,
        teamB: activeB,
        gamesA: Number(gamesA),
        gamesB: Number(gamesB),
      });
    } catch (saveError) {
      setError(getErrorMessage(saveError));
      setSaving(false);
    }
  };

  return (
    /* 1. CONTAINER MODAL & BACKDROP LUAR */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* 2. BOX MODAL MELAYANG */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-b from-[#2D0D06] via-[#1E0904] to-[#0F0402] p-6 text-white shadow-2xl shadow-black max-h-[92vh] overflow-y-auto">
        {/* Ornamen sudut crosshair '+' */}
        <span className="absolute top-2 left-3 font-mono text-[10px] text-white/30">+</span>
        <span className="absolute top-2 right-3 font-mono text-[10px] text-white/30">+</span>

        {/* HEADER MODAL */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <h2 className="font-serif text-2xl tracking-wide text-[#FDF8F5]">
            {isEdit ? 'Edit Match' : 'Log Match'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* FORMULIR UTAMA */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* TANGGAL & FORMAT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="match-date" className="block text-[#FF7A45] font-bold text-[11px] tracking-widest uppercase mb-1">
                Tanggal
              </label>
              <input
                id="match-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-xs text-white shadow-inner focus:outline-none focus:border-[#FF7A45]"
              />
            </div>

            <div>
              <span className="block text-[#FF7A45] font-bold text-[11px] tracking-widest uppercase mb-1">
                Format
              </span>
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
                {(['singles', 'doubles'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFormat(opt)}
                    className={`rounded-lg py-2 text-xs uppercase tracking-wider transition ${
                      format === opt
                        ? 'bg-[#B84013] text-white font-bold shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {opt === 'singles' ? 'Singles' : 'Doubles'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* PEMAIN TIM A */}
          <div>
            <span className="block text-[#FF7A45] font-bold text-[11px] tracking-widest uppercase mb-1">
              Tim A
            </span>
            <div className="flex flex-col gap-2">
              {Array.from({ length: size }, (_, i) => (
                <select
                  key={i}
                  aria-label={`Tim A pemain ${i + 1}`}
                  value={activeA[i] ?? ''}
                  onChange={(e) => updateSlot('A', i, e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-xs text-white shadow-inner focus:outline-none focus:border-[#FF7A45]"
                >
                  <option value="" className="bg-[#1E0904] text-white/70">
                    Pilih pemain...
                  </option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#1E0904] text-white">
                      {p.name}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          </div>

          {/* VS DIVIDER */}
          <div className="flex items-center gap-3 my-0.5">
            <span className="h-px flex-1 bg-white/15" />
            <span className="font-serif text-xs font-bold text-[#FF7A45] px-1 tracking-wider">VS</span>
            <span className="h-px flex-1 bg-white/15" />
          </div>

          {/* PEMAIN TIM B */}
          <div>
            <span className="block text-[#FF7A45] font-bold text-[11px] tracking-widest uppercase mb-1">
              Tim B
            </span>
            <div className="flex flex-col gap-2">
              {Array.from({ length: size }, (_, i) => (
                <select
                  key={i}
                  aria-label={`Tim B pemain ${i + 1}`}
                  value={activeB[i] ?? ''}
                  onChange={(e) => updateSlot('B', i, e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-xs text-white shadow-inner focus:outline-none focus:border-[#FF7A45]"
                >
                  <option value="" className="bg-[#1E0904] text-white/70">
                    Pilih pemain...
                  </option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#1E0904] text-white">
                      {p.name}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          </div>

          {/* SKOR GAME */}
          <div>
            <span className="block text-[#FF7A45] font-bold text-[11px] tracking-widest uppercase mb-1">
              Skor Game
            </span>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <input
                aria-label="Game Tim A"
                type="number"
                min={0}
                max={99}
                placeholder="0"
                value={gamesA}
                onChange={(e) => setGamesA(e.target.value)}
                className="w-full rounded-2xl border border-white/20 bg-white/10 py-2.5 text-center font-bold text-xl text-white shadow-inner focus:outline-none focus:border-[#FF7A45]"
              />
              <span className="font-serif text-lg font-bold text-white/50">-</span>
              <input
                aria-label="Game Tim B"
                type="number"
                min={0}
                max={99}
                placeholder="0"
                value={gamesB}
                onChange={(e) => setGamesB(e.target.value)}
                className="w-full rounded-2xl border border-white/20 bg-white/10 py-2.5 text-center font-bold text-xl text-white shadow-inner focus:outline-none focus:border-[#FF7A45]"
              />
            </div>
          </div>

          {/* PESAN ERROR VALIDASI */}
          {error && (
            <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-xs text-red-400 font-medium">
              {error}
            </p>
          )}

          {/* FOOTER: TOMBOL AKSI */}
          <div className="mt-3 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto border border-white/20 text-white/90 hover:bg-white/10 font-medium px-6 py-3 rounded-xl transition-all text-xs uppercase tracking-wider text-center"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto bg-gradient-to-r from-[#B84013] to-[#FF7A45] text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-[#B84013]/50 hover:brightness-110 active:scale-95 transition-all text-xs uppercase tracking-wider disabled:opacity-50 text-center"
            >
              {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Match'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
