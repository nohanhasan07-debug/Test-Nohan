import { useEffect, useMemo, useState } from 'react';
import { Menu, Plus, Flame, Crown } from 'lucide-react';
import ApprovalsView from '@/components/ApprovalsView';
import DailyRecap from '@/components/DailyRecap';
import HeadToHeadView from '@/components/HeadToHeadView';
import MatchFormModal from '@/components/MatchFormModal';
import MatchHistoryView from '@/components/MatchHistoryView';
import MySubmissionsCard from '@/components/MySubmissionsCard';
import PerformancePage from '@/components/PerformancePage';
import SettingsModal from '@/components/SettingsModal';
import Sidebar, { type AppView } from '@/components/Sidebar';
import WinRateView from '@/components/WinRateView';
import { useClubData } from '@/hooks/useClubData';
import { getErrorMessage } from '@/lib/errors';
import { computePlayerForm } from '@/lib/form';
import { getMonthKey, getSeasonKey, getSeasonLabel, toIsoDate } from '@/lib/date';
import {
  computeStats,
  findPlayerOfMonth,
  getArchiveSeasons,
  matchesInView,
  sortByWinRate,
  sortStandings,
  type SeasonView,
} from '@/lib/stats';
import type { LeaderboardTab, Match, MatchInput, Profile } from '@/types';

interface LeaderboardPageProps {
  profile: Profile;
  onSignOut: () => void;
}

