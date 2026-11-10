import { useState, useEffect } from 'react';
import ClubLogo from '@/components/ClubLogo';
import AuthPage from '@/components/AuthPage';
import LeaderboardPage from '@/components/LeaderboardPage';
import { PlayerCardsView } from '@/components/PlayerCardsView';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Player, Match } from '@/types/playerCard';

function App() {
  const { state, signIn, signUp, signOut } = useAuth();

  // State navigasi tampilan utama ('leaderboard' atau 'cards')
  const [currentView, setCurrentView] = useState<'leaderboard' | 'cards'>('leaderboard');
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  // Fetch data players & matches dari Supabase saat user sudah login
  useEffect(() => {
    if (state.status === 'signed-in' && state.profile) {
      async function fetchData() {
        try {
          // 1. Ambil data dari tabel players (fallback otomatis ke profiles jika tabel players belum terisi)
          const { data: playersData } = await supabase.from('players').select('*');
          if (playersData && playersData.length > 0) {
            setPlayers(playersData as Player[]);
          } else {
            const { data: profilesData } = await supabase.from('profiles').select('*');
            if (profilesData) {
              setPlayers(
                profilesData.map((p: any) => ({
                  id: p.id,
                  name: p.displayName || p.name || p.username || 'Member PATC',
                  profileId: p.id,
                  photo_url: p.photo_url || null,
                }))
              );
            }
          }

          // 2. Ambil data matches dari Supabase
          const { data: matchesData } = await supabase.from('matches').select('*');
          if (matchesData) {
            setMatches(matchesData as Match[]);
          }
        } catch (err) {
          console.error('Gagal mengambil data untuk Player Cards:', err);
        }
      }
      fetchData();
    }
  }, [state.status, state.profile]);

  // 1. TAMPILAN LOADING (EDITORIAL AMBIENT GLOW)
  if (state.status === 'loading') {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0F0402] px-4">
        {/* Ambient glow terakota */}
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

  // 3. TAMPILAN ERROR JIKA PROFIL BELUM TERDAFTAR
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

  // Fallback pengenal email/username untuk pengecekan admin
  const currentUserIdent = (state.profile as any).email || state.profile.username || '';

  // 4. TAMPILAN UTAMA (KLASMEN & PLAYER CARDS)
  return (
    <div className="min-h-screen bg-transparent text-[#FDF8F5]">
      {/* Pengalih Menu (Floating Pill Nav) */}
      <div className="fixed top-4 right-6 z-50 flex items-center gap-2 bg-black/70 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full shadow-2xl">
        <button
          type="button"
          onClick={() => setCurrentView('leaderboard')}
          className={`text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full transition-all ${
            currentView === 'leaderboard'
              ? 'bg-[#FF7A45] text-white shadow-md'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Klasemen
        </button>
        <button
          type="button"
          onClick={() => setCurrentView('cards')}
          className={`text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full transition-all ${
            currentView === 'cards'
              ? 'bg-[#FF7A45] text-white shadow-md'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Player Cards 👑
        </button>
      </div>

      {/* Render Berdasarkan View Aktif */}
      {currentView === 'leaderboard' ? (
        <LeaderboardPage profile={state.profile} onSignOut={signOut} />
      ) : (
        <PlayerCardsView
          players={players}
          matches={matches}
          currentUserEmail={currentUserIdent}
          currentUserRole={state.profile.role || 'member'}
        />
      )}
    </div>
  );
}

export default App;
