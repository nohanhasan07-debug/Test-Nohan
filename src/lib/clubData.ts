import { supabase } from '@/lib/supabase';
import type { Match, MatchFormat, MatchInput, MatchStatus, Player } from '@/types';

interface PlayerRow {
  id: string;
  name: string;
  profile_id: string | null;
}

interface MatchRow {
  id: string;
  match_date: string;
  format: MatchFormat;
  team_a: string[];
  team_b: string[];
  games_a: number;
  games_b: number;
  approval_status: MatchStatus;
  created_by: string | null;
}

const LOAD_ERROR = 'Data klub tidak bisa dimuat. Coba lagi.';
const SAVE_ERROR = 'Perubahan belum tersimpan. Coba lagi.';

const toPlayer = (row: PlayerRow): Player => ({
  id: row.id,
  name: row.name,
  profileId: row.profile_id,
});

const toMatch = (row: MatchRow): Match => ({
  id: row.id,
  date: row.match_date,
  format: row.format,
  teamA: row.team_a,
  teamB: row.team_b,
  gamesA: row.games_a,
  gamesB: row.games_b,
  status: row.approval_status,
  createdBy: row.created_by,
});

const toMatchRow = (input: MatchInput) => ({
  match_date: input.date,
  format: input.format,
  team_a: input.teamA,
  team_b: input.teamB,
  games_a: input.gamesA,
  games_b: input.gamesB,
});

export async function fetchPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('club_players')
    .select('id, name, profile_id')
    .order('name', { ascending: true });
  if (error || !data) throw new Error(LOAD_ERROR);
  return (data as PlayerRow[]).map(toPlayer);
}

export async function fetchMatches(): Promise<Match[]> {
  const { data, error } = await supabase
    .from('club_matches')
    .select('id, match_date, format, team_a, team_b, games_a, games_b, approval_status, created_by')
    .order('match_date', { ascending: false });
  if (error || !data) throw new Error(LOAD_ERROR);
  return (data as MatchRow[]).map(toMatch);
}

export async function insertMatch(input: MatchInput, status: 'pending' | 'approved'): Promise<void> {
  const { error } = await supabase.from('club_matches').insert({ ...toMatchRow(input), approval_status: status });
  if (error) throw new Error(SAVE_ERROR);
}

// Only pending matches can be reviewed, so an already decided match is never overwritten.
export async function reviewMatch(matchId: string, status: 'approved' | 'rejected'): Promise<void> {
  const { error } = await supabase
    .from('club_matches')
    .update({ approval_status: status })
    .eq('id', matchId)
    .eq('approval_status', 'pending');
  if (error) throw new Error(SAVE_ERROR);
}

export async function updateMatch(matchId: string, input: MatchInput): Promise<void> {
  const { error } = await supabase.from('club_matches').update(toMatchRow(input)).eq('id', matchId);
  if (error) throw new Error(SAVE_ERROR);
}

export async function removeMatch(matchId: string): Promise<void> {
  const { error } = await supabase.from('club_matches').delete().eq('id', matchId);
  if (error) throw new Error(SAVE_ERROR);
}
