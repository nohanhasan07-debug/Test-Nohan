import ClubLogo from '@/components/ClubLogo';
import LoginPage from '@/components/LoginPage';
import LeaderboardPage from '@/components/LeaderboardPage';
import { secondaryButtonClass } from '@/components/formStyles';
import { useAuth } from '@/hooks/useAuth';

function App() {
  const { state, signIn, signOut } = useAuth();

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <ClubLogo className="w-28 animate-pulse ring-4 ring-gold" />
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-maroon-dark/75">Memuat...</p>
      </div>
    );
  }

  if (state.status === 'signed-out') {
    return <LoginPage onSignIn={signIn} />;
  }

  if (!state.profile) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border-2 border-clay/40 bg-cream p-6 text-center shadow-lg">
          <p className="font-display text-xl font-bold">Akun belum terdaftar</p>
          <p className="mt-2 text-sm text-maroon-dark/75">
            Akun Anda belum lengkap atau tidak bisa dimuat. Hubungi master admin klub.
          </p>
          <button type="button" onClick={signOut} className={`${secondaryButtonClass} mt-5`}>
            Keluar
          </button>
        </div>
      </div>
    );
  }

  return <LeaderboardPage profile={state.profile} onSignOut={signOut} />;
}

export default App;
