import ClubLogo from '@/components/ClubLogo';
import AuthPage from '@/components/AuthPage';
import LeaderboardPage from '@/components/LeaderboardPage';
import { secondaryButtonClass } from '@/components/formStyles';
import { useAuth } from '@/hooks/useAuth';

function App() {
  const { state, signIn, signUp, signOut } = useAuth();

  // 1. TAMPILAN LOADING
  if (state.status === 'loading') {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink-950 px-4">
        <div className="absolute h-72 w-72 rounded-full bg-neon/10 blur-[100px] pointer-events-none" />

        <div className="relative flex flex-col items-center">
          <div className="relative mb-6">
            <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-b from-neon/40 to-transparent opacity-60 blur-sm" />
            <div className="relative rounded-2xl border border-paper/10 bg-ink-900/80 p-3 shadow-2xl backdrop-blur-xl">
              <ClubLogo className="w-20 sm:w-24 transition-transform duration-700 hover:scale-105" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-neon" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-paper/60">
              Entering The Court
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. TAMPILAN AUTH (SIGN IN / SIGN UP)
  if (state.status === 'signed-out') {
    return <AuthPage onSignIn={signIn} onSignUp={signUp} />;
  }

  // 3. TAMPILAN ERROR JIKA PROFIL BELUM ADA
  if (!state.profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-loss/30 bg-ink-900/80 p-8 text-center shadow-2xl backdrop-blur-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-loss/20 bg-loss/10 text-loss">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>

          <h2 className="font-display text-2xl font-bold tracking-tight text-paper">
            Akun Belum Terdaftar
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-paper/60">
            Akun Anda belum tersinkronisasi dengan master data. Silakan hubungi pengurus atau Master Admin klub.
          </p>

          <button
            type="button"
            onClick={signOut}
            className={`${secondaryButtonClass} mt-6 w-full py-3 text-xs tracking-widest uppercase transition-all duration-300 hover:border-paper/40`}
          >
            Keluar Aplikasi
          </button>
        </div>
      </div>
    );
  }

  // Ekstrak nama user
  const userName =
    state.profile.name ||
    state.profile.username ||
    state.profile.full_name ||
    'Player';

  // 4. TAMPILAN UTAMA (HEADER SUDAH DIBERI OFFSET SIDEBAR)
  return (
    <div className="min-h-screen bg-ink-950 text-paper">
      {/* 
        md:pl-72 / lg:pl-80 memastikan banner memberi ruang untuk sidebar kiri, 
        sehingga teks tidak tertimpa dan langsung lurus dengan konten dashboard!
      */}
      <header className="relative border-b border-paper/10 bg-ink-900/30 backdrop-blur-sm md:pl-72 lg:pl-80 transition-all duration-300">
        <div className="px-6 py-5 sm:px-8">
          {/* Badge Matchday */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neon/30 bg-neon/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neon">
              <span className="h-1.5 w-1.5 rounded-full bg-neon animate-pulse" />
              Active Matchday
            </span>
            <span className="text-[11px] font-medium tracking-widest uppercase text-paper/40">
              PATC Club Circuit
            </span>
          </div>

          {/* Welcome Word */}
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-paper sm:text-3xl lg:text-4xl">
            Vamos, <span className="italic font-normal text-neon underline decoration-neon/30 decoration-2 underline-offset-8">{userName}</span> ! 🎾
          </h1>
        </div>
      </header>

      {/* Konten Utama Leaderboard */}
      <main className="relative">
        <LeaderboardPage profile={state.profile} onSignOut={signOut} />
      </main>
    </div>
  );
}

export default App;
