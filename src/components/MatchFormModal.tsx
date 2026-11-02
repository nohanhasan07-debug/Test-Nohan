import { useState, type FormEvent } from 'react';
import { inputClass, labelClass } from '@/components/formStyles';
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
      return `Format ini membutuhkan minimal ${requiredPlayers} pemain. Tambahkan pemain lewat Master Admin.`;
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="match-date" className={labelClass}>Tanggal</label>
            <input
              id="match-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <span className={labelClass}>Format</span>
            <div className="grid grid-cols-2 gap-1 rounded-xl border-2 border-maroon bg-cream-dark p-1">
              {(['singles', 'doubles'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormat(option)}
                  className={`rounded-lg px-2 py-2 text-sm font-semibold transition ${
                    format === option ? 'bg-maroon text-cream' : 'text-maroon hover:bg-maroon/10'
                  }`}
                >
                  {option === 'singles' ? 'Singles' : 'Doubles'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <TeamFields
          label="Tim A"
          size={size}
          values={activeA}
          players={players}
          onChange={(index, value) => updateSlot('A', index, value)}
        />

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-maroon/20" />
          <span className="font-display text-sm font-bold text-maroon">VS</span>
          <span className="h-px flex-1 bg-maroon/20" />
        </div>

        <TeamFields
          label="Tim B"
          size={size}
          values={activeB}
          players={players}
          onChange={(index, value) => updateSlot('B', index, value)}
        />

        <div>
          <span className={labelClass}>Skor Game</span>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <input
              aria-label="Game Tim A"
              type="number"
              inputMode="numeric"
              min={0}
              max={99}
              placeholder="0"
              value={gamesA}
              onChange={(event) => setGamesA(event.target.value)}
              className={`${inputClass} text-center font-display text-xl font-bold`}
            />
            <span className="font-display text-xl font-bold text-maroon">-</span>
            <input
              aria-label="Game Tim B"
              type="number"
              inputMode="numeric"
              min={0}
              max={99}
              placeholder="0"
              value={gamesB}
              onChange={(event) => setGamesB(event.target.value)}
              className={`${inputClass} text-center font-display text-xl font-bold`}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-clay/40 bg-clay/10 px-4 py-3 text-sm font-semibold text-clay">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border-2 border-maroon px-5 py-2.5 font-semibold text-maroon transition hover:bg-maroon/10"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-gold px-6 py-2.5 font-semibold text-maroon-dark shadow transition hover:-translate-y-0.5 hover:bg-gold-light active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Match'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface TeamFieldsProps {
  label: string;
  size: number;
  values: string[];
  players: Player[];
  onChange: (index: number, value: string) => void;
}

function TeamFields({ label, size, values, players, onChange }: TeamFieldsProps) {
  return (
    <div>
      <span className={labelClass}>{label}</span>
      <div className="flex flex-col gap-2">
        {Array.from({ length: size }, (_, index) => (
          <select
            key={index}
            aria-label={`${label} pemain ${index + 1}`}
            value={values[index] ?? ''}
            onChange={(event) => onChange(index, event.target.value)}
            className={`${inputClass} appearance-none`}
          >
            <option value="">Pilih pemain</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
        ))}
      </div>
    </div>
  );
}
