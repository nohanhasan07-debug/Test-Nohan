export interface Player {
  id: string;
  name: string;
  nickname?: string;
  email?: string;
  role?: 'admin' | 'member';
  photo_url?: string | null;
  created_at?: string;
}

export interface Match {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  team1_player1_id: string;
  team1_player2_id?: string | null;
  team2_player1_id: string;
  team2_player2_id?: string | null;
  score_team1: number;
  score_team2: number;
  winner_team: 1 | 2;
  created_at?: string;
}

export interface PlayerMonthlyStats {
  player: Player;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number; // Persentase (0 - 100)
}
