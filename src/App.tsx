import { useState, useEffect } from 'react';
import ClubLogo from '@/components/ClubLogo';
import AuthPage from '@/components/AuthPage';
import LeaderboardPage from '@/components/LeaderboardPage';
import { PlayerCardsView } from '@/components/PlayerCardsView';
import { useAuth } from '@/hooks/useAuth';
import { fetchPlayers, fetchMatches } from '@/lib/clubData';
import { Player, Match } from '@/types/playerCard';

function App() {
  const { state, signIn, signUp, signOut } = useAuth();

  const [currentView, setCurrentView] = useState<'leaderboard' | 'cards'>('leaderboard');
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    if (state.status === 'signed-in' && state.profile) {
      async function syncData() {
        try {
          const [loadedPlayers, loadedMatches] = await Promise.all([
            fetchPlayers(),
            fetchMatches(),
          ]);
          setPlayers(loadedPlayers as any);
          setMatches(loadedMatches as any);
        } catch (err) {
          console.error('Gagal sinkronisasi data klub:', err);
        }
      }
      void syncData();
    }
  }, [state.status, state.profile, currentView]);

  if (state.status === 'loading') {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0F0402] px-4">
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

  if (state.status === 'signed-out') {
    return <AuthPage onSignIn={signIn} onSignUp={signUp} />;
  }

  if (!state.profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F0402] px-4">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#FF7A45]/30 bg-[#1A0A06]/90 p-8 text-center shadow-2xl backdrop-blur-2xl">
          <h2 className="font-serif text-2xl font-bold tracking-tight text-[#FDF8F5]">
            Akun Belum Terdaftar
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#FDF8F5]/60">
            Akun Anda belum tersinkronisasi. Silakan hubungi Master Admin.
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

  const currentUserIdent = (state.profile as any).email || state.profile.username || '';

  return (
    <div className="min-h-screen bg-transparent text-[#FDF8F5]">
      {/* Tombol Tab Navigasi */}
      <div className="fixed top-4 right-6 z-50 flex items-center gap-2 bg-black/80 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full shadow-2xl">
        <button
          type="button"
          onClick={() => setCurrentView('leaderboard')}
          style={
            currentView === 'leaderboard'
              ? { backgroundColor: '#FF7A45', color: '#FFFFFF' }
              : { color: 'rgba(255, 255, 255, 0.7)' }
          }
          className="text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full transition-all"
        >
          Klasemen
        </button>
        <button
          type="button"
          onClick={() => setCurrentView('cards')}
          style={
            currentView === 'cards'
              ? { backgroundColor: '#FF7A45', color: '#FFFFFF' }
              : { color: 'rgba(255, 255, 255, 0.7)' }
          }
          className="text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full transition-all"
        >
          Player Cards 👑
        </button>
      </div>

      {currentView === 'leaderboard' ? (
        <LeaderboardPage profile={state.profile} onSignOut={signOut} />
      ) : (
        <PlayerCardsView
          players={players}
          matches={matches}
          currentUserEmail={currentUserIdent}
          currentUserRole={state.profile.role || 'member'}
          currentUserId={state.profile.id}
          currentUsername={state.profile.username}
        />
      )}
    </div>
  );
}

export default App;