export default function LeaderboardPage({ profile, onSignOut }: LeaderboardPageProps) {
  const {
    players,
    matches,
    reviewMatches,
    loaded,
    loadError,
    reload,
    saveMatch,
    approveOrRejectMatch,
    deleteMatch,
  } = useClubData();

  const isMaster = profile.role === 'master';
  const pendingMatches = useMemo(() => reviewMatches.filter((m) => m.status === 'pending'), [reviewMatches]);
  const mySubmissions = useMemo(
    () => reviewMatches.filter((m) => m.createdBy === profile.id),
    [reviewMatches, profile.id],
  );

  const [view, setView] = useState<AppView>('leaderboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tab, setTab] = useState<LeaderboardTab>('standings');
  const [standingsMode, setStandingsMode] = useState<'overall' | 'daily'>('overall');
  const [dailyDate, setDailyDate] = useState('');
  const [seasonMode, setSeasonMode] = useState<'active' | 'all'>('active');
  const [formState, setFormState] = useState<{ match?: Match } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);

  const todayIso = toIsoDate(new Date());
  const activeKey = getSeasonKey(todayIso);
  const monthKey = getMonthKey(todayIso);
  const activeSeasonLabel = getSeasonLabel(activeKey);

  const dailyDates = useMemo(
    () => [...new Set(matches.map((m) => m.date))].sort((a, b) => b.localeCompare(a)),
    [matches],
  );

  useEffect(() => {
    if (!dailyDate && dailyDates.length > 0) setDailyDate(dailyDates[0]);
  }, [dailyDate, dailyDates]);

  const archiveSeasons = getArchiveSeasons(matches, activeKey);
  const seasonView: SeasonView =
    seasonMode === 'all' ? { kind: 'all' } : { kind: 'season', key: activeKey };

  const viewMatches = matchesInView(matches, seasonView);
  const standings = sortStandings(computeStats(players, viewMatches));
  const winRanking = sortByWinRate(computeStats(players, viewMatches));
  const potm = useMemo(() => findPlayerOfMonth(players, matches, monthKey), [players, matches, monthKey]);
  const playerForm = useMemo(
    () => computePlayerForm(players.map((p) => p.id), matches),
    [players, matches],
  );
  const playerNames = useMemo(() => new Map(players.map((p) => [p.id, p.name])), [players]);
  const linkedPlayer = useMemo(
    () => players.find((p) => p.profileId === profile.id) ?? null,
    [players, profile.id],
  );

  const topStreak = useMemo(() => {
    let best: { name: string; streak: number } | null = null;
    for (const player of players) {
      const streak = playerForm.get(player.id)?.winStreak ?? 0;
      if (streak > 0 && (!best || streak > best.streak)) best = { name: player.name, streak };
    }
    return best;
  }, [players, playerForm]);

  // Kalkulasi Win Rate Presisi (1 Desimal, Anti-Bug 7500%)
  const formattedWinRate = useMemo(() => {
    if (!potm || potm.winRate === undefined || potm.winRate === null) return '0%';
    let rate = potm.winRate;
    if (rate > 0 && rate <= 1) {
      rate = rate * 100;
    }
    return rate % 1 === 0 ? `${rate.toFixed(0)}%` : `${rate.toFixed(1).replace('.', ',')}%`;
  }, [potm]);

  const handleDelete = async (match: Match) => {
    if (!window.confirm('Hapus pertandingan ini dari riwayat dan klasemen?')) return;
    try {
      await deleteMatch(match.id);
      setActionError(null);
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const handleSaveMatch = async (input: MatchInput) => {
    const matchId = formState?.match?.id;
    await saveMatch(input, { matchId, status: isMaster ? 'approved' : 'pending' });
    setFormState(null);
    setSubmitNotice(matchId || isMaster ? null : 'Pertandingan terkirim dan menunggu persetujuan master.');
  };

  const displayName = profile.username || 'Admin';
  const initialLetter = displayName.slice(0, 2).toUpperCase();
  const accountMotivationName = (profile?.username || displayName || 'PATC').toUpperCase();

  const renderContent = () => {
    if (!loaded) {
      return (
        <div className="py-24 text-center">
          <p className="font-serif tracking-widest text-xs uppercase text-[#FF7A45] animate-pulse">
            Memuat Data Klub...
          </p>
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-red-500/30 bg-[#1A0A06]/70 p-8 text-center backdrop-blur-md">
          <p className="font-serif text-lg font-bold text-red-400">Data klub tidak bisa dimuat</p>
          <p className="text-xs text-[#FDF8F5]/70">{loadError}</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="rounded-full border border-[#FF7A45]/30 bg-[#FF7A45]/15 px-6 py-2 text-xs uppercase tracking-wider text-[#FDF8F5] transition hover:bg-[#FF7A45]/25"
          >
            Coba Lagi
          </button>
        </div>
      );
    }

    if (view === 'performance') {
      return <PerformancePage player={linkedPlayer} players={players} matches={matches} />;
    }

    if (view === 'approvals' && isMaster) {
      return <ApprovalsView matches={pendingMatches} playerNames={playerNames} onReview={approveOrRejectMatch} />;
    }

    if (tab === 'h2h') {
      return <HeadToHeadView players={players} matches={matches} />;
    }

    if (tab === 'winrate') {
      return <WinRateView ranking={winRanking} />;
    }

    if (tab === 'history') {
      return (
        <MatchHistoryView
          matches={viewMatches}
          playerNames={playerNames}
          isMaster={isMaster}
          onEdit={(m) => setFormState({ match: m })}
          onDelete={handleDelete}
        />
      );
    }

    return (
      <div className="space-y-8">
        {/* ======================================================== */}
        {/* TOP STATS CARDS (3 LINGKARAN KAWAT DENGAN AMBIENT HALO) */}
        {/* ======================================================== */}
        <div className="relative flex items-center justify-center gap-3 sm:gap-8 py-2">
          {/* Card 1: Win Rate */}
          <div className="relative group flex flex-col items-center">
            <div className="absolute -inset-2 rounded-full bg-[#FF5500]/30 blur-xl pointer-events-none" />
            <div className="relative flex h-28 w-28 sm:h-32 sm:w-32 flex-col items-center justify-center rounded-full border border-white/25 bg-gradient-to-b from-[#2D0D06]/90 via-[#180602]/95 to-[#0F0402] text-center shadow-[0_0_35px_rgba(255,85,0,0.35)] backdrop-blur-md">
              <span className="absolute -top-1.5 -right-1.5 text-[10px] font-mono text-white/30">+</span>
              <Crown className="mb-0.5 h-3.5 w-3.5 text-[#D4AF37]" />
              <p className="font-serif text-2xl sm:text-3xl font-extrabold leading-none text-[#FDF8F5]">
                {formattedWinRate}
              </p>
              <p className="mt-1 text-[8px] font-sans font-bold tracking-widest text-[#FDF8F5]/80 uppercase">
                Win Rate
              </p>
              <p className="truncate px-2 text-[10px] font-bold text-[#FF7A45]">
                {potm ? potm.name : '-'}
              </p>
            </div>
          </div>

          {/* Card 2: Total Match */}
          <div className="relative group flex flex-col items-center">
            <div className="absolute -inset-2 rounded-full bg-[#FF5500]/30 blur-xl pointer-events-none" />
            <div className="relative flex h-28 w-28 sm:h-32 sm:w-32 flex-col items-center justify-center rounded-full border border-white/25 bg-gradient-to-b from-[#2D0D06]/90 via-[#180602]/95 to-[#0F0402] text-center shadow-[0_0_35px_rgba(255,85,0,0.35)] backdrop-blur-md">
              <span className="absolute -top-1.5 -right-1.5 text-[10px] font-mono text-white/30">+</span>
              <p className="font-serif text-2xl sm:text-3xl font-extrabold leading-none text-[#FDF8F5]">
                {viewMatches.length}
              </p>
              <p className="mt-1.5 text-[8px] font-sans font-bold tracking-widest text-[#FDF8F5]/80 uppercase">
                Total Match
              </p>
              <p className="text-[10px] font-bold text-[#FDF8F5]">Season 2</p>
            </div>
          </div>

          {/* Card 3: Top Streak */}
          <div className="relative group flex flex-col items-center">
            <div className="absolute -inset-2 rounded-full bg-[#FF5500]/30 blur-xl pointer-events-none" />
            <div className="relative flex h-28 w-28 sm:h-32 sm:w-32 flex-col items-center justify-center rounded-full border border-white/25 bg-gradient-to-b from-[#2D0D06]/90 via-[#180602]/95 to-[#0F0402] text-center shadow-[0_0_35px_rgba(255,85,0,0.35)] backdrop-blur-md">
              <span className="absolute -top-1.5 -right-1.5 text-[10px] font-mono text-white/30">+</span>
              <div className="flex items-center gap-0.5">
                <span className="font-serif text-2xl sm:text-3xl font-extrabold leading-none text-[#FDF8F5]">
                  {topStreak?.streak ?? 0}
                </span>
                <Flame className="h-4 w-4 text-[#FF7A45]" />
              </div>
              <p className="mt-1.5 text-[8px] font-sans font-bold tracking-widest text-[#FDF8F5]/80 uppercase">
                Top Streak
              </p>
              <p className="truncate px-2 text-[10px] font-bold text-[#FF7A45]">
                {topStreak?.name ?? '-'}
              </p>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* HEADER KLASEMEN, TOGGLE MODE & SELECTOR SEASON */}
        {/* ======================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 pt-2">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-lg sm:text-xl font-bold tracking-widest text-[#FDF8F5] uppercase">
              Klasemen
            </h2>

            {/* Toggle Switch Kontras */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                role="switch"
                aria-label="Toggle mode klasemen"
                aria-checked={standingsMode === 'daily'}
                onClick={() => setStandingsMode(standingsMode === 'overall' ? 'daily' : 'overall')}
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  borderColor: 'rgba(255, 122, 69, 0.5)',
                }}
                className="relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200"
              >
                <span
                  style={{ backgroundColor: '#FF7A45' }}
                  className={`inline-block h-3.5 w-3.5 transform rounded-full shadow-[0_0_8px_rgba(255,122,69,0.7)] transition duration-200 ${
                    standingsMode === 'daily' ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>

              <div className="flex items-center gap-1.5 text-xs font-sans tracking-wider uppercase select-none">
                <span style={{ color: '#FDF8F5' }} className="font-bold">[</span>
                <button
                  type="button"
                  onClick={() => setStandingsMode('overall')}
                  style={{ color: standingsMode === 'overall' ? '#FF7A45' : '#FDF8F5' }}
                  className={`transition-colors cursor-pointer ${
                    standingsMode === 'overall'
                      ? 'font-bold drop-shadow-[0_1px_6px_rgba(255,122,69,0.7)]'
                      : 'font-medium hover:text-[#FF7A45]'
                  }`}
                >
                  Keseluruhan
                </button>
                <span style={{ color: '#FDF8F5' }} className="font-bold px-0.5">|</span>
                <button
                  type="button"
                  onClick={() => setStandingsMode('daily')}
                  style={{ color: standingsMode === 'daily' ? '#FF7A45' : '#FDF8F5' }}
                  className={`transition-colors cursor-pointer ${
                    standingsMode === 'daily'
                      ? 'font-bold drop-shadow-[0_1px_6px_rgba(255,122,69,0.7)]'
                      : 'font-medium hover:text-[#FF7A45]'
                  }`}
                >
                  Harian
                </button>
                <span style={{ color: '#FDF8F5' }} className="font-bold">]</span>
              </div>
            </div>
          </div>

          {/* Dropdown Season Ringkas */}
          <div className="flex items-center gap-2">
            <select
              aria-label="Pilih Season"
              value={seasonMode}
              onChange={(e) => setSeasonMode(e.target.value as 'active' | 'all')}
              style={{
                colorScheme: 'dark',
                color: '#FDF8F5',
                backgroundColor: '#120402',
                borderColor: 'rgba(255, 122, 69, 0.45)',
              }}
              className="cursor-pointer rounded-full border px-3 py-1 text-xs font-bold outline-none transition hover:border-[#FF7A45]"
            >
              <option value="active" style={{ backgroundColor: '#1F0703', color: '#FFFFFF' }}>
                Season 2 ▾
              </option>
              <option value="all" style={{ backgroundColor: '#1F0703', color: '#FFFFFF' }}>
                All-Time ▾
              </option>
            </select>
          </div>
        </div>

        {/* TAMPILAN HARIAN VS KESELURUHAN */}
        {standingsMode === 'daily' ? (
          <DailyRecap
            players={players}
            matches={matches}
            date={dailyDate || dailyDates[0] || todayIso}
            dates={dailyDates}
            onDateChange={setDailyDate}
          />
        ) : (
          <div>
            {/* Keterangan Simbol Legend */}
            <div className="mb-3 flex items-center gap-4 text-xs text-[#FDF8F5]">
              <span className="flex items-center gap-1 font-medium">
                <span className="font-bold text-[#4ADE80]">✓</span> Menang
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span className="font-bold text-[#F87171]">✕</span> Kalah
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span className="font-bold text-[#FDF8F5]/80">—</span> Seri
              </span>
            </div>

            {/* ======================================================== */}
            {/* TABEL KLASEMEN BENING (GLASSMORPHISM TABLE) */}
            {/* ======================================================== */}
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-[#120402]/40 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(255,255,255,0.2)]">
              {/* Garis Kilap Kaca Atas */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

              <div className="overflow-x-auto">
                <table className="w-full min-w-[580px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-wider text-[#FDF8F5]/70 font-sans font-bold">
                      <th className="py-3.5 pl-5 pr-2">#</th>
                      <th className="py-3.5 px-3">Pemain</th>
                      <th className="py-3.5 px-3 text-center">Form</th>
                      <th className="py-3.5 px-3 text-center">MP</th>
                      <th className="py-3.5 px-3 text-center">W</th>
                      <th className="py-3.5 px-3 text-center">L</th>
                      <th className="py-3.5 px-3 text-center">GD</th>
                      <th className="py-3.5 pr-5 text-right">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {standings.map((player, index) => {
                      const formInfo = playerForm.get(player.playerId);
                      const streakCount = formInfo?.winStreak ?? 0;
                      const forms = formInfo?.recentForms ?? [];

                      return (
                        <tr
                          key={player.playerId}
                          className="group transition-colors hover:bg-white/[0.06]"
                        >
                          {/* Rank */}
                          <td className="py-4 pl-5 pr-2 font-serif text-sm text-[#FDF8F5]/80">
                            {index + 1} <span className="text-[#FF7A45] font-bold">•</span>
                          </td>

                          {/* Nama Pemain & Hot Streak Badge */}
                          <td className="py-4 px-3">
                            <div className="flex flex-col">
                              {streakCount >= 3 && (
                                <span className="inline-flex w-fit items-center gap-1 rounded-full border border-[#FF7A45]/40 bg-[#FF7A45]/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#FF7A45] shadow-[0_0_10px_rgba(255,122,69,0.3)] mb-1">
                                  Hot Streak {streakCount}
                                </span>
                              )}
                              <span className="font-serif font-bold text-[#FDF8F5] text-base">
                                {player.name}
                              </span>
                            </div>
                          </td>

                          {/* Indikator Form 5 Laga */}
                          <td className="py-4 px-3">
                            <div className="flex items-center justify-center gap-1.5">
                              {forms.slice(-5).map((f, i) => {
                                if (f === 'W') {
                                  return (
                                    <span
                                      key={i}
                                      title="Menang"
                                      className="flex h-5 w-5 items-center justify-center rounded-full bg-[#D44A17] text-[10px] font-bold text-white shadow"
                                    >
                                      ✓
                                    </span>
                                  );
                                }
                                if (f === 'L') {
                                  return (
                                    <span
                                      key={i}
                                      title="Kalah"
                                      className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-[#2A1009] text-[10px] font-bold text-red-400"
                                    >
                                      ✕
                                    </span>
                                  );
                                }
                                if (f === 'D') {
                                  return (
                                    <span
                                      key={i}
                                      title="Seri"
                                      className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-[#2A1009] text-[10px] font-bold text-white/70"
                                    >
                                      —
                                    </span>
                                  );
                                }
                                return (
                                  <span
                                    key={i}
                                    className="h-5 w-5 rounded-full border border-white/10 bg-white/5"
                                  />
                                );
                              })}
                            </div>
                          </td>

                          {/* Statistik Pertandingan */}
                          <td className="py-4 px-3 text-center text-[#FDF8F5] font-mono font-medium text-sm">
                            {player.mp}
                          </td>
                          <td className="py-4 px-3 text-center text-[#FDF8F5] font-mono font-medium text-sm">
                            {player.w}
                          </td>
                          <td className="py-4 px-3 text-center text-[#FDF8F5] font-mono font-medium text-sm">
                            {player.l}
                          </td>
                          <td className="py-4 px-3 text-center font-mono font-medium text-sm text-[#FDF8F5]">
                            {player.gd > 0 ? `+${player.gd}` : player.gd}
                          </td>
                          <td className="py-4 pr-5 text-right font-serif font-black text-lg text-[#FF7A45]">
                            {player.pts}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Garis Kilap Kaca Bawah */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </div>

            {/* ======================================================== */}
            {/* UCAPAN MOTIVASI 3D: "VAMOS [NAMA AKUN]!!!" */}
            {/* ======================================================== */}
            <div className="mt-12 mb-16 text-center select-none">
              <h2 className="font-black italic text-4xl sm:text-6xl uppercase tracking-tighter transform -rotate-3 select-none transition-transform">
                <span className="block text-[#FF5500] drop-shadow-[0_8px_0_#0F0402]">
                  VAMOS
                </span>
                <span
                  style={{ color: '#FFFFFF' }}
                  className="block text-[#FFFFFF] drop-shadow-[0_8px_0_#0F0402]"
                >
                  {accountMotivationName}!!!
                </span>
              </h2>
            </div>
          </div>
        )}

        {/* Notifikasi Status */}
        {submitNotice && (
          <p className="rounded-xl border border-[#FF7A45]/40 bg-[#FF7A45]/10 px-4 py-3 text-xs text-[#FDF8F5]">
            {submitNotice}
          </p>
        )}
        {actionError && (
          <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-400">
            {actionError}
          </p>
        )}

        {/* My Submissions Jika Ada */}
        {!isMaster && mySubmissions.length > 0 && (
          <div className="pt-2">
            <MySubmissionsCard matches={mySubmissions} playerNames={playerNames} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#B84013] via-[#4A1504] to-[#0F0402] text-[#FDF8F5]">
      {/* ======================================================== */}
      {/* 1. ORNAMEN WATERMARK RAKET & LAPANGAN (BACKGROUND SVG) */}
      {/* ======================================================== */}
      {/* Racket Kiri Atas */}
      <svg
        className="pointer-events-none absolute -left-12 top-10 h-[520px] w-[520px] text-[#FF7A45] opacity-20 -rotate-12 blur-[0.5px]"
        viewBox="0 0 200 400"
        fill="none"
        stroke="currentColor"
      >
        <ellipse cx="100" cy="110" rx="65" ry="85" strokeWidth="3" />
        <path d="M50 110h100M60 80h80M60 140h80M75 50h50M75 170h50" strokeWidth="1" opacity="0.4" />
        <path d="M100 30v160M80 40v140M120 40v140M65 60v100M135 60v100" strokeWidth="1" opacity="0.4" />
        <path d="M75 190 L90 240 L90 380 L110 380 L110 240 L125 190" strokeWidth="3" />
        <line x1="90" y1="270" x2="110" y2="270" strokeWidth="1.5" />
        <line x1="90" y1="300" x2="110" y2="300" strokeWidth="1.5" />
        <line x1="90" y1="330" x2="110" y2="330" strokeWidth="1.5" />
      </svg>

      {/* Racket Kiri Bawah */}
      <svg
        className="pointer-events-none absolute -left-10 bottom-4 h-[380px] w-[380px] text-[#FF7A45] opacity-15 rotate-45"
        viewBox="0 0 200 400"
        fill="none"
        stroke="currentColor"
      >
        <ellipse cx="100" cy="110" rx="65" ry="85" strokeWidth="2.5" />
        <path d="M50 110h100M60 80h80M60 140h80M100 30v160M80 40v140M120 40v140" strokeWidth="0.8" opacity="0.4" />
        <path d="M75 190 L90 240 L90 380 L110 380 L110 240 L125 190" strokeWidth="2.5" />
      </svg>

      {/* Garis Lapangan Tenis Tengah */}
      <svg
        className="pointer-events-none absolute left-1/2 top-40 -translate-x-1/2 w-[800px] h-[600px] text-white/5 opacity-30"
        viewBox="0 0 800 600"
        fill="none"
        stroke="currentColor"
      >
        <rect x="50" y="50" width="700" height="500" strokeWidth="2" />
        <line x1="120" y1="50" x2="120" y2="550" strokeWidth="1.5" />
        <line x1="680" y1="50" x2="680" y2="550" strokeWidth="1.5" />
        <line x1="30" y1="300" x2="770" y2="300" strokeWidth="2" strokeDasharray="6 4" />
        <line x1="120" y1="180" x2="680" y2="180" strokeWidth="1.5" />
        <line x1="120" y1="420" x2="680" y2="420" strokeWidth="1.5" />
        <line x1="400" y1="180" x2="400" y2="420" strokeWidth="1.5" />
      </svg>

      {/* Pendar Ambient Glow di Tengah Layar */}
      <div className="pointer-events-none absolute left-1/2 top-32 -translate-x-1/2 h-80 w-80 rounded-full bg-[#FF5500]/20 blur-[130px]" />

      {/* SIDEBAR DESKTOP & DRAWER MOBILE */}
      <Sidebar
        username={profile.username}
        isMaster={isMaster}
        pendingCount={pendingMatches.length}
        view={view}
        tab={tab}
        onChangeView={setView}
        onChangeTab={setTab}
        onOpenSettings={() => setSettingsOpen(true)}
        onSignOut={onSignOut}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* AREA KONTEN UTAMA */}
      <div className="relative z-10 lg:pl-64">
        {/* MOBILE TOPBAR (☰ DAN [AD]) */}
        <header className="flex items-center justify-between px-5 pt-4 pb-1 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Buka Menu"
            style={{ borderColor: 'rgba(255, 122, 69, 0.4)', backgroundColor: 'rgba(255, 122, 69, 0.1)' }}
            className="flex h-10 w-10 items-center justify-center rounded-full border text-[#FDF8F5] transition hover:bg-[#FF7A45]/20"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div
            style={{ borderColor: 'rgba(255, 122, 69, 0.45)', backgroundColor: 'rgba(255, 122, 69, 0.15)' }}
            className="flex h-9 w-9 items-center justify-center rounded-full border text-xs font-serif font-bold tracking-wider text-[#FF7A45]"
          >
            {initialLetter}
          </div>
        </header>

        {/* BRANDING HEADER BESAR SESUAI MOCKUP */}
        <div className="px-4 pt-4 pb-4 text-center">
          {/* Badge Sambutan */}
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#FF7A45]/40 bg-[#FF7A45]/10 px-3.5 py-0.5 text-[10px] tracking-widest text-[#FF7A45] uppercase font-bold shadow-[0_0_15px_rgba(255,122,69,0.2)]">
            <span>Vamos, {displayName} ! 🎾</span>
          </div>

          <h1 className="font-serif text-3xl font-black uppercase tracking-tight text-[#FDF8F5] sm:text-5xl lg:text-6xl leading-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
            Panic At The Court
          </h1>

          <div className="mx-auto mt-2 flex max-w-xs items-center justify-center gap-3">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#FF7A45]/40" />
            <p className="text-[10px] sm:text-[11px] font-sans tracking-[0.35em] text-[#FDF8F5]/80 uppercase whitespace-nowrap font-semibold">
              Tennis Club Leaderboard
            </p>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#FF7A45]/40" />
          </div>
        </div>

        {/* MAIN BODY CONTAINER */}
        <main className="mx-auto max-w-4xl px-4 pb-32 pt-2 sm:px-6">
          {renderContent()}
        </main>
      </div>

      {/* FLOATING ACTION BUTTON (+ LOG MATCH DENGAN GLOW) */}
      {loaded && !loadError && (
        <button
          type="button"
          onClick={() => setFormState({})}
          style={{
            borderColor: '#FF7A45',
            backgroundColor: 'rgba(15, 4, 2, 0.95)',
            color: '#FF7A45',
          }}
          className="fixed bottom-6 right-5 z-40 inline-flex items-center gap-2 rounded-full border-2 px-6 py-3 text-xs font-bold uppercase tracking-widest shadow-[0_0_25px_rgba(255,122,69,0.45)] backdrop-blur-md transition-all hover:bg-[#FF7A45] hover:text-[#0F0402] active:scale-95 sm:bottom-8 sm:right-8"
        >
          <Plus className="h-4 w-4" />
          <span>Log Match</span>
        </button>
      )}

      {/* MODAL MATCH FORM */}
      {formState && (
        <MatchFormModal
          players={players}
          initial={formState.match}
          onSubmit={handleSaveMatch}
          onClose={() => setFormState(null)}
        />
      )}

      {/* MODAL SETTINGS (MASTER ADMIN) */}
      {settingsOpen && isMaster && (
        <SettingsModal currentUserId={profile.id} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
