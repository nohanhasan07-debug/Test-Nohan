export type MatchFormat = 'singles' | 'doubles';

export type LeaderboardTab = 'standings' | 'winrate' | 'history' | 'h2h';

export type AccountRole = 'master' | 'member';

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  role: AccountRole;
}

export interface Player {
  id: string;
  name: string;
  profileId: string | null;
}

export type MatchStatus = 'pending' | 'approved' | 'rejected';

export interface Match {
  id: string;
  date: string;
  format: MatchFormat;
  teamA: string[];
  teamB: string[];
  gamesA: number;
  gamesB: number;
  status: MatchStatus;
  createdBy: string | null;
}

export type MatchInput = Pick<Match, 'date' | 'format' | 'teamA' | 'teamB' | 'gamesA' | 'gamesB'>;

export interface PlayerStats {
  playerId: string;
  name: string;
  mp: number;
  w: number;
  d: number;
  l: number;
  gw: number;
  gl: number;
  gd: number;
  pts: number;
  winRate: number;
}
