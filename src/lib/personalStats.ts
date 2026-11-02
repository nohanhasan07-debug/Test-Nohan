import type { Match } from '@/types';

export interface OpponentRecord {
  playerId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
}

export interface PersonalSummary {
  total: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  opponents: OpponentRecord[];
}

interface Tally {
  wins: number;
  draws: number;
  losses: number;
}

const percent = (part: number, total: number) =>
  total === 0 ? 0 : Math.round((part / total) * 1000) / 10;

function addOutcome(tally: Tally, ownGames: number, rivalGames: number) {
  if (ownGames > rivalGames) tally.wins += 1;
  else if (ownGames < rivalGames) tally.losses += 1;
  else tally.draws += 1;
}

export function computePersonalSummary(playerId: string, matches: Match[]): PersonalSummary {
  const overall: Tally = { wins: 0, draws: 0, losses: 0 };
  const byOpponent = new Map<string, Tally>();

  for (const match of matches) {
    const inTeamA = match.teamA.includes(playerId);
    const inTeamB = match.teamB.includes(playerId);
    if (!inTeamA && !inTeamB) continue;

    const ownGames = inTeamA ? match.gamesA : match.gamesB;
    const rivalGames = inTeamA ? match.gamesB : match.gamesA;
    const rivals = inTeamA ? match.teamB : match.teamA;

    addOutcome(overall, ownGames, rivalGames);
    for (const rivalId of rivals) {
      const tally = byOpponent.get(rivalId) ?? { wins: 0, draws: 0, losses: 0 };
      addOutcome(tally, ownGames, rivalGames);
      byOpponent.set(rivalId, tally);
    }
  }

  const total = overall.wins + overall.draws + overall.losses;

  const opponents: OpponentRecord[] = [...byOpponent.entries()]
    .map(([opponentId, tally]) => {
      const played = tally.wins + tally.draws + tally.losses;
      return {
        playerId: opponentId,
        played,
        wins: tally.wins,
        draws: tally.draws,
        losses: tally.losses,
        winRate: percent(tally.wins, played),
      };
    })
    .sort((a, b) => b.played - a.played || b.winRate - a.winRate);

  return {
    total,
    wins: overall.wins,
    draws: overall.draws,
    losses: overall.losses,
    winRate: percent(overall.wins, total),
    opponents,
  };
}
