import React, { useState, useMemo, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Player, Match } from '../types/playerCard';
import { PlayerCard } from './PlayerCard';
import { AdminPhotoUploadModal } from './AdminPhotoUploadModal';
import { fetchPlayers, fetchMatches } from '@/lib/clubData';

interface PlayerCardsViewProps {
  players: Player[];
  matches: Match[];
  currentUserEmail?: string;
  currentUserRole?: string;
}

export const PlayerCardsView: React.FC<PlayerCardsViewProps> = ({
  players = [],
  matches = [],
  currentUserEmail = '',
  currentUserRole = 'member',
}) => {
  const [selectedPlayerForEdit, setSelectedPlayerForEdit] = useState<Player | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [playerList, setPlayerList] = useState<Player[]>(players);
  const [matchList, setMatchList] = useState<Match[]>(matches);
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);

  const storyExportRef = useRef<HTMLDivElement>(null);

  // Tarik data terbaru jika props berubah atau saat pertama kali dibuka
  useEffect(() => {
    async function refreshLocalData() {
      try {
        const [latestPlayers, latestMatches] = await Promise.all([
          fetchPlayers(),
          fetchMatches(),
        ]);
        if (latestPlayers && latestPlayers.length > 0) setPlayerList(latestPlayers as any);
        if (latestMatches) setMatchList(latestMatches as any);
      } catch (err) {
        console.warn('Gagal refresh data di PlayerCardsView:', err);
      }
    }
    void refreshLocalData();
  }, [players, matches]);

  const isMasterAdmin =
    currentUserRole === 'master' ||
    currentUserRole === 'admin' ||
    currentUserEmail.toLowerCase().includes('admin');

  // Nama Bulan Berjalan
  const currentMonthName = useMemo(() => {
    return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date());
  }, []);

  // 1. HITUNG STATISTIK BULAN BERJALAN DARI SEMUA MATCH
  const monthlyStatsMap = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0 = Jan, 10 = Nov, dst

    // Filter match yang HANYA berlangsung di bulan ini
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

  // 2. PERHITUNGAN PLAYER OF THE MONTH (BERDASARKAN JUMLAH TANDING + WINRATE)
  const rankedMonthlyPlayers = useMemo(() => {
    const list = playerList.map((player) => {
      const s = monthlyStatsMap[player.id] || { total: 0, wins: 0, losses: 0 };
      const winRate = s.total > 0 ? (s.wins / s.total) * 100 : 0;

      // FORMULA POTM KEAKTIFAN & KUALITAS:
      // Poin = (Menang * 30) + (Total Match * 10) + (Win Rate * 0.5)
      // Semakin sering tanding dan menang, peluang juara POTM semakin tinggi!
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

  // Juara POTM adalah peringkat 1 yang sudah minimal bermain 1 pertandingan
  const potmCandidate =
    rankedMonthlyPlayers.find((p) => p.totalMatches > 0) || rankedMonthlyPlayers[0] || null;

  // 3. GENERATE BANNER STORY IG
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

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#B84013] via-[#4A1504] to-[#0F0402] text-[#FDF8F5] px-4 py-8 md:py-12 overflow-hidden">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF5500]/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        {/* HEADER UTAMA */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#FF7A45] animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-[#FF7A45] uppercase font-bold">
              PATC OFFICIAL ROSTER
            </span>
          </div>
          <h1 style={{ color: '#FFFFFF' }} className="text-4xl sm:text-5xl font-black tracking-tight uppercase">
            PLAYER <span style={{ color: '#FF7A45' }}>CARDS</span>
          </h1>
          <p style={{ color: 'rgba(253, 248, 245, 0.75)' }} className="text-xs sm:text-sm max-w-md mx-auto">
            Statistik performa bulanan dan kartu resmi anggota Panic at the Court.
          </p>
        </div>

        {/* CARD PLAYER OF THE MONTH (POTM) */}
        {potmCandidate && (
          <div className="relative flex flex-col items-center">
            <div className="absolute -inset-4 bg-[#FF5500]/25 rounded-full blur-[90px] pointer-events-none" />

            <div className="w-full max-w-sm sm:max-w-md bg-black/70 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-2xl relative">
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
                onEditPhoto={() => {
                  setSelectedPlayerForEdit(potmCandidate.player);
                  setIsUploadModalOpen(true);
                }}
              />

              <div className="mt-4 text-center">
                <p style={{ color: 'rgba(253, 248, 245, 0.7)' }} className="text-[11px] font-medium">
                  {potmCandidate.totalMatches > 0
                    ? `Memimpin dengan ${potmCandidate.totalMatches} pertandingan & ${potmCandidate.wins} kemenangan.`
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
            {rankedMonthlyPlayers.map(({ player, totalMatches, winRate }) => (
              <PlayerCard
                key={player.id}
                player={player}
                matchesCount={totalMatches}
                winRate={winRate}
                isPOTM={potmCandidate?.player.id === player.id && totalMatches > 0}
                isAdmin={isMasterAdmin}
                onEditPhoto={() => {
                  setSelectedPlayerForEdit(player);
                  setIsUploadModalOpen(true);
                }}
              />
            ))}
          </div>
        </div>
      </div>

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
