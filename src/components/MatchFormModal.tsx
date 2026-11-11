import { useState, useEffect, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
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

export default function MatchFormModal({ players = [], initial, onSubmit, onClose }: MatchFormModalProps) {
  // State pemain dengan auto-recovery langsung dari profiles jika props kosong
  const [playerList, setPlayerList] = useState<Player[]>(players);
  const [date, setDate] = useState(initial?.date ?? toIsoDate(new Date()));
  const [format, setFormat] = useState<MatchFormat>(initial?.format ?? 'singles');
  const [teamA, setTeamA] = useState<string[]>(() => padTeam(initial?.teamA));
  const [teamB, setTeamB] = useState<string[]>(() => padTeam(initial?.teamB));
  const [gamesA, setGamesA] = useState(initial ? String(initial.gamesA) : '');
  const [gamesB, setGamesB] = useState(initial ? String(initial.gamesB) : '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // AUTO-RECOVERY: Jika daftar pemain kosong, tarik langsung dari profiles
  useEffect(() => {
    if (players && players.length > 0) {
      setPlayerList(players);
    } else {
      async function fetchFallbackPlayers() {
        try {
          const { data } = await supabase.from('profiles').select('*');
          if (data && data.length > 0) {
            setPlayerList(
              data.map((p: any) => ({
                id: String(p.id),
                name: p.display_name || p.name || p.username || 'Member',
                profileId: p.id,
              }))
            );
          }
        } catch (err) {
          console.error('Gagal mengambil pemain darurat:', err);
        }
      }
      void fetchFallbackPlayers();
    }
  }, [players]);

  const size = format === 'singles' ? 1 : 2;
  const activeA = teamA.slice(0, size);
  const activeB = teamB.slice(0, size);
  const requiredPlayers = size * 2;
  const isEdit = Boolean(initial);

  // Tutup dengan Escape
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
    if (playerList.length < requiredPlayers) {
      return `Format ini membutuhkan minimal ${requiredPlayers} pemain terdaftar.`;
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#FF7A45]/40 bg-[#160603] p-6 shadow-2xl shadow-black max-h-[92vh] overflow-y-auto">
        <span className="absolute top-2 left-3 font-mono text-[10px] text-[#FF7A45]/50">+</span>
        <span className="absolute top-2 right-3 font-mono text-[10px] text-[#FF7A45]/50">+</span>

        {/* HEADER MODAL */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <h2 style={{ color: '#FFFFFF' }} className="font-serif text-2xl font-bold tracking-wide">
            {isEdit ? 'Edit Match' : 'Log Match'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            style={{ color: '#FFFFFF', backgroundColor: 'rgba(255, 122, 69, 0.15)', borderColor: 'rgba(255, 122, 69, 0.4)' }}
            className="flex h-8 w-8 items-center justify-center rounded-full border transition hover:bg-[#FF7A45]/30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* FORMULIR UTAMA */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* TANGGAL & FORMAT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="match-date" className="block text-[#FF7A45] font-bold text-[11px] tracking-widest uppercase mb-1.5">
                Tanggal
              </label>
              <input
                id="match-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  colorScheme: 'dark',
                  color: '#FFFFFF',
                  backgroundColor: '#0F0402',
                  borderColor: 'rgba(255, 122, 69, 0.4)',
                }}
                className="w-full rounded-xl border px-3 py-2.5 text-xs font-semibold outline-none focus:border-[#FF7A45]"
              />
            </div>

            <div>
              <span className="block text-[#FF7A45] font-bold text-[11px] tracking-widest uppercase mb-1.5">
                Format
              </span>
              <div
                style={{ backgroundColor: '#0F0402', borderColor: 'rgba(255, 122, 69, 0.3)' }}
                className="grid grid-cols-2 gap-1 rounded-xl border p-1"
              >
                {(['singles', 'doubles'] as const).map((opt) => {
                  const isSelected = format === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormat(opt)}
                      style={{
                        background: isSelected ? 'linear-gradient(to right, #B84013, #FF7A45)' : 'transparent',
                        color: '#FFFFFF',
                      }}
                      className="rounded-lg py-2 text-xs uppercase tracking-wider font-bold transition-all hover:bg-white/5"
                    >
                      {opt === 'singles' ? 'Singles' : 'Doubles'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* PEMAIN TIM A */}
          <div>
            <span className="block text-[#FF7A45] font-bold text-[11px] tracking-widest uppercase mb-1.5">
              Tim A
            </span>
            <div className="flex flex-col gap-2">
              {Array.from({ length: size }, (_, i) => (
                <select
                  key={i}
                  aria-label={`Tim A pemain ${i + 1}`}
                  value={activeA[i] ?? ''}
                  onChange={(e) => updateSlot('A', i, e.target.value)}
                  style={{
                    colorScheme: 'dark',
                    color: '#FFFFFF',
                    backgroundColor: '#0F0402',
                    borderColor: 'rgba(255, 122, 69, 0.4)',
                  }}
                  className="w-full rounded-xl border px-3 py-2.5 text-xs font-semibold outline-none focus:border-[#FF7A45]"
                >
                  <option value="" style={{ backgroundColor: '#1F0803', color: '#FF7A45' }}>
                    -- Pilih pemain Tim A --
                  </option>
                  {playerList.map((p) => (
                    <option
                      key={p.id}
                      value={p.id}
                      style={{ backgroundColor: '#1F0803', color: '#FFFFFF' }}
                    >
                      {p.name}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          </div>

          {/* VS DIVIDER */}
          <div className="flex items-center gap-3 my-0.5">
            <span className="h-px flex-1 bg-[#FF7A45]/20" />
            <span className="font-serif text-xs font-bold text-[#FF7A45] px-1 tracking-wider">VS</span>
            <span className="h-px flex-1 bg-[#FF7A45]/20" />
          </div>

          {/* PEMAIN TIM B */}
          <div>
            <span className="block text-[#FF7A45] font-bold text-[11px] tracking-widest uppercase mb-1.5">
              Tim B
            </span>
            <div className="flex flex-col gap-2">
              {Array.from({ length: size }, (_, i) => (
                <select
                  key={i}
                  aria-label={`Tim B pemain ${i + 1}`}
                  value={activeB[i] ?? ''}
                  onChange={(e) => updateSlot('B', i, e.target.value)}
                  style={{
                    colorScheme: 'dark',
                    color: '#FFFFFF',
                    backgroundColor: '#0F0402',
                    borderColor: 'rgba(255, 122, 69, 0.4)',
                  }}
                  className="w-full rounded-xl border px-3 py-2.5 text-xs font-semibold outline-none focus:border-[#FF7A45]"
                >
                  <option value="" style={{ backgroundColor: '#1F0803', color: '#FF7A45' }}>
                    -- Pilih pemain Tim B --
                  </option>
                  {playerList.map((p) => (
                    <option
                      key={p.id}
                      value={p.id}
                      style={{ backgroundColor: '#1F0803', color: '#FFFFFF' }}
                    >
                      {p.name}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          </div>

          {/* SKOR GAME */}
          <div className="mt-1">
            <span className="block text-[#FF7A45] font-bold text-[11px] tracking-widest uppercase mb-2">
              Skor Game (Games Won)
            </span>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="relative">
                <span className="absolute -top-2 left-3 bg-[#1F0803] px-1.5 text-[9px] font-bold uppercase tracking-wider text-[#FF7A45] rounded">
                  Tim A
                </span>
                <input
                  aria-label="Game Tim A"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  placeholder="0"
                  value={gamesA}
                  onChange={(e) => setGamesA(e.target.value)}
                  style={{
                    colorScheme: 'dark',
                    color: '#FF7A45',
                    backgroundColor: '#0F0402',
                    borderColor: 'rgba(255, 122, 69, 0.5)',
                  }}
                  className="w-full rounded-2xl border-2 py-3 text-center font-serif text-3xl font-black outline-none focus:border-[#FF7A45] shadow-inner"
                />
              </div>

              <span className="font-serif text-2xl font-black text-[#FF7A45]">-</span>

              <div className="relative">
                <span className="absolute -top-2 left-3 bg-[#1F0803] px-1.5 text-[9px] font-bold uppercase tracking-wider text-[#FF7A45] rounded">
                  Tim B
                </span>
                <input
                  aria-label="Game Tim B"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  placeholder="0"
                  value={gamesB}
                  onChange={(e) => setGamesB(e.target.value)}
                  style={{
                    colorScheme: 'dark',
                    color: '#FF7A45',
                    backgroundColor: '#0F0402',
                    borderColor: 'rgba(255, 122, 69, 0.5)',
                  }}
                  className="w-full rounded-2xl border-2 py-3 text-center font-serif text-3xl font-black outline-none focus:border-[#FF7A45] shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* ERROR VALIDASI */}
          {error && (
            <p className="rounded-xl border border-red-500/50 bg-red-500/15 px-4 py-2.5 text-xs text-red-300 font-medium">
              {error}
            </p>
          )}

          {/* TOMBOL AKSI */}
          <div className="mt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              style={{
                color: '#FFFFFF',
                borderColor: 'rgba(255, 122, 69, 0.4)',
                backgroundColor: 'rgba(255, 122, 69, 0.1)',
              }}
              className="w-full sm:w-auto border-2 font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider text-center hover:bg-[#FF7A45]/20"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: 'linear-gradient(to right, #B84013, #FF7A45)',
                color: '#FFFFFF',
              }}
              className="w-full sm:w-auto font-bold px-7 py-2.5 rounded-xl shadow-lg shadow-[#B84013]/50 hover:brightness-110 active:scale-95 transition-all text-xs uppercase tracking-wider disabled:opacity-50 text-center"
            >
              {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Match'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
