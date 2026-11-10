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

  const renderContent = () => {
    if (!loaded) {
      return (
        <div className="py-20 text-center">
          <p className="font-serif tracking-widest text-xs uppercase text-[#FF7A45] animate-pulse">
            Memuat Data Pertandingan...
          </p>
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-red-500/30 bg-[#1A0A06]/60 p-8 text-center backdrop-blur-md">
          <p className="font-serif text-lg font-bold text-red-400">Data klub tidak bisa dimuat</p>
          <p className="text-xs text-[#FDF8F5]/70">{loadError}</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="rounded-full border border-[#FF7A45]/30 bg-[#FF7A45]/10 px-6 py-2 text-xs uppercase tracking-wider text-[#FDF8F5] transition hover:bg-[#FF7A45]/20"
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
      <div className="space-y-6">
        {/* TOP STATS CARDS (3 LINGKARAN KAWAT TIPIS) */}
        <div className="relative flex items-center justify-center gap-2 sm:gap-6 py-3">
          {/* Stat 1: Win Rate */}
          <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 flex-col items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-center backdrop-blur-sm">
            <span className="absolute -top-1.5 -right-1.5 text-[10px] font-mono text-white/30">+</span>
            <Crown className="mb-0.5 h-3 w-3 text-[#D4AF37]" />
            <p className="font-serif text-lg sm:text-xl font-bold leading-none text-[#FDF8F5]">
              {potm ? `${Math.round(potm.winRate * 100)}%` : '0%'}
            </p>
            <p className="mt-1 text-[8px] font-sans font-medium tracking-widest text-[#FDF8F5]/80 uppercase">
              Win Rate
            </p>
            <p className="truncate px-2 text-[9px] font-bold text-[#FF7A45]">
              {potm ? potm.name : '-'}
            </p>
          </div>

          {/* Stat 2: Total Match */}
          <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 flex-col items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-center backdrop-blur-sm">
            <span className="absolute -top-1.5 -right-1.5 text-[10px] font-mono text-white/30">+</span>
            <p className="font-serif text-xl sm:text-2xl font-bold leading-none text-[#FDF8F5]">
              {viewMatches.length}
            </p>
            <p className="mt-1.5 text-[8px] font-sans font-medium tracking-widest text-[#FDF8F5]/80 uppercase">
              Total Match
            </p>
            <p className="text-[9px] font-bold text-[#FDF8F5]">Season 2</p>
          </div>

          {/* Stat 3: Top Streak */}
          <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 flex-col items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-center backdrop-blur-sm">
            <span className="absolute -top-1.5 -right-1.5 text-[10px] font-mono text-white/30">+</span>
            <div className="flex items-center gap-0.5">
              <span className="font-serif text-xl sm:text-2xl font-bold leading-none text-[#FDF8F5]">
                {topStreak?.streak ?? 0}
              </span>
              <Flame className="h-4 w-4 text-[#FF7A45]" />
            </div>
            <p className="mt-1.5 text-[8px] font-sans font-medium tracking-widest text-[#FDF8F5]/80 uppercase">
              Top Streak
            </p>
            <p className="truncate px-2 text-[9px] font-bold text-[#FF7A45]">
              {topStreak?.name ?? '-'}
            </p>
          </div>
        </div>

        {/* ======================================================== */}
        {/* HEADER KLASEMEN & TOGGLE SWITCH [ KESELURUHAN | HARIAN ] */}
        {/* ======================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 pt-2">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-base sm:text-lg font-bold tracking-widest text-[#FDF8F5] uppercase">
              Klasemen
            </h2>

            {/* Toggle Switch Kontras Tinggi */}
            <div className="flex items-center gap-2">
              {/* Tombol Switch Knob */}
              <button
                type="button"
                role="switch"
                aria-label="Toggle mode klasemen keseluruhan atau harian"
                aria-checked={standingsMode === 'daily'}
                onClick={() => setStandingsMode(standingsMode === 'overall' ? 'daily' : 'overall')}
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.55)',
                  borderColor: 'rgba(255, 122, 69, 0.45)',
                }}
                className="relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 focus:outline-none"
              >
                <span
                  style={{ backgroundColor: '#FF7A45' }}
                  className={`inline-block h-3.5 w-3.5 transform rounded-full shadow-[0_0_8px_rgba(255,122,69,0.6)] transition duration-200 ease-in-out ${
                    standingsMode === 'daily' ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>

              {/* Teks [ KESELURUHAN | HARIAN ] */}
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-sans tracking-wider uppercase select-none">
                {/* Kurung Buka */}
                <span style={{ color: '#FDF8F5' }} className="font-bold">
                  [
                </span>

                {/* Mode KESELURUHAN */}
                <button
                  type="button"
                  onClick={() => setStandingsMode('overall')}
                  style={{
                    color: standingsMode === 'overall' ? '#FF7A45' : '#FDF8F5',
                  }}
                  className={`transition-colors cursor-pointer ${
                    standingsMode === 'overall'
                      ? 'font-bold drop-shadow-[0_1px_6px_rgba(255,122,69,0.7)]'
                      : 'font-medium hover:text-[#FF7A45]'
                  }`}
                >
                  Keseluruhan
                </button>

                {/* Simbol Pemisah | */}
                <span style={{ color: '#FDF8F5' }} className="font-bold px-0.5">
                  |
                </span>

                {/* Mode HARIAN */}
                <button
                  type="button"
                  onClick={() => setStandingsMode('daily')}
                  style={{
                    color: standingsMode === 'daily' ? '#FF7A45' : '#FDF8F5',
                  }}
                  className={`transition-colors cursor-pointer ${
                    standingsMode === 'daily'
                      ? 'font-bold drop-shadow-[0_1px_6px_rgba(255,122,69,0.7)]'
                      : 'font-medium hover:text-[#FF7A45]'
                  }`}
                >
                  Harian
                </button>

                {/* Kurung Tutup */}
                <span style={{ color: '#FDF8F5' }} className="font-bold">
                  ]
                </span>
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
              className="cursor-pointer rounded-full border px-3 py-1 text-[11px] font-bold outline-none transition hover:border-[#FF7A45]"
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
            <div className="mb-3 flex items-center gap-4 text-[10px] text-[#FDF8F5]">
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

            {/* TABEL KLASEMEN (OVERFLOW-X-AUTO DENGAN FORMAT EDITORIAL) */}
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#1A0A06]/40 backdrop-blur-md">
              <table className="w-full min-w-[580px] text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-[#FDF8F5]/60 font-sans font-bold">
                    <th className="py-3 pl-4 pr-1">#</th>
                    <th className="py-3 px-2">Pemain</th>
                    <th className="py-3 px-2 text-center">Form</th>
                    <th className="py-3 px-2 text-center">MP</th>
                    <th className="py-3 px-2 text-center">W</th>
                    <th className="py-3 px-2 text-center">L</th>
                    <th className="py-3 px-2 text-center">GD</th>
                    <th className="py-3 pr-4 text-right">PTS</th>
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
                        className="group transition-colors hover:bg-white/[0.04]"
                      >
                        {/* Rank */}
                        <td className="py-3.5 pl-4 pr-1 font-serif text-xs text-[#FDF8F5]/70">
                          {index + 1} <span className="text-[#FF7A45]">•</span>
                        </td>

                        {/* Nama Pemain & Hot Streak Badge */}
                        <td className="py-3.5 px-2">
                          <div className="flex flex-col">
                            {streakCount >= 3 && (
                              <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-[#FF7A45]">
                                Hot Streak {streakCount}
                              </span>
                            )}
                            <span className="font-serif font-bold text-[#FDF8F5] text-sm">
                              {player.name}
                            </span>
                          </div>
                        </td>

                        {/* Indikator Form (5 Lingkaran Halus) */}
                        <td className="py-3.5 px-2">
                          <div className="flex items-center justify-center gap-1">
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
                        <td className="py-3.5 px-2 text-center text-[#FDF8F5] font-mono font-medium">
                          {player.mp}
                        </td>
                        <td className="py-3.5 px-2 text-center text-[#FDF8F5] font-mono font-medium">
                          {player.w}
                        </td>
                        <td className="py-3.5 px-2 text-center text-[#FDF8F5] font-mono font-medium">
                          {player.l}
                        </td>
                        <td className="py-3.5 px-2 text-center font-mono font-medium text-[#FDF8F5]">
                          {player.gd > 0 ? `+${player.gd}` : player.gd}
                        </td>
                        <td className="py-3.5 pr-4 text-right font-serif font-bold text-sm text-[#FF7A45]">
                          {player.pts}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
    <div className="min-h-screen">
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
      <div className="lg:pl-60">
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

        {/* BRANDING HEADER BESAR (EDITORIAL LUXURY STYLE) */}
        <div className="px-4 pt-3 pb-4 text-center">
          {/* Badge Sambutan */}
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#FF7A45]/40 bg-[#FF7A45]/10 px-3 py-0.5 text-[10px] tracking-widest text-[#FF7A45] uppercase font-bold">
            <span>Vamos, {displayName} ! 🎾</span>
          </div>

          <h1 className="font-serif text-3xl font-black uppercase tracking-tight text-[#FDF8F5] sm:text-5xl leading-none">
            Panic At <br className="sm:hidden" /> The Court
          </h1>

          <div className="mx-auto mt-2 flex max-w-xs items-center justify-center gap-3">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#FF7A45]/30" />
            <p className="text-[9px] sm:text-[10px] font-sans tracking-[0.35em] text-[#FDF8F5]/80 uppercase whitespace-nowrap font-semibold">
              Tennis Club Leaderboard
            </p>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#FF7A45]/30" />
          </div>
        </div>

        {/* MAIN BODY CONTAINER */}
        <main className="mx-auto max-w-3xl px-4 pb-28 pt-1 sm:px-6">
          {renderContent()}
        </main>
      </div>

      {/* FLOATING ACTION BUTTON (+ LOG MATCH ESTETIK) */}
      {loaded && !loadError && (
        <button
          type="button"
          onClick={() => setFormState({})}
          style={{
            borderColor: '#FF7A45',
            backgroundColor: 'rgba(15, 4, 2, 0.95)',
            color: '#FF7A45',
          }}
          className="fixed bottom-6 right-5 z-40 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-bold uppercase tracking-widest shadow-[0_0_25px_rgba(255,122,69,0.35)] backdrop-blur-md transition-all hover:bg-[#FF7A45] hover:text-[#0F0402] active:scale-95 sm:bottom-8 sm:right-8"
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
