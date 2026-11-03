import { useState } from 'react';
import ClubLogo from '@/components/ClubLogo';
import CourtLines from '@/components/CourtLines';
import LoginForm from '@/components/LoginForm';
import SignUpForm from '@/components/SignUpForm';
import TennisBall from '@/components/TennisBall';

type AuthMode = 'login' | 'signup';

interface AuthPageProps {
  onSignIn: (username: string, password: string) => Promise<string | null>;
  onSignUp: (username: string, password: string) => Promise<string | null>;
}

const TABS: { mode: AuthMode; label: string }[] = [
  { mode: 'login', label: 'Masuk' },
  { mode: 'signup', label: 'Daftar Akun Baru' },
];

export default function AuthPage({ onSignIn, onSignUp }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="animate-fade-up w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <ClubLogo className="w-44 shadow-2xl ring-4 ring-neon md:w-52" />
          <p className="mt-6 font-display text-2xl font-bold tracking-wide text-paper md:text-3xl">
            PANIC AT THE COURT
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-paper/70">Tennis Club Leaderboard</p>
        </div>

        <div className="relative mt-8 overflow-hidden rounded-3xl border-2 border-paper/30 bg-ink-900 p-6 shadow-xl md:p-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <CourtLines className="text-paper/10" />
          </div>

          <div className="relative flex flex-col gap-6">
            <div className="text-center">
              <TennisBall className="mx-auto mb-2 h-10 w-10 text-neon-dark" />
              <h1 className="font-display text-xl font-bold">
                {mode === 'login' ? 'Masuk ke Klub' : 'Buat Akun Member'}
              </h1>
              <p className="mt-1 text-sm text-paper/70">
                {mode === 'login'
                  ? 'Masuk dengan username dan password Anda.'
                  : 'Cukup isi username dan password untuk mulai.'}
              </p>
            </div>

            <div role="tablist" className="grid grid-cols-2 gap-1 rounded-full border-2 border-white/20 bg-white/5 p-1">
              {TABS.map((tab) => {
                const selected = mode === tab.mode;
                return (
                  <button
                    key={tab.mode}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setMode(tab.mode)}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-neon ${
                      selected ? 'bg-paper text-ink-950' : 'text-paper/80 hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {mode === 'login' ? <LoginForm onSignIn={onSignIn} /> : <SignUpForm onSignUp={onSignUp} />}
          </div>
        </div>
      </div>
    </div>
  );
}
