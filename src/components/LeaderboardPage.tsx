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

  // Kalkulasi Win Rate Presisi
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
      return <ApprovalsView matches={pendingMatches} playerNames={playerNames} onReview={approveOrRejectMatc
