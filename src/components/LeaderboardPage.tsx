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
  onOpenFinance?: () => void;
}

export default function LeaderboardPage({ profile, onSignOut, onOpenFinance }: LeaderboardPageProps) {
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

  const isMaster =
    profile.role === 'master' ||
    (profile as any).role === 'admin' ||
    profile.username?.toLowerCase() === 'nohan';

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

  const dailyDates = useMemo(
    () => [...new Set(matches.map((m) => m.date))].sort((a, b) => b.localeCompare(a)),
    [matches],
  );

  useEffect(() => {
    if (!dailyDate && dailyDates.length > 0) setDailyDate(dailyDates[0]);
  }, [dailyDate, dailyDates]);

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

  const formattedWinRate = useMemo(() => {
    if (!potm || potm.winRate === undefined || potm.winRate === null) return '0%';
    let rate = potm.winRate;
    if (rate > 0 && rate <= 1) rate = rate * 100;
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
        {/* TOP STATS CARDS */}
        <div className="relative flex items-center justify-center gap-3 sm:gap-8 py-2">
          <div className="relative group flex flex-col items-center">
            <div className="absolute -inset-2 rounded-full bg-[#FF5500]/30 blur-xl pointer-events-none animate-pulse" />
            <div className="relative flex h-28 w-28 sm:h-32 sm:w-32 flex-col items-center justify-center rounded-full border border-white/25 bg-gradient-to-b from-[#2D0D06]/90 via-[#180602]/95 to-[#0F0402] text-center shadow-[0_0_35px_rgba(255,85,0,0.35)] backdrop-blur-md transition-transform duration-300 hover:scale-105">
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

          <div className="relative group flex flex-col items-center">
            <div className="absolute -inset-2 rounded-full bg-[#FF5500]/30 blur-xl pointer-events-none animate-pulse" />
            <div className="relative flex h-28 w-28 sm:h-32 sm:w-32 flex-col items-center justify-center rounded-full border border-white/25 bg-gradient-to-b from-[#2D0D06]/90 via-[#180602]/95 to-[#0F0402] text-center shadow-[0_0_35px_rgba(255,85,0,0.35)] backdrop-blur-md transition-transform duration-300 hover:scale-105">
              <p className="font-serif text-2xl sm:text-3xl font-extrabold leading-none text-[#FDF8F5]">
                {viewMatches.length}
              </p>
              <p className="mt-1.5 text-[8px] font-sans font-bold tracking-widest text-[#FDF8F5]/80 uppercase">
                Total Match
              </p>
              <p className="text-[10px] font-bold text-[#FDF8F5]">Season 2</p>
            </div>
          </div>

          <div className="relative group flex flex-col items-center">
            <div className="absolute -inset-2 rounded-full bg-[#FF5500]/30 blur-xl pointer-events-none animate-pulse" />
            <div className="relative flex h-28 w-28 sm:h-32 sm:w-32 flex-col items-center justify-center rounded-full border border-white/25 bg-gradient-to-b from-[#2D0D06]/90 via-[#180602]/95 to-[#0F0402] text-center shadow-[0_0_35px_rgba(255,85,0,0.35)] backdrop-blur-md transition-transform duration-300 hover:scale-105">
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

        {/* HEADER KLASEMEN & TOGGLE */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 pt-2">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-lg sm:text-xl font-bold tracking-widest text-[#FDF8F5] uppercase">
              Klasemen
            </h2>

            <div className="flex items-center gap-2">
              <button
                type="button"
                role="switch"
                aria-checked={standingsMode === 'daily'}
                onClick={() => setStandingsMode(standingsMode === 'overall' ? 'daily' : 'overall')}
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', borderColor: 'rgba(255, 122, 69, 0.5)' }}
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
                  className="font-bold cursor-pointer"
                >
                  Keseluruhan
                </button>
                <span style={{ color: '#FDF8F5' }} className="font-bold px-0.5">|</span>
                <button
                  type="button"
                  onClick={() => setStandingsMode('daily')}
                  style={{ color: standingsMode === 'daily' ? '#FF7A45' : '#FDF8F5' }}
                  className="font-bold cursor-pointer"
                >
                  Harian
                </button>
                <span style={{ color: '#FDF8F5' }} className="font-bold">]</span>
              </div>
            </div>
          </div>

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
              className="cursor-pointer rounded-full border px-3 py-1 text-xs font-bold outline-none"
            >
              <option value="active" style={{ backgroundColor: '#1F0703', color: '#FFFFFF' }}>Season 2 ▾</option>
              <option value="all" style={{ backgroundColor: '#1F0703', color: '#FFFFFF' }}>All-Time ▾</option>
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
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-[#120402]/40 backdrop-blur-2xl shadow-2xl">
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
                        <tr key={player.playerId} className="group hover:bg-white/10 transition-colors">
                          <td className="py-4 pl-5 pr-2 font-serif text-sm text-[#FDF8F5]/80">
                            {index + 1} <span className="text-[#FF7A45] font-bold">•</span>
                          </td>
                          <td className="py-4 px-3">
                            <div className="flex flex-col">
                              {streakCount >= 3 && (
                                <span className="inline-flex w-fit items-center gap-1 rounded-full border border-[#FF7A45]/40 bg-[#FF7A45]/20 px-2 py-0.5 text-[9px] font-bold uppercase text-[#FF7A45] mb-1 animate-pulse">
                                  Hot Streak {streakCount}
                                </span>
                              )}
                              <span style={{ color: '#FFFFFF' }} className="font-serif font-bold text-base">
                                {player.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <div className="flex items-center justify-center gap-1.5">
                              {forms.slice(-5).map((f, i) => (
                                <span
                                  key={i}
                                  style={{
                                    backgroundColor: f === 'W' ? '#D44A17' : '#2A1009',
                                    color: f === 'W' ? '#FFFFFF' : f === 'L' ? '#F87171' : '#FDF8F5',
                                  }}
                                  className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shadow"
                                >
                                  {f === 'W' ? '✓' : f === 'L' ? '✕' : '—'}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ color: '#FFFFFF' }} className="py-4 px-3 text-center font-mono font-medium text-sm">
                            {player.mp}
                          </td>
                          <td style={{ color: '#4ADE80' }} className="py-4 px-3 text-center font-mono font-bold text-sm">
                            {player.w}
                          </td>
                          <td style={{ color: '#F87171' }} className="py-4 px-3 text-center font-mono font-bold text-sm">
                            {player.l}
                          </td>
                          <td style={{ color: player.gd > 0 ? '#4ADE80' : player.gd < 0 ? '#F87171' : '#FFFFFF' }} className="py-4 px-3 text-center font-mono font-bold text-sm">
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
            </div>

            <div className="relative mt-14 mb-16 text-center select-none">
              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-56 w-80 rounded-full bg-[#FF5500]/25 blur-[90px] animate-pulse" />
              <h2 className="relative font-black italic text-4xl sm:text-6xl uppercase tracking-tighter transform -rotate-3 select-none">
                <span className="block text-[#FF5500] drop-shadow-[0_8px_0_#0F0402]">VAMOS</span>
                <span style={{ color: '#FFFFFF' }} className="block drop-shadow-[0_8px_0_#0F0402]">
                  {accountMotivationName}!!!
                </span>
              </h2>
            </div>
          </div>
        )}

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
      {/* SIDEBAR */}
      <Sidebar
        username={profile.username}
        isMaster={isMaster}
        pendingCount={pendingMatches.length}
        view={view}
        tab={tab}
        onChangeView={setView}
        onChangeTab={setTab}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenLogMatch={() => setFormState({})}
        onOpenFinance={onOpenFinance}
        onSignOut={onSignOut}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="relative z-10 lg:pl-64">
        <header className="flex items-center justify-between px-5 pt-4 pb-1 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Buka Menu"
            style={{ borderColor: 'rgba(255, 122, 69, 0.4)', backgroundColor: 'rgba(255, 122, 69, 0.1)' }}
            className="flex h-10 w-10 items-center justify-center rounded-full border text-[#FDF8F5]"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div
            style={{ borderColor: 'rgba(255, 122, 69, 0.45)', backgroundColor: 'rgba(255, 122, 69, 0.15)' }}
            className="flex h-9 w-9 items-center justify-center rounded-full border text-xs font-serif font-bold text-[#FF7A45]"
          >
            {initialLetter}
          </div>
        </header>

        <div className="px-4 pt-4 pb-4 text-center">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#FF7A45]/40 bg-[#FF7A45]/10 px-3.5 py-0.5 text-[10px] tracking-widest text-[#FF7A45] uppercase font-bold">
            <span>Vamos, {displayName} ! 🎾</span>
          </div>
          <h1 className="font-serif text-3xl font-black uppercase tracking-tight text-[#FDF8F5] sm:text-5xl lg:text-6xl leading-none">
            Panic At The Court
          </h1>
        </div>

        <main className="mx-auto max-w-4xl px-4 pb-32 pt-2 sm:px-6">
          {renderContent()}
        </main>
      </div>

      {loaded && !loadError && (
        <button
          type="button"
          onClick={() => setFormState({})}
          style={{ borderColor: '#FF7A45', backgroundColor: 'rgba(15, 4, 2, 0.95)', color: '#FF7A45' }}
          className="group fixed bottom-6 right-5 z-40 inline-flex items-center gap-2 rounded-full border-2 px-6 py-3 text-xs font-bold uppercase tracking-widest shadow-2xl backdrop-blur-md hover:bg-[#FF7A45] hover:text-[#0F0402] transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Log Match</span>
        </button>
      )}

      {formState && (
        <MatchFormModal
          players={players}
          initial={formState.match}
          onSubmit={handleSaveMatch}
          onClose={() => setFormState(null)}
        />
      )}

      {settingsOpen && isMaster && (
        <SettingsModal currentUserId={profile.id} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
