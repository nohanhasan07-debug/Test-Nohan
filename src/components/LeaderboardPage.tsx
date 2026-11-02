import { useMemo, useState } from 'react';
import { RotateCw } from 'lucide-react';
import ApprovalsView from '@/components/ApprovalsView';
import Header, { type AppView } from '@/components/Header';
import HeadToHeadView from '@/components/HeadToHeadView';
import MatchFormModal from '@/components/MatchFormModal';
import MatchHistoryView from '@/components/MatchHistoryView';
import MySubmissionsCard from '@/components/MySubmissionsCard';
import PerformancePage from '@/components/PerformancePage';
import PotmCard from '@/components/PotmCard';
import SeasonFilter, { type SeasonMode } from '@/components/SeasonFilter';
import SettingsModal from '@/components/SettingsModal';
import StandingsView from '@/components/StandingsView';
import TabSwitcher from '@/components/TabSwitcher';
import TennisBall from '@/components/TennisBall';
import WinRateView from '@/components/WinRateView';
import { primaryButtonClass } from '@/components/formStyles';
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
  const { players, matches, reviewMatches, loaded, loadError, reload, addPlayer, linkPlayer, saveMatch, approveOrRejectMatch, deleteMatch } =
    useClubData();
  const isMaster = profile.role === 'master';
  const pendingMatches = useMemo(() => reviewMatches.filter((match) => match.status === 'pending'), [reviewMatches]);
  const mySubmissions = useMemo(
    () => reviewMatches.filter((match) => match.createdBy === profile.id),
    [reviewMatches, profile.id],
  );
  const [view, setView] = useState<AppView>('leaderboard');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tab, setTab] = useState<LeaderboardTab>('standings');
  const [seasonMode, setSeasonMode] = useState<SeasonMode>('active');
  const [archiveKey, setArchiveKey] = useState('');
  const [formState, setFormState] = useState<{ match?: Match } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const todayIso = toIsoDate(today);
  const activeKey = getSeasonKey(todayIso);
  const monthKey = getMonthKey(todayIso);

  const archiveSeasons = getArchiveSeasons(matches, activeKey);
  const resolvedArchiveKey = archiveSeasons.includes(archiveKey) ? archiveKey : (archiveSeasons[0] ?? '');

  const seasonView: SeasonView =
    seasonMode === 'all'
      ? { kind: 'all' }
      : { kind: 'season', key: seasonMode === 'archive' ? resolvedArchiveKey : activeKey };

  const viewMatches = matchesInView(matches, seasonView);
  const standings = sortStandings(computeStats(players, viewMatches));
  const winRanking = sortByWinRate(computeStats(players, viewMatches));
  const potm = useMemo(() => findPlayerOfMonth(players, matches, monthKey), [players, matches, monthKey]);
  const playerForm = useMemo(
    () => computePlayerForm(players.map((player) => player.id), matches),
    [players, matches],
  );
  const playerNames = useMemo(() => new Map(players.map((player) => [player.id, player.name])), [players]);
  const linkedPlayer = useMemo(
    () => players.find((player) => player.profileId === profile.id) ?? null,
    [players, profile.id],
  );

  const ready = loaded && !loadError;

  const handleDelete = async (match: Match) => {
    if (!window.confirm('Hapus pertandingan ini dari riwayat dan klasemen?')) return;
    try {
      await deleteMatch(match.id);
      setActionError(null);
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const handleSaveMatch = async (input: MatchInput) => {
    const matchId = formState?.match?.id;
    await saveMatch(input, { matchId, status: isMaster ? 'approved' : 'pending' });
    setFormState(null);
    setSubmitNotice(matchId || isMaster ? null : 'Pertandingan terkirim dan menunggu persetujuan master.');
  };

  const isEmptyArchive = tab !== 'h2h' && seasonMode === 'archive' && archiveSeasons.length === 0;

  return (
    <div className="min-h-screen">
      <Header
        displayName={profile.displayName}
        isMaster={isMaster}
        pendingCount={pendingMatches.length}
        view={view}
        onChangeView={setView}
        onOpenSettings={() => setSettingsOpen(true)}
        onSignOut={onSignOut}
      />

      <main className="mx-auto max-w-5xl px-4 pb-32 pt-6 md:px-8 md:pt-10">
        {!loaded && (
          <p className="py-16 text-center text-sm font-semibold uppercase tracking-[0.2em] text-paper/70">
            Memuat data klub...
          </p>
        )}

        {loaded && loadError && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-loss/40 bg-white/5 p-8 text-center">
            <p className="font-display text-lg font-bold">Data klub tidak bisa dimuat</p>
            <p role="alert" className="text-sm text-paper/70">{loadError}</p>
            <button type="button" onClick={() => void reload()} className={primaryButtonClass}>
              <RotateCw className="h-4 w-4" aria-hidden="true" />
              Coba Lagi
            </button>
          </div>
        )}

        {ready && view === 'performance' && (
          <PerformancePage player={linkedPlayer} players={players} matches={matches} />
        )}

        {ready && view === 'approvals' && isMaster && (
          <ApprovalsView matches={pendingMatches} playerNames={playerNames} onReview={approveOrRejectMatch} />
        )}

        {ready && view === 'leaderboard' && (
          <>
            <PotmCard player={potm} monthKey={monthKey} />

            {!isMaster && mySubmissions.length > 0 && (
              <div className="mt-8">
                <MySubmissionsCard matches={mySubmissions} playerNames={playerNames} />
              </div>
            )}

            <section className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <TabSwitcher tab={tab} onChange={setTab} />
              {tab !== 'h2h' && (
                <SeasonFilter
                  mode={seasonMode}
                  onModeChange={setSeasonMode}
                  activeKey={activeKey}
                  archiveKey={resolvedArchiveKey}
                  archiveSeasons={archiveSeasons}
                  onArchiveChange={setArchiveKey}
                />
              )}
            </section>

            {tab !== 'h2h' && (
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-paper/70">
                {seasonMode === 'all' ? 'All-Time' : getSeasonLabel(seasonView.kind === 'season' ? seasonView.key : activeKey)}
              </p>
            )}

            {submitNotice && (
              <p role="status" className="mt-4 rounded-xl border border-neon/50 bg-neon/10 px-4 py-3 text-sm font-semibold text-paper">
                {submitNotice}
              </p>
            )}

            {actionError && (
              <p role="alert" className="mt-4 rounded-xl border border-loss/40 bg-loss/10 px-4 py-3 text-sm font-semibold text-loss">
                {actionError}
              </p>
            )}

            <div key={`${tab}-${seasonMode}-${resolvedArchiveKey}`} className="animate-fade-up mt-4">
              {isEmptyArchive ? (
                <div className="rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-8 text-center">
                  <p className="font-display text-lg font-bold">Hall of Fame masih kosong</p>
                  <p className="mt-1 text-sm text-paper/70">Arsip akan muncul setelah season berganti.</p>
                </div>
              ) : tab === 'standings' ? (
                <StandingsView standings={standings} form={playerForm} />
              ) : tab === 'h2h' ? (
                <HeadToHeadView players={players} matches={matches} />
              ) : tab === 'winrate' ? (
                <WinRateView ranking={winRanking} />
              ) : (
                <MatchHistoryView
                  matches={viewMatches}
                  playerNames={playerNames}
                  isMaster={isMaster}
                  onEdit={(match) => setFormState({ match })}
                  onDelete={handleDelete}
                />
              )}
            </div>
          </>
        )}
      </main>

      {ready && view === 'leaderboard' && (
        <button
          type="button"
          onClick={() => setFormState({})}
          className="group fixed bottom-6 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-neon px-5 py-4 font-semibold text-ink-950 shadow-xl ring-4 ring-ink-950 transition hover:-translate-y-1 hover:bg-neon-light active:scale-95 md:bottom-10 md:right-10"
        >
          <TennisBall className="h-6 w-6 transition duration-500 group-hover:rotate-180" />
          Log Match
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
        <SettingsModal
          currentUserId={profile.id}
          players={players}
          onAddPlayer={addPlayer}
          onLinkPlayer={linkPlayer}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
