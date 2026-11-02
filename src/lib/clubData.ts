import { supabase } from '@/lib/supabase';
import type { Match, MatchFormat, MatchInput, Player } from '@/types';

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
}

const LOAD_ERROR = 'Data klub tidak bisa dimuat. Coba lagi.';
const SAVE_ERROR = 'Perubahan belum tersimpan. Coba lagi.';
const UNIQUE_VIOLATION = '23505';

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
    .select('id, match_date, format, team_a, team_b, games_a, games_b')
    .order('match_date', { ascending: false });
  if (error || !data) throw new Error(LOAD_ERROR);
  return (data as MatchRow[]).map(toMatch);
}

export async function insertPlayer(name: string): Promise<void> {
  const { error } = await supabase.from('club_players').insert({ name });
  if (error?.code === UNIQUE_VIOLATION) throw new Error('Nama pemain sudah terdaftar.');
  if (error) throw new Error(SAVE_ERROR);
}

export async function linkPlayerToProfile(playerId: string, profileId: string | null): Promise<void> {
  const { error } = await supabase
    .from('club_players')
    .update({ profile_id: profileId })
    .eq('id', playerId);
  if (error?.code === UNIQUE_VIOLATION) throw new Error('Akun ini sudah terhubung ke pemain lain.');
  if (error) throw new Error(SAVE_ERROR);
}

export async function insertMatch(input: MatchInput): Promise<void> {
  const { error } = await supabase.from('club_matches').insert(toMatchRow(input));
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
