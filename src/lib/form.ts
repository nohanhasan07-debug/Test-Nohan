import { getSideOf, outcomeOf, type MatchOutcome } from '@/lib/matchSides';
import type { Match } from '@/types';

export const FORM_LENGTH = 5;
export const HOT_STREAK_MIN = 3;

export interface PlayerForm {
  recent: MatchOutcome[];
  winStreak: number;
}

export function computePlayerForm(playerIds: string[], matches: Match[]): Map<string, PlayerForm> {
  const newestFirst = [...matches].sort((a, b) => b.date.localeCompare(a.date));

  return new Map(
    playerIds.map((playerId) => {
      const outcomes: MatchOutcome[] = [];
      for (const match of newestFirst) {
        const side = getSideOf(match, playerId);
        if (!side) continue;
        const ownGames = side === 'A' ? match.gamesA : match.gamesB;
        const rivalGames = side === 'A' ? match.gamesB : match.gamesA;
        outcomes.push(outcomeOf(ownGames, rivalGames));
      }

      let winStreak = 0;
      for (const outcome of outcomes) {
        if (outcome !== 'win') break;
        winStreak += 1;
      }

      return [playerId, { recent: outcomes.slice(0, FORM_LENGTH), winStreak }];
    }),
  );
}
