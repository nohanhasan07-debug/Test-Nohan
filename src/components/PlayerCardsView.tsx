import React, { useState, useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Player, Match, PlayerMonthlyStats } from '../types/playerCard';
import { PlayerCard } from './PlayerCard';
import { AdminPhotoUploadModal } from './AdminPhotoUploadModal';

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
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);

  // Ref container tersembunyi khusus render Story IG 9:16
  const storyExportRef = useRef<HTMLDivElement>(null);

  // Verifikasi Role Master Admin
  const isMasterAdmin =
    currentUserRole === 'admin' ||
    currentUserEmail.toLowerCase().includes('admin') ||
    currentUserEmail.toLowerCase().endsWith('@admin');

  // --- 1. OTOMATISASI BULAN BERJALAN & KALKULASI WIN RATE ---
  const currentMonthName = useMemo(() => {
    return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date());
  }, []);

  const monthlyStatsMap = useMemo(() => {
    const now = new Date();
    // Rentang tanggal 1 s/d hari terakhir bulan ini
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Filter match yang HANYA berlangsung di bulan ini
    const currentMonthMatches = matches.filter((m) => {
      const matchDate = new Date(m.date || m.created_at || '');
      return matchDate >= startOfMonth && matchDate <= endOfMonth;
    });

    const stats: Record<string, { total: number; wins: number; losses: number }> = {};

    // Inisialisasi seluruh pemain
    playerList.forEach((p) => {
      stats[p.id] = { total: 0, wins: 0, losses: 0 };
    });

    // Kalkulasi hasil match
    currentMonthMatches.forEach((match) => {
      const team1 = [match.team1_player1_id, match.team1_player2_id].filter(Boolean) as string[];
      const team2 = [match.team2_player1_id, match.team2_player2_id].filter(Boolean) as string[];

      team1.forEach((id) => {
        if (!stats[id]) stats[id] = { total: 0, wins: 0, losses: 0 };
        stats[id].total += 1;
        if (match.winner_team === 1) stats[id].wins += 1;
        else stats[id].losses += 1;
      });

      team2.forEach((id) => {
        if (!stats[id]) stats[id] = { total: 0, wins: 0, losses: 0 };
        stats[id].total += 1;
        if (match.winner_team === 2) stats[id].wins += 1;
        else stats[id].losses += 1;
      });
    });

    return stats;
  }, [playerList, matches]);

  // Ranking pemain bulan berjalan
  const rankedMonthlyPlayers: PlayerMonthlyStats[] = useMemo(() => {
    const list = playerList.map((player) => {
      const s = monthlyStatsMap[player.id] || { total: 0, wins: 0, losses: 0 };
      const winRate = s.total > 0 ? (s.wins / s.total) * 100 : 0;
      return {
        player,
        totalMatches: s.total,
        wins: s.wins,
        losses: s.losses,
        winRate,
      };
    });

    // Urutkan: Win Rate tertinggi -> Total Matches terbanyak -> Nama
    return list.sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.totalMatches !== a.totalMatches) return b.totalMatches - a.totalMatches;
      return a.player.name.localeCompare(b.player.name);
    });
  }, [playerList, monthlyStatsMap]);

  // Player of the Month adalah ranking #1
  const potmCandidate = rankedMonthlyPlayers[0] || null;

  // --- 2. FITUR GENERATE BANNER IG STORY (9:16 HIGH RESOLUTION) ---
  const handleGenerateStoryBanner = async () => {
    if (!storyExportRef.current || !potmCandidate) return;

    try {
      setIsGeneratingBanner(true);

      const canvas = await html2canvas(storyExportRef.current, {
        scale: 3, // Skala 3x untuk hasil tajam di Instagram
        useCORS: true,
        backgroundColor: '#0F0402',
        logging: false,
      });

      const image = canvas.toDataURL('image/png');
      const now = new Date();
      const monthYearStr = `${now.toLocaleString('default', { month: 'short' })}_${now.getFullYear()}`.toUpperCase();
      const cleanPlayerName = potmCandidate.player.name.replace(/\s+/g, '_').toUpperCase();
      const fileName = `POTM_${cleanPlayerName}_${monthYearStr}.png`;

      // Trigger download otomatis
      const link = document.createElement('a');
      link.href = image;
      link.download = fileName;
      link.click();
    } catch (error) {
      console.error('Gagal generate banner:', error);
      alert('Terjadi kesalahan saat membuat banner. Periksa izin CORS foto.');
    } finally {
      setIsGeneratingBanner(false);
    }
  };

  // Callback update foto setelah sukses diupload
  const handlePhotoUpdateSuccess = (updatedPlayer: Player) => {
    setPlayerList((prev) =>
      prev.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p))
    );
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#B84013] via-[#4A1504] to-[#0F0402] text-[#FDF8F5] px-4 py-8 md:py-12 overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF5500]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-80 h-80 bg-[#B84013]/25 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        {/* --- HEADER TITLE --- */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#FF7A45]" />
            <span className="text-[11px] font-mono tracking-widest text-[#FF7A45] uppercase">
              PATC OFFICIAL ROSTER
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white uppercase">
            PLAYER <span className="text-[#FF7A45]">CARDS</span>
          </h1>
          <p className="text-xs sm:text-sm text-white/70 max-w-md mx-auto">
            Statistik performa bulanan dan kartu resmi anggota Panic at the Court.
          </p>
        </div>

        {/* --- SECTION 1: HERO POTM (PLAYER OF THE MONTH) --- */}
        {potmCandidate && (
          <div className="relative flex flex-col items-center">
            {/* Ambient Glow Khusus POTM */}
            <div className="absolute -inset-4 bg-[#FF5500]/25 rounded-full blur-[90px] pointer-events-none" />

            <div className="w-full max-w-sm sm:max-w-md bg-black/40 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-2xl relative">
              {/* Header Box POTM */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏆</span>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">
                      PLAYER OF THE MONTH
                    </h2>
                    <p className="text-[10px] font-mono text-[#FF7A45] uppercase">
                      PERIODE: {currentMonthName}
                    </p>
                  </div>
                </div>

                {/* Tombol Generate Banner IG (HANYA UNTUK ADMIN) */}
                {isMasterAdmin && (
                  <button
                    type="button"
                    onClick={handleGenerateStoryBanner}
                    disabled={isGeneratingBanner}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-[#B84013] to-[#FF5500] hover:brightness-110 active:scale-95 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg transition-all"
                  >
                    <span>📸</span>
                    <span>{isGeneratingBanner ? 'RENDERING...' : 'GENERATE BANNER IG'}</span>
                  </button>
                )}
              </div>

              {/* Kartu POTM */}
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
                <p className="text-[11px] text-white/60">
                  Otomatis terkunci setiap akhir bulan pukul 23:59:59 WIB berdasarkan Win Rate tertinggi.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --- SECTION 2: GRID ALL PLAYER CARDS --- */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-white">
                ALL PATC MEMBERS
              </h2>
              <p className="text-xs text-white/60">Total {playerList.length} Pemain Terdaftar</p>
            </div>
            {isMasterAdmin && (
              <span className="text-[10px] font-mono text-[#FF7A45] bg-[#FF7A45]/10 border border-[#FF7A45]/30 px-2.5 py-1 rounded-full uppercase">
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
                isPOTM={potmCandidate?.player.id === player.id}
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

      {/* --- HIDDEN 9:16 INSTAGRAM STORY CONTAINER (UNTUK html2canvas) --- */}
      {potmCandidate && (
        <div
          style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}
          className="pointer-events-none"
        >
          <div
            ref={storyExportRef}
            className="w-[1080px] h-[1920px] bg-gradient-to-b from-[#B84013] via-[#4A1504] to-[#0F0402] flex flex-col justify-between items-center p-20 text-[#FDF8F5] relative overflow-hidden"
          >
            {/* Background Decorative Circles */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#FF5500]/25 rounded-full blur-[140px]" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#B84013]/40 rounded-full blur-[120px]" />

            {/* Story Top Header */}
            <div className="w-full flex flex-col items-center text-center space-y-4 z-10 pt-10">
              <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl px-8 py-3 rounded-full border border-white/20">
                <div className="w-4 h-4 rounded-full bg-[#FF7A45] animate-ping" />
                <span className="font-serif font-black text-2xl tracking-[0.2em] text-[#FDF8F5]">
                  PANIC AT THE COURT
                </span>
              </div>
              <h1 className="text-6xl font-black uppercase tracking-wider text-white drop-shadow-lg">
                PLAYER OF THE MONTH
              </h1>
              <div className="px-6 py-2 bg-[#FF7A45]/20 border border-[#FF7A45]/40 rounded-full">
                <span className="text-2xl font-mono uppercase tracking-[0.3em] text-[#FF7A45] font-bold">
                  {currentMonthName}
                </span>
              </div>
            </div>

            {/* Story Center: Card 1:1 High Res */}
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

            {/* Story Footer */}
            <div className="w-full flex flex-col items-center text-center space-y-4 z-10 pb-12">
              <h2 className="text-5xl font-black italic tracking-wide text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
                VAMOS <span className="text-[#FF7A45]">{potmCandidate.player.name.toUpperCase()}</span>!
              </h2>
              <p className="text-xl font-mono tracking-[0.4em] uppercase text-white/70">
                CONGRATULATIONS & KEEP THE FLAME ALIVE
              </p>
              <span className="text-2xl font-mono tracking-widest text-[#FF7A45]">
                @PATCTENNIS
              </span>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL UPLOAD FOTO ADMIN --- */}
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
