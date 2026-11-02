import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import ClubLogo from '@/components/ClubLogo';
import { inputClass } from '@/components/formStyles';

interface LoginPageProps {
  onSignIn: (username: string, password: string) => Promise<string | null>;
}

export default function LoginPage({ onSignIn }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="animate-fade-up w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <ClubLogo className="w-44 shadow-2xl ring-4 ring-gold md:w-52" />
          <p className="mt-6 font-display text-2xl font-bold tracking-wide text-maroon-dark md:text-3xl">
            PANIC AT THE COURT
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-maroon/70">Tennis Club Leaderboard</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col gap-5 rounded-3xl border-2 border-maroon bg-cream p-6 shadow-xl md:p-8"
        >
          <div className="text-center">
            <h1 className="font-display text-xl font-bold">Masuk ke Klub</h1>
            <p className="mt-1 text-sm text-maroon/80">Akun dibuat oleh master admin klub.</p>
          </div>

          <div>
            <label htmlFor="login-username" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-maroon">
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

          <div>
            <label htmlFor="login-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-maroon">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-maroon transition hover:bg-maroon/10"
              >
                {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-clay/40 bg-clay/10 px-4 py-3 text-sm font-semibold text-clay">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 font-semibold text-maroon-dark shadow transition hover:-translate-y-0.5 hover:bg-gold-light active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LogIn className="h-5 w-5" aria-hidden="true" />
            {submitting ? 'Memeriksa...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
