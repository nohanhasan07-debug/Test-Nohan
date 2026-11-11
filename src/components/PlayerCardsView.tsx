import React, { useState, useMemo, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { X } from 'lucide-react';
import { Player, Match } from '../types/playerCard';
import { PlayerCard } from './PlayerCard';
import { AdminPhotoUploadModal } from './AdminPhotoUploadModal';
import { fetchPlayers, fetchMatches } from '@/lib/clubData';

interface PlayerCardsViewProps {
  players: Player[];
  matches: Match[];
  currentUserEmail?: string;
  currentUserRole?: string;
  currentUserId?: string;
  currentUsername?: string;
}

export const PlayerCardsView: React.FC<PlayerCardsViewProps> = ({
  players = [],
  matches = [],
  currentUserEmail = '',
  currentUserRole = 'member',
  currentUserId = '',
  currentUsername = '',
}) => {
  const [selectedPlayerForEdit, setSelectedPlayerForEdit] = useState<Player | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [playerList, setPlayerList] = useState<Player[]>(players);
  const [matchList, setMatchList] = useState<Match[]>(matches);
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);

  const [focusedPlayer, setFocusedPlayer] = useState<{
    player: Player;
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
    isPOTM: boolean;
  } | null>(null);

  const storyExportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocusedPlayer(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    async function refreshData() {
      try {
        const [latestPlayers, latestMatches] = await Promise.all([
          fetchPlayers(),
          fetchMatches(),
        ]);
        if (latestPlayers && latestPlayers.length > 0) setPlayerList(latestPlayers as any);
        if (latestMatches) setMatchList(latestMatches as any);
      } catch (err) {
        console.warn('Gagal sinkron data:', err);
      }
    }
    void refreshData();
  }, [players, matches]);

  const isMasterAdmin =
    currentUserRole === 'master' ||
    currentUserRole === 'admin' ||
    currentUserEmail.toLowerCase().includes('admin');

  // Helper untuk cek apakah suatu kartu adalah milik akun yang sedang login
  const isCurrentPlayer = (p: Player) => {
    if (currentUserId && (p.id === currentUserId || (p as any).profileId === currentUserId)) return true;
    if (currentUsername && p.name.toLowerCase() === currentUsername.toLowerCase()) return true;
    return false;
  };

  const currentMonthName = useMemo(() => {
    return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date());
  }, []);

  // 1. STATISTIK PERFORMA BULAN BERJALAN
  const monthlyStatsMap = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const currentMonthMatches = matchList.filter((m: any) => {
      const dateStr = m.date || m.match_date || m.created_at || '';
      if (!dateStr) return false;
      const d = new Date(dateStr);
      const isThisMonth = d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      const isApproved = m.status ? m.status === 'approved' : true;
      return isThisMonth && isApproved;
    });

    const stats: Record<string, { total: number; wins: number; losses: number }> = {};

    playerList.forEach((p) => {
      stats[p.id] = { total: 0, wins: 0, losses: 0 };
    });

    currentMonthMatches.forEach((match: any) => {
      const teamA = match.teamA || match.team_a || [];
      const teamB = match.teamB || match.team_b || [];
      const gamesA = Number(match.gamesA ?? match.games_a ?? 0);
      const gamesB = Number(match.gamesB ?? match.games_b ?? 0);

      const isWonA = gamesA > gamesB;
      const isWonB = gamesB > gamesA;

      teamA.forEach((id: string) => {
        if (!stats[id]) stats[id] = { total: 0, wins: 0, losses: 0 };
        stats[id].total += 1;
        if (isWonA) stats[id].wins += 1;
        else if (isWonB) stats[id].losses += 1;
      });

      teamB.forEach((id: string) => {
        if (!stats[id]) stats[id] = { total: 0, wins: 0, losses: 0 };
        stats[id].total += 1;
        if (isWonB) stats[id].wins += 1;
        else if (isWonA) stats[id].losses += 1;
      });
    });

    return stats;
  }, [playerList, matchList]);

  // 2. FORMULA POTM KEAKTIFAN & WINRATE
  const rankedMonthlyPlayers = useMemo(() => {
    const list = playerList.map((player) => {
      const s = monthlyStatsMap[player.id] || { total: 0, wins: 0, losses: 0 };
      const winRate = s.total > 0 ? (s.wins / s.total) * 100 : 0;
      const potmScore = (s.wins * 30) + (s.total * 10) + (winRate * 0.5);

      return {
        player,
        totalMatches: s.total,
        wins: s.wins,
        losses: s.losses,
        winRate,
        potmScore,
      };
    });

    return list.sort((a, b) => {
      if (b.potmScore !== a.potmScore) return b.potmScore - a.potmScore;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.totalMatches !== a.totalMatches) return b.totalMatches - a.totalMatches;
      return a.player.name.localeCompare(b.player.name);
    });
  }, [playerList, monthlyStatsMap]);

  const potmCandidate =
    rankedMonthlyPlayers.find((p) => p.totalMatches > 0) || rankedMonthlyPlayers[0] || null;

  // 3. GENERATE IG STORY
  const handleGenerateStoryBanner = async () => {
    if (!storyExportRef.current || !potmCandidate) return;

    try {
      setIsGeneratingBanner(true);
      const canvas = await html2canvas(storyExportRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#0F0402',
        logging: false,
      });

      const image = canvas.toDataURL('image/png');
      const now = new Date();
      const monthYearStr = `${now.toLocaleString('default', { month: 'short' })}_${now.getFullYear()}`.toUpperCase();
      const cleanPlayerName = potmCandidate.player.name.replace(/\s+/g, '_').toUpperCase();
      const fileName = `POTM_${cleanPlayerName}_${monthYearStr}.png`;

      const link = document.createElement('a');
      link.href = image;
      link.download = fileName;
      link.click();
    } catch (error) {
      console.error('Gagal generate banner:', error);
      alert('Terjadi kesalahan saat membuat banner.');
    } finally {
      setIsGeneratingBanner(false);
    }
  };

  const handlePhotoUpdateSuccess = (updatedPlayer: Player) => {
    setPlayerList((prev) =>
      prev.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p))
    );
  };

  // Partikel Bara Api Live
  const embers = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      left: `${(i * 4.2 + (i % 3) * 2)}%`,
      delay: `${(i * 0.4) % 6}s`,
      duration: `${5 + ((i * 1.3) % 4)}s`,
      size: `${3 + (i % 4)}px`,
      drift: `${(i % 2 === 0 ? 1 : -1) * (20 + (i % 30))}px`,
    }));
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#B84013] via-[#4A1504] to-[#0F0402] text-[#FDF8F5] px-4 py-8 md:py-12 overflow-hidden">
      {/* ANIMASI LIVE API */}
      <style>{`
        @keyframes riseEmber {
          0% { transform: translateY(105vh) translateX(0) scale(1); opacity: 0; }
          15% { opacity: 0.9; }
          85% { opacity: 0.6; }
          100% { transform: translateY(-10vh) translateX(var(--drift)) scale(0.2); opacity: 0; }
        }
        @keyframes flameFlicker {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(1.08); }
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {embers.map((e) => (
          <span
            key={e.id}
            style={
              {
                left: e.left,
                width: e.size,
                height: e.size,
                animation: `riseEmber ${e.duration} linear infinite`,
                animationDelay: e.delay,
                '--drift': e.drift,
                backgroundColor: e.id % 2 === 0 ? '#FF5500' : '#FFAA00',
                boxShadow: '0 0 10px #FF5500, 0 0 20px #FF7A45',
              } as React.CSSProperties
            }
            className="absolute bottom-0 rounded-full"
          />
        ))}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-96 bg-gradient-to-t from-[#FF4500]/25 via-[#B84013]/15 to-transparent blur-3xl animate-[flameFlicker_4s_ease-in-out_infinite]" />
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF5500]/20 rounded-full blur-[140px] pointer-events-none" />

      {/* KONTEN */}
      <div className={`max-w-6xl mx-auto space-y-12 relative z-10 transition-all duration-300 ${focusedPlayer ? 'filter blur-sm pointer-events-none' : ''}`}>
        {/* HEADER */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#FF7A45] animate-ping" />
            <span style={{ color: '#FF7A45' }} className="text-[11px] font-mono tracking-widest uppercase font-bold">
              PATC OFFICIAL ROSTER 🔥
            </span>
          </div>
          <h1 style={{ color: '#FFFFFF' }} className="text-4xl sm:text-5xl font-black tracking-tight uppercase">
            PLAYER <span style={{ color: '#FF7A45' }}>CARDS</span>
          </h1>
          <p style={{ color: 'rgba(253, 248, 245, 0.75)' }} className="text-xs sm:text-sm max-w-md mx-auto">
            Pasang foto profilmu di kartu pemain. Tekan kartu pemain untuk melihat detail statistik.
          </p>
        </div>

        {/* CARD POTM */}
        {potmCandidate && (
          <div className="relative flex flex-col items-center">
            <div className="absolute -inset-4 bg-[#FF5500]/30 rounded-full blur-[100px] pointer-events-none animate-pulse" />

            <div className="w-full max-w-sm sm:max-w-md bg-black/75 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-2xl relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <h2 style={{ color: '#FFFFFF' }} className="text-sm font-black uppercase tracking-wider">
                      PLAYER OF THE MONTH
                    </h2>
                    <p style={{ color: '#FF7A45' }} className="text-[10px] font-mono font-bold uppercase">
                      PERIODE: {currentMonthName}
                    </p>
                  </div>
                </div>

                {isMasterAdmin && (
                  <button
                    type="button"
                    onClick={handleGenerateStoryBanner}
                    disabled={isGeneratingBanner}
                    style={{ background: 'linear-gradient(to right, #B84013, #FF7A45)', color: '#FFFFFF' }}
                    className="flex items-center gap-1.5 hover:brightness-110 active:scale-95 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg transition-all"
                  >
                    <span>📸</span>
                    <span>{isGeneratingBanner ? 'RENDERING...' : 'GENERATE STORY IG'}</span>
                  </button>
                )}
              </div>

              <PlayerCard
                player={potmCandidate.player}
                matchesCount={potmCandidate.totalMatches}
                winRate={potmCandidate.winRate}
                isPOTM={true}
                isAdmin={isMasterAdmin}
                isOwner={isCurrentPlayer(potmCandidate.player)}
                onClick={() =>
                  setFocusedPlayer({
                    player: potmCandidate.player,
                    totalMatches: potmCandidate.totalMatches,
                    wins: potmCandidate.wins,
                    losses: potmCandidate.losses,
                    winRate: potmCandidate.winRate,
                    isPOTM: true,
                  })
                }
                onEditPhoto={() => {
                  setSelectedPlayerForEdit(potmCandidate.player);
                  setIsUploadModalOpen(true);
                }}
              />

              <div className="mt-4 text-center">
                <p style={{ color: 'rgba(253, 248, 245, 0.75)' }} className="text-[11px] font-medium">
                  {potmCandidate.totalMatches > 0
                    ? `👑 Memimpin dengan ${potmCandidate.totalMatches} pertandingan & ${potmCandidate.wins} kemenangan.`
                    : 'Belum ada pertandingan di bulan ini. Jadilah yang pertama tanding!'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* DAFTAR SEMUA MEMBER */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/15 pb-4">
            <div>
              <h2 style={{ color: '#FFFFFF' }} className="text-2xl font-black uppercase tracking-wide">
                ALL PATC MEMBERS
              </h2>
              <p style={{ color: '#FF7A45' }} className="text-xs font-bold mt-0.5">
                Total {playerList.length} Pemain Terdaftar
              </p>
            </div>
            {isMasterAdmin && (
              <span style={{ color: '#FF7A45', backgroundColor: 'rgba(255, 122, 69, 0.15)', borderColor: 'rgba(255, 122, 69, 0.4)' }} className="text-[10px] font-mono border px-3 py-1 rounded-full uppercase font-bold">
                ADMIN ACCESS ACTIVE
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {rankedMonthlyPlayers.map(({ player, totalMatches, wins, losses, winRate }) => {
              const isPOTM = potmCandidate?.player.id === player.id && totalMatches > 0;
              const isOwner = isCurrentPlayer(player);

              return (
                <PlayerCard
                  key={player.id}
                  player={player}
                  matchesCount={totalMatches}
                  winRate={winRate}
                  isPOTM={isPOTM}
                  isAdmin={isMasterAdmin}
                  isOwner={isOwner}
                  onClick={() =>
                    setFocusedPlayer({
                      player,
                      totalMatches,
                      wins,
                      losses,
                      winRate,
                      isPOTM,
                    })
                  }
                  onEditPhoto={() => {
                    setSelectedPlayerForEdit(player);
                    setIsUploadModalOpen(true);
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL ZOOM-IN FOCUS CARD */}
      {focusedPlayer && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setFocusedPlayer(null)}
        >
          <div
            className="relative w-full max-w-[320px] sm:max-w-[360px] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -inset-8 bg-[#FF5500]/35 rounded-full blur-[90px] animate-pulse pointer-events-none" />

            <button
              type="button"
              onClick={() => setFocusedPlayer(null)}
              style={{
                color: '#FFFFFF',
                backgroundColor: 'rgba(255, 122, 69, 0.3)',
                borderColor: '#FF7A45',
              }}
              className="absolute -top-12 right-0 flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold transition-all hover:bg-[#FF7A45] hover:text-black shadow-lg"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="w-full transform scale-105 transition-all duration-300 shadow-[0_0_60px_rgba(255,100,0,0.5)] rounded-3xl overflow-hidden border-2 border-[#FF7A45]">
              <PlayerCard
                player={focusedPlayer.player}
                matchesCount={focusedPlayer.totalMatches}
                winRate={focusedPlayer.winRate}
                isPOTM={focusedPlayer.isPOTM}
                isAdmin={isMasterAdmin}
                isOwner={isCurrentPlayer(focusedPlayer.player)}
                onEditPhoto={() => {
                  setSelectedPlayerForEdit(focusedPlayer.player);
                  setIsUploadModalOpen(true);
                }}
              />
            </div>

            <div className="mt-5 flex items-center justify-center gap-4 bg-black/80 border border-white/20 px-6 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md">
              <div className="text-center">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#4ADE80]">Menang</span>
                <span style={{ color: '#FFFFFF' }} className="font-mono text-base font-extrabold">{focusedPlayer.wins}</span>
              </div>
              <span className="h-6 w-px bg-white/20" />
              <div className="text-center">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#F87171]">Kalah</span>
                <span style={{ color: '#FFFFFF' }} className="font-mono text-base font-extrabold">{focusedPlayer.losses}</span>
              </div>
              <span className="h-6 w-px bg-white/20" />
              <div className="text-center">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#FF7A45]">Win Rate</span>
                <span style={{ color: '#FF7A45' }} className="font-mono text-base font-extrabold">{focusedPlayer.winRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTAINER EXPORT IG STORY (9:16) */}
      {potmCandidate && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} className="pointer-events-none">
          <div
            ref={storyExportRef}
            className="w-[1080px] h-[1920px] bg-gradient-to-b from-[#B84013] via-[#4A1504] to-[#0F0402] flex flex-col justify-between items-center p-20 text-[#FDF8F5] relative overflow-hidden"
          >
            <div className="w-full flex flex-col items-center text-center space-y-4 z-10 pt-10">
              <span className="font-serif font-black text-3xl tracking-[0.2em] text-[#FDF8F5]">
                PANIC AT THE COURT
              </span>
              <h1 className="text-6xl font-black uppercase tracking-wider text-white">
                PLAYER OF THE MONTH
              </h1>
              <span className="text-2xl font-mono uppercase tracking-[0.3em] text-[#FF7A45] font-bold">
                {currentMonthName}
              </span>
            </div>

            <div className="w-[780px] aspect-square z-10 shadow-[0_0_80px_rgba(255,122,69,0.4)] rounded-3xl overflow-hidden border-2 border-white/30">
              <PlayerCard
                player={potmCandidate.player}
                matchesCount={potmCandidate.totalMatches}
                winRate={potmCandidate.winRate}
                isPOTM={true}
                isAdmin={false}
                className="w-full h-full text-2xl"
              />
            </div>

            <div className="w-full flex flex-col items-center text-center space-y-4 z-10 pb-12">
              <h2 className="text-5xl font-black italic text-white">
                VAMOS <span className="text-[#FF7A45]">{potmCandidate.player.name.toUpperCase()}</span>!
              </h2>
              <span className="text-2xl font-mono tracking-widest text-[#FF7A45]">
                @PATCTENNIS
              </span>
            </div>
          </div>
        </div>
      )}

      {selectedPlayerForEdit && (
        <AdminPhotoUploadModal
          player={selectedPlayerForEdit}
          isOpen={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            setSelectedPlayerForEdit(null);
          }}
          onSuccess={handlePhotoUpdateSuccess}
        />
      )}
    </div>
  );
};
