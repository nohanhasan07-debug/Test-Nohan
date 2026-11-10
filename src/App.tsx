import ClubLogo from '@/components/ClubLogo';
import AuthPage from '@/components/AuthPage';
import LeaderboardPage from '@/components/LeaderboardPage';
import { useAuth } from '@/hooks/useAuth';

function App() {
  const { state, signIn, signUp, signOut } = useAuth();

  // 1. TAMPILAN LOADING (EDITORIAL AMBIENT GLOW)
  if (state.status === 'loading') {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0F0402] px-4">
        {/* Glow ambient terakota */}
        <div className="absolute h-96 w-96 rounded-full bg-[#B84013]/20 blur-[120px] pointer-events-none" />
        <div className="relative flex flex-col items-center">
          <div className="relative mb-6">
            <div className="absolute -inset-2 rounded-full border border-[#FF7A45]/30 animate-ping opacity-25" />
            <div className="relative rounded-full border border-white/20 bg-[#1A0A06]/80 p-4 shadow-2xl backdrop-blur-xl">
              <ClubLogo className="w-20 transition-transform duration-700 hover:scale-105" />
            </div>
          </div>
          <p className="font-serif text-sm tracking-[0.4em] text-[#FF7A45] uppercase">
            Panic at the Court
          </p>
          <p className="mt-1 text-[10px] tracking-[0.3em] text-[#FDF8F5]/50 uppercase">
            Entering The Arena
          </p>
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
      <div className="flex min-h-screen items-center justify-center bg-[#0F0402] px-4">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#FF7A45]/30 bg-[#1A0A06]/90 p-8 text-center shadow-2xl backdrop-blur-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-[#FDF8F5]">
            Akun Belum Terdaftar
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#FDF8F5]/60">
            Akun Anda belum tersinkronisasi dengan master data. Silakan hubungi Master Admin klub.
          </p>
          <button
            type="button"
            onClick={signOut}
            className="mt-6 w-full rounded-full border border-white/20 bg-white/5 py-3 text-xs uppercase tracking-widest text-[#FDF8F5] transition hover:bg-white/10"
          >
            Keluar Aplikasi
          </button>
        </div>
      </div>
    );
  }

  // 4. TAMPILAN UTAMA
  return (
    <div className="min-h-screen bg-transparent text-[#FDF8F5]">
      <LeaderboardPage profile={state.profile} onSignOut={signOut} />
    </div>
  );
}

export default App;
