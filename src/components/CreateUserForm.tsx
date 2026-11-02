import { useState, type FormEvent } from 'react';
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from '@/components/formStyles';
import type { AccountRole } from '@/types';

export interface NewAccountValues {
  username: string;
  displayName: string;
  password: string;
  role: AccountRole;
}

interface CreateUserFormProps {
  onCreate: (values: NewAccountValues) => Promise<string | null>;
  onCancel: () => void;
}

export default function CreateUserForm({ onCreate, onCancel }: CreateUserFormProps) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AccountRole>('member');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !displayName.trim() || !password) {
      setError('Username, nama tampilan, dan password wajib diisi.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const createError = await onCreate({ username: username.trim(), displayName: displayName.trim(), password, role });
    setSubmitting(false);
    if (createError) setError(createError);
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade-up flex flex-col gap-4 rounded-2xl border-2 border-gold bg-white/70 p-4 md:p-5">
      <p className="font-display text-lg font-bold">Buat Akun Baru</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="new-username" className={labelClass}>Username</label>
          <input
            id="new-username"
            value={username}
            maxLength={20}
            autoCapitalize="none"
            spellCheck={false}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="contoh: erco"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="new-display-name" className={labelClass}>Nama Tampilan</label>
          <input
            id="new-display-name"
            value={displayName}
            maxLength={40}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="contoh: Erco"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="new-password" className={labelClass}>Password Awal</label>
          <input
            id="new-password"
            type="text"
            autoComplete="off"
            value={password}
            maxLength={72}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimal 6 karakter"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="new-role" className={labelClass}>Peran</label>
          <select
            id="new-role"
            value={role}
            onChange={(event) => setRole(event.target.value as AccountRole)}
            className={inputClass}
          >
            <option value="member">Member</option>
            <option value="master">Master Admin</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-maroon-dark/75">
        Bagikan username dan password ini ke pemain. Jika lupa password, master admin bisa menggantinya dari daftar akun.
      </p>

      {error && (
        <p role="alert" className="rounded-xl border border-clay/40 bg-clay/10 px-4 py-3 text-sm font-semibold text-clay">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className={secondaryButtonClass}>Batal</button>
        <button type="submit" disabled={submitting} className={primaryButtonClass}>
          {submitting ? 'Membuat...' : 'Buat Akun'}
        </button>
      </div>
    </form>
  );
}
