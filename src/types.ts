export type MatchFormat = 'singles' | 'doubles';

export type AccountRole = 'master' | 'member';

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  role: AccountRole;
  photo_url?: string | null; // Ditambahkan untuk menampung foto profil
}

export interface Player {
  id: string;
  name: string;
  profileId: string | null;
  photo_url?: string | null; // Ditambahkan untuk dukungan foto
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
  created_at?: string;
}

export interface PlayerMonthlyStats {
  player: {
    id: string;
    name: string;
    photo_url?: string | null;
  };
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number; // Persentase (0 - 100)
}
