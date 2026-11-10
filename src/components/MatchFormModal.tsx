import { useState, type FormEvent } from 'react';
import Modal from '@/components/Modal';
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
    <Modal title={isEdit ? 'Edit Match' : 'Log Match'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Tanggal & Format */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="match-date" className="block text-[10px] font-sans uppercase tracking-wider text-[#FDF8F5]/60 mb-1">
              Tanggal
            </label>
            <input
              id="match-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-xs font-semibold text-[#FDF8F5] outline-none focus:border-[#FF7A45]"
            />
          </div>
          <div>
            <span className="block text-[10px] font-sans uppercase tracking-wider text-[#FDF8F5]/60 mb-1">
              Format
            </span>
            <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/20 bg-black/30 p-1">
              {(['singles', 'doubles'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setFormat(opt)}
                  className={`rounded-lg py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                    format === opt ? 'bg-[#FF7A45] text-[#0F0402]' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {opt === 'singles' ? 'Singles' : 'Doubles'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pemain Tim A */}
        <div>
          <span className="block text-[10px] font-sans uppercase tracking-wider text-[#FF7A45] mb-1">
            Tim A
          </span>
          <div className="flex flex-col gap-2">
            {Array.from({ length: size }, (_, i) => (
              <select
                key={i}
                aria-label={`Tim A pemain ${i + 1}`}
                value={activeA[i] ?? ''}
                onChange={(e) => updateSlot('A', i, e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-xs text-[#FDF8F5] outline-none focus:border-[#FF7A45]"
              >
                <option value="" className="bg-[#1A0A06]">Pilih pemain</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#1A0A06]">
                    {p.name}
                  </option>
                ))}
              </select>
            ))}
          </div>
        </div>

        {/* VS Divider */}
        <div className="flex items-center gap-3 my-1">
          <span className="h-px flex-1 bg-white/10" />
          <span className="font-serif text-xs font-bold text-[#FF7A45]">VS</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        {/* Pemain Tim B */}
        <div>
          <span className="block text-[10px] font-sans uppercase tracking-wider text-[#FF7A45] mb-1">
            Tim B
          </span>
          <div className="flex flex-col gap-2">
            {Array.from({ length: size }, (_, i) => (
              <select
                key={i}
                aria-label={`Tim B pemain ${i + 1}`}
                value={activeB[i] ?? ''}
                onChange={(e) => updateSlot('B', i, e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-xs text-[#FDF8F5] outline-none focus:border-[#FF7A45]"
              >
                <option value="" className="bg-[#1A0A06]">Pilih pemain</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#1A0A06]">
                    {p.name}
                  </option>
                ))}
              </select>
            ))}
          </div>
        </div>

        {/* Skor Game */}
        <div>
          <span className="block text-[10px] font-sans uppercase tracking-wider text-[#FDF8F5]/60 mb-1">
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
              className="rounded-xl border border-white/20 bg-black/40 py-2 text-center font-serif text-xl font-bold text-[#FDF8F5] outline-none focus:border-[#FF7A45]"
            />
            <span className="font-serif text-lg text-white/40">-</span>
            <input
              aria-label="Game Tim B"
              type="number"
              min={0}
              max={99}
              placeholder="0"
              value={gamesB}
              onChange={(e) => setGamesB(e.target.value)}
              className="rounded-xl border border-white/20 bg-black/40 py-2 text-center font-serif text-xl font-bold text-[#FDF8F5] outline-none focus:border-[#FF7A45]"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </p>
        )}

        {/* Tombol Aksi */}
        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-wider text-[#FDF8F5]/80 hover:bg-white/10"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[#FF7A45] px-6 py-2 text-xs font-semibold uppercase tracking-wider text-[#0F0402] transition hover:bg-[#ff8e5e] active:scale-95 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Match'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
