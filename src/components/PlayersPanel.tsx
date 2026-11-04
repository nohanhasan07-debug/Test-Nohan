import { useEffect, useState, type FormEvent } from 'react';
import { Trash2, UserPlus } from 'lucide-react';
import { errorTextClass, inputClass, primaryButtonClass } from '@/components/formStyles';
import { fetchProfiles } from '@/lib/manageUsers';
import { getErrorMessage } from '@/lib/errors';
import type { Player, Profile } from '@/types';

const MAX_NAME_LENGTH = 30;

interface PlayersPanelProps {
  players: Player[];
  onAddPlayer: (name: string) => Promise<void>;
  onLinkPlayer: (playerId: string, profileId: string | null) => Promise<void>;
  onDeletePlayer: (playerId: string) => Promise<void>;
}

export default function PlayersPanel({ players, onAddPlayer, onLinkPlayer, onDeletePlayer }: PlayersPanelProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profilesError, setProfilesError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles()
      .then(setProfiles)
      .catch((loadError: unknown) => {
        setProfilesError(getErrorMessage(loadError, 'Daftar akun tidak bisa dimuat.'));
      });
  }, []);

  const runAction = async (action: () => Promise<void>) => {
    setSaving(true);
    setError(null);
    try {
      await action();
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Nama pemain tidak boleh kosong.');
      return;
    }
    if (players.some((player) => player.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Nama pemain sudah terdaftar.');
      return;
    }
    await runAction(async () => {
      await onAddPlayer(trimmed);
      setName('');
    });
  };

  const handleLink = (playerId: string, profileId: string) => {
    void runAction(() => onLinkPlayer(playerId, profileId || null));
  };

  const handleDelete = (player: Player) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus pemain ${player.name}? Data riwayat pertandingan pemain ini akan terpengaruh.`)) {
      return;
    }
    void runAction(() => onDeletePlayer(player.id));
  };

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="font-display text-lg font-bold">Tambah Pemain Baru</h3>
        <p className="mt-1 text-sm text-paper/70">Pemain baru bisa dipilih saat mencatat match.</p>
        <form onSubmit={handleAdd} className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            aria-label="Nama pemain baru"
            value={name}
            maxLength={MAX_NAME_LENGTH}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nama pemain"
            className={inputClass}
          />
          <button type="submit" disabled={saving} className={`${primaryButtonClass} shrink-0`}>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Tambah
          </button>
        </form>
        {error && <p role="alert" className={`mt-2 ${errorTextClass}`}>{error}</p>}
      </section>

      <section className="border-t-2 border-white/10 pt-5">
        <h3 className="font-display text-lg font-bold">Daftar Pemain ({players.length})</h3>
        <p className="mt-1 text-sm text-paper/70">
          Hubungkan setiap pemain ke akun login agar pemain bisa melihat Performa Saya.
        </p>
        {profilesError && <p role="alert" className={`mt-2 ${errorTextClass}`}>{profilesError}</p>}
        <ul className="mt-3 flex flex-col gap-2">
          {players.map((player) => (
            <li
              key={player.id}
              className="flex flex-col gap-2 rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center justify-between gap-3">
                <span className="font-display text-base font-bold">{player.name}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(player)}
                  disabled={saving}
                  aria-label={`Hapus pemain ${player.name}`}
                  title="Hapus pemain"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-loss/40 text-loss transition hover:bg-loss/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-loss disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <select
                aria-label={`Akun untuk ${player.name}`}
                value={player.profileId ?? ''}
                disabled={saving || profiles.length === 0}
                onChange={(event) => handleLink(player.id, event.target.value)}
                className={`${inputClass} sm:w-64`}
              >
                <option value="">Belum terhubung</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.displayName} (@{profile.username})
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
