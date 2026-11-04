import { POINTS, POTM_MIN_MATCHES } from '@/lib/constants';
import { getMonthKey, getSeasonKey } from '@/lib/date';
import type { Match, Player, PlayerStats } from '@/types';

export type SeasonView = { kind: 'all' } | { kind: 'season'; key: string };

type Result = 'win' | 'draw' | 'loss';

function creditTeam(
  stats: Map<string, PlayerStats>,
  teamIds: string[],
  gamesFor: number,
  gamesAgainst: number,
  result: Result,
) {
  for (const id of teamIds) {
    const entry = stats.get(id);
    if (!entry) continue;
    entry.mp += 1;
    entry.gw += gamesFor;
    entry.gl += gamesAgainst;
    if (result === 'win') {
      entry.w += 1;
      entry.pts += POINTS.win;
    } else if (result === 'draw') {
      entry.d += 1;
      entry.pts += POINTS.draw;
    } else {
      entry.l += 1;
      entry.pts += POINTS.loss;
    }
  }
}

export function computeStats(players: Player[], matches: Match[]): PlayerStats[] {
  const stats = new Map<string, PlayerStats>(
    players.map((player) => [
      player.id,
      {
        playerId: player.id,
        name: player.name,
        mp: 0,
        w: 0,
        d: 0,
        l: 0,
        gw: 0,
        gl: 0,
        gd: 0,
        pts: 0,
        winRate: 0,
      },
    ]),
  );

  for (const match of matches) {
    const resultA: Result =
      match.gamesA > match.gamesB ? 'win' : match.gamesA < match.gamesB ? 'loss' : 'draw';
    const resultB: Result = resultA === 'win' ? 'loss' : resultA === 'loss' ? 'win' : 'draw';
    creditTeam(stats, match.teamA, match.gamesA, match.gamesB, resultA);
    creditTeam(stats, match.teamB, match.gamesB, match.gamesA, resultB);
  }

  return [...stats.values()]
    .filter((entry) => entry.mp > 0)
    .map((entry) => ({
      ...entry,
      gd: entry.gw - entry.gl,
      winRate: Math.round((entry.w / entry.mp) * 1000) / 10,
    }));
}

export function sortStandings(list: PlayerStats[]): PlayerStats[] {
  return [...list].sort(
    (a, b) =>
      b.pts - a.pts ||
      b.gd - a.gd ||
      b.gw - a.gw ||
      a.name.localeCompare(b.name),
  );
}

export function sortDailyStandings(list: PlayerStats[]): PlayerStats[] {
  return [...list].sort(
    (a, b) =>
      b.pts - a.pts ||
      b.gd - a.gd ||
      b.w - a.w ||
      a.name.localeCompare(b.name),
  );
}

export function sortByWinRate(list: PlayerStats[]): PlayerStats[] {
  return [...list].sort(
    (a, b) =>
      b.winRate - a.winRate ||
      b.w - a.w ||
      b.mp - a.mp ||
      a.name.localeCompare(b.name),
  );
}

export function matchesInView(matches: Match[], view: SeasonView): Match[] {
  if (view.kind === 'all') return matches;
  return matches.filter((match) => getSeasonKey(match.date) === view.key);
}

export function getArchiveSeasons(matches: Match[], activeKey: string): string[] {
  const keys = new Set(matches.map((match) => getSeasonKey(match.date)));
  keys.delete(activeKey);
  return [...keys].sort().reverse();
}

export function findPlayerOfMonth(
  players: Player[],
  matches: Match[],
  monthKey: string,
): PlayerStats | null {
  const monthMatches = matches.filter((match) => getMonthKey(match.date) === monthKey);
  const eligible = sortByWinRate(computeStats(players, monthMatches)).filter(
    (entry) => entry.mp >= POTM_MIN_MATCHES,
  );
  return eligible[0] ?? null;
}
