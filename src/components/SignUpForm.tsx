import { useState, type FormEvent } from 'react';
import { UserPlus } from 'lucide-react';
import PasswordField from '@/components/PasswordField';
import { inputClass, labelClass, primaryButtonClass } from '@/components/formStyles';

interface SignUpFormProps {
  onSignUp: (username: string, password: string) => Promise<string | null>;
}

// Mirrors the username rule enforced in the database.
const USERNAME_PATTERN = /^[a-z0-9_.]{3,20}$/;

function validate(username: string, password: string, confirmation: string): string | null {
  if (!USERNAME_PATTERN.test(username)) {
    return 'Username 3-20 karakter: huruf kecil, angka, titik, atau garis bawah.';
  }
  if (password.length < 6) return 'Password minimal 6 karakter.';
  // 72 is the maximum the auth provider accepts for a password.
  if (password.length > 72) return 'Password maksimal 72 karakter.';
  if (password !== confirmation) return 'Konfirmasi password tidak sama.';
  return null;
}

export default function SignUpForm({ onSignUp }: SignUpFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = username.trim().toLowerCase();
    const validationError = validate(normalized, password, confirmation);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    setError(null);
    const signUpError = await onSignUp(normalized, password);
    if (signUpError) {
      setError(signUpError);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="signup-username" className={labelClass}>
          Username
        </label>
        <input
          id="signup-username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="contoh: nohan"
          className={inputClass}
        />
      </div>

      <PasswordField
        id="signup-password"
        label="Password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        placeholder="Minimal 6 karakter"
      />

      <PasswordField
        id="signup-confirm"
        label="Konfirmasi Password"
        value={confirmation}
        onChange={setConfirmation}
        autoComplete="new-password"
        placeholder="Ulangi password"
      />

      {error && (
        <p role="alert" className="rounded-xl border border-loss/40 bg-loss/10 px-4 py-3 text-sm font-semibold text-loss">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className={`${primaryButtonClass} py-3`}>
        <UserPlus className="h-5 w-5" aria-hidden="true" />
        {submitting ? 'Mendaftarkan...' : 'Daftar Akun Baru'}
      </button>
    </form>
  );
}
