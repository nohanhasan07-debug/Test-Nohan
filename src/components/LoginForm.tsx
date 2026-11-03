import { useState, type FormEvent } from 'react';
import { LogIn } from 'lucide-react';
import PasswordField from '@/components/PasswordField';
import { inputClass, labelClass, primaryButtonClass } from '@/components/formStyles';

interface LoginFormProps {
  onSignIn: (username: string, password: string) => Promise<string | null>;
}

export default function LoginForm({ onSignIn }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError('Isi username dan password terlebih dahulu.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const signInError = await onSignIn(username, password);
    if (signInError) {
      setError(signInError);
      setPassword('');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="login-username" className={labelClass}>
          Username
        </label>
        <input
          id="login-username"
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
        id="login-password"
        label="Password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
      />

      {error && (
        <p role="alert" className="rounded-xl border border-loss/40 bg-loss/10 px-4 py-3 text-sm font-semibold text-loss">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className={`${primaryButtonClass} py-3`}>
        <LogIn className="h-5 w-5" aria-hidden="true" />
        {submitting ? 'Memeriksa...' : 'Masuk'}
      </button>
    </form>
  );
}
