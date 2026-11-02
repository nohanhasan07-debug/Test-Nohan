import type { Match } from '@/types';

export type MatchOutcome = 'win' | 'draw' | 'loss';

export type MatchSide = 'A' | 'B';

export function getSideOf(match: Match, playerId: string): MatchSide | null {
  if (match.teamA.includes(playerId)) return 'A';
  if (match.teamB.includes(playerId)) return 'B';
  return null;
}

export function outcomeOf(ownGames: number, rivalGames: number): MatchOutcome {
  if (ownGames > rivalGames) return 'win';
  if (ownGames < rivalGames) return 'loss';
  return 'draw';
}
