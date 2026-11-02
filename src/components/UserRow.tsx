import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { errorTextClass, inputClass, labelClass, primaryButtonClass } from '@/components/formStyles';
import type { AccountRole, Profile } from '@/types';

interface UserRowProps {
  profile: Profile;
  isSelf: boolean;
  onUpdate: (displayName: string, role: AccountRole) => Promise<string | null>;
  onResetPassword: (password: string) => Promise<string | null>;
  onDelete: () => void;
}

export default function UserRow({ profile, isSelf, onUpdate, onResetPassword, onDelete }: UserRowProps) {
  const [editing, setEditing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [role, setRole] = useState<AccountRole>(profile.role);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const runAction = async (action: () => Promise<string | null>, onDone: () => void) => {
    setBusy(true);
    setError(null);
    const actionError = await action();
    setBusy(false);
    if (actionError) {
      setError(actionError);
      return;
    }
    onDone();
  };

  const handleSave = () =>
    runAction(() => onUpdate(displayName.trim(), role), () => setEditing(false));

  const handleReset = () =>
    runAction(() => onResetPassword(password), () => {
      setResetting(false);
      setPassword('');
    });

  return (
    <li className="rounded-2xl border-2 border-maroon/15 bg-white/70 p-4 shadow-sm transition hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-display text-lg font-bold">
            <span className="truncate">{profile.displayName}</span>
            {isSelf && <span className="rounded-full bg-olive/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-olive">Anda</span>}
          </p>
          <p className="text-sm text-maroon-dark/75">
            @{profile.username} ·{' '}
            <span className={`font-semibold ${profile.role === 'master' ? 'text-gold-dark' : 'text-maroon'}`}>
              {profile.role === 'master' ? 'Master Admin' : 'Member'}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditing((value) => !value);
              setResetting(false);
              setError(null);
            }}
            className="rounded-full border-2 border-maroon px-3 py-1.5 text-sm font-semibold text-maroon transition hover:bg-maroon/10"
          >
            Ubah
          </button>
          <button
            type="button"
            onClick={() => {
              setResetting((value) => !value);
              setEditing(false);
              setError(null);
            }}
            className="rounded-full border-2 border-maroon px-3 py-1.5 text-sm font-semibold text-maroon transition hover:bg-maroon/10"
          >
            Password
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isSelf}
            aria-label={`Hapus akun ${profile.username}`}
            className="rounded-full p-2 text-clay transition hover:bg-clay/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {editing && (
        <div className="mt-4 grid gap-3 border-t-2 border-maroon/10 pt-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor={`name-${profile.id}`} className={labelClass}>Nama Tampilan</label>
            <input
              id={`name-${profile.id}`}
              value={displayName}
              maxLength={40}
              onChange={(event) => setDisplayName(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor={`role-${profile.id}`} className={labelClass}>Peran</label>
            <select
              id={`role-${profile.id}`}
              value={role}
              disabled={isSelf}
              onChange={(event) => setRole(event.target.value as AccountRole)}
              className={inputClass}
            >
              <option value="member">Member</option>
              <option value="master">Master Admin</option>
            </select>
          </div>
          <button type="button" onClick={handleSave} disabled={busy} className={primaryButtonClass}>
            {busy ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      )}

      {resetting && (
        <div className="mt-4 grid gap-3 border-t-2 border-maroon/10 pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label htmlFor={`pw-${profile.id}`} className={labelClass}>Password Baru</label>
            <input
              id={`pw-${profile.id}`}
              type="text"
              autoComplete="off"
              value={password}
              maxLength={72}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimal 6 karakter"
              className={inputClass}
            />
          </div>
          <button type="button" onClick={handleReset} disabled={busy} className={primaryButtonClass}>
            {busy ? 'Menyimpan...' : 'Ganti Password'}
          </button>
        </div>
      )}

      {error && <p role="alert" className={`mt-3 ${errorTextClass}`}>{error}</p>}
      {!editing && !resetting && isSelf && (
        <p className="mt-3 text-xs text-maroon-dark/75">
          Akun Anda sendiri tidak bisa dihapus atau diturunkan perannya.
        </p>
      )}
    </li>
  );
}
