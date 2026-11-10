import { useState } from 'react';
import ClubLogo from '@/components/ClubLogo';
import LoginForm from '@/components/LoginForm';
import SignUpForm from '@/components/SignUpForm';

type AuthMode = 'login' | 'signup';

interface AuthPageProps {
  onSignIn: (username: string, password: string) => Promise<string | null>;
  onSignUp: (username: string, password: string) => Promise<string | null>;
}

export default function AuthPage({ onSignIn, onSignUp }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      {/* Lingkaran ornamen geometris latar belakang */}
      <div className="pointer-events-none absolute h-[500px] w-[500px] rounded-full border border-white/5 opacity-40" />
      <div className="pointer-events-none absolute h-[700px] w-[700px] rounded-full border border-white/5 opacity-20" />

      <div className="relative w-full max-w-sm">
        {/* Branding Atas */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3">
            <ClubLogo className="w-20 rounded-full border border-[#FF7A45]/30 p-2 shadow-2xl backdrop-blur-md" />
          </div>
          <h1 className="font-serif text-2xl font-black uppercase tracking-tight text-[#FDF8F5] leading-tight">
            Panic At <br /> The Court
          </h1>
          <p className="mt-1 text-[9px] font-sans uppercase tracking-[0.3em] text-[#FDF8F5]/60">
            Tennis Club Leaderboard
          </p>
        </div>

        {/* Card Formulir Masuk / Daftar */}
        <div className="relative mt-7 overflow-hidden rounded-3xl border border-white/15 bg-[#150604]/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <span className="absolute top-2 left-3 font-mono text-[10px] text-white/30">+</span>
          <span className="absolute top-2 right-3 font-mono text-[10px] text-white/30">+</span>
          <span className="absolute bottom-2 left-3 font-mono text-[10px] text-white/30">+</span>
          <span className="absolute bottom-2 right-3 font-mono text-[10px] text-white/30">+</span>

          {/* Toggle Tab Masuk vs Daftar */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-full border border-white/15 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`rounded-full py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                mode === 'login'
                  ? 'bg-[#FF7A45] text-[#0F0402]'
                  : 'text-[#FDF8F5]/70 hover:text-[#FDF8F5]'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`rounded-full py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                mode === 'signup'
                  ? 'bg-[#FF7A45] text-[#0F0402]'
                  : 'text-[#FDF8F5]/70 hover:text-[#FDF8F5]'
              }`}
            >
              Daftar Baru
            </button>
          </div>

          {/* Formulir Sesuai Mode */}
          {mode === 'login' ? (
            <LoginForm onSignIn={onSignIn} />
          ) : (
            <SignUpForm onSignUp={onSignUp} />
          )}
        </div>
      </div>
    </div>
  );
}
