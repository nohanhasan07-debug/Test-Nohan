import { getSideOf, outcomeOf, type MatchOutcome } from '@/lib/matchSides';
import type { Match } from '@/types';

export interface HeadToHeadMeeting {
  match: Match;
  aGames: number;
  bGames: number;
  outcome: MatchOutcome;
}

export interface HeadToHeadSummary {
  meetings: HeadToHeadMeeting[];
  winsA: number;
  winsB: number;
  draws: number;
  gameDiff: number;
}

function toMeeting(match: Match, playerAId: string, playerBId: string): HeadToHeadMeeting | null {
  const sideA = getSideOf(match, playerAId);
  const sideB = getSideOf(match, playerBId);
  if (!sideA || !sideB || sideA === sideB) return null;

  const aGames = sideA === 'A' ? match.gamesA : match.gamesB;
  const bGames = sideA === 'A' ? match.gamesB : match.gamesA;
  return { match, aGames, bGames, outcome: outcomeOf(aGames, bGames) };
}

export function computeHeadToHead(
  playerAId: string,
  playerBId: string,
  matches: Match[],
): HeadToHeadSummary {
  const meetings = matches
    .map((match) => toMeeting(match, playerAId, playerBId))
    .filter((meeting): meeting is HeadToHeadMeeting => meeting !== null)
    .sort((a, b) => b.match.date.localeCompare(a.match.date));

  let winsA = 0;
  let winsB = 0;
  let draws = 0;
  let gameDiff = 0;
  for (const meeting of meetings) {
    gameDiff += meeting.aGames - meeting.bGames;
    if (meeting.outcome === 'win') winsA += 1;
    else if (meeting.outcome === 'loss') winsB += 1;
    else draws += 1;
  }

  return { meetings, winsA, winsB, draws, gameDiff };
}
