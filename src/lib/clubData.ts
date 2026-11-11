import { supabase } from '@/lib/supabase';
import type { Match, MatchFormat, MatchInput, MatchStatus, Player } from '@/types';

// Helper konversi profil menjadi Player
const toPlayer = (row: any): Player => ({
  id: String(row.id),
  name: row.display_name || row.name || row.username || 'Pemain',
  profileId: row.id,
  photo_url: row.photo_url || null,
});

// Helper konversi data match
const toMatch = (row: any): Match => ({
  id: String(row.id),
  date: row.match_date || row.date || new Date().toISOString().slice(0, 10),
  format: (row.format as MatchFormat) || 'singles',
  teamA: row.team_a || row.teamA || [],
  teamB: row.team_b || row.teamB || [],
  gamesA: Number(row.games_a ?? row.gamesA ?? 0),
  gamesB: Number(row.games_b ?? row.gamesB ?? 0),
  status: (row.approval_status || row.status || 'approved') as MatchStatus,
  createdBy: row.created_by || null,
  created_at: row.created_at,
});

// 1. AMBIL SEMUA PEMAIN DARI PROFILES
export async function fetchPlayers(): Promise<Player[]> {
  const playerList: Player[] = [];

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('username', { ascending: true });

    if (!error && profiles) {
      for (const p of profiles) {
        playerList.push(toPlayer(p));
      }
    }
  } catch (err) {
    console.warn('Gagal ambil data profiles:', err);
  }

  return playerList;
}

// 2. AMBIL SEMUA RIWAYAT MATCH
export async function fetchMatches(): Promise<Match[]> {
  try {
    const { data: clubMatches, error } = await supabase
      .from('club_matches')
      .select('*')
      .order('match_date', { ascending: false });

    if (!error && clubMatches) {
      return clubMatches.map(toMatch);
    }
  } catch (err) {
    console.warn('Tabel club_matches belum ada atau belum diisi:', err);
  }

  return [];
}

// 3. SIMPAN MATCH BARU
export async function insertMatch(input: MatchInput, status: 'pending' | 'approved'): Promise<void> {
  const rowPayload = {
    match_date: input.date,
    format: input.format,
    team_a: input.teamA,
    team_b: input.teamB,
    games_a: input.gamesA,
    games_b: input.gamesB,
    approval_status: status,
  };

  const { error } = await supabase.from('club_matches').insert(rowPayload);

  if (error) {
    console.error('Error simpan match:', error);
    throw new Error(error.message);
  }
}

// 4. PERSETUJUAN MATCH
export async function reviewMatch(matchId: string, status: 'approved' | 'rejected'): Promise<void> {
  const { error } = await supabase
    .from('club_matches')
    .update({ approval_status: status })
    .eq('id', matchId);

  if (error) throw new Error(error.message);
}

// 5. UPDATE MATCH
export async function updateMatch(matchId: string, input: MatchInput): Promise<void> {
  const rowPayload = {
    match_date: input.date,
    format: input.format,
    team_a: input.teamA,
    team_b: input.teamB,
    games_a: input.gamesA,
    games_b: input.gamesB,
  };

  const { error } = await supabase.from('club_matches').update(rowPayload).eq('id', matchId);
  if (error) throw new Error(error.message);
}

// 6. HAPUS MATCH
export async function removeMatch(matchId: string): Promise<void> {
  const { error } = await supabase.from('club_matches').delete().eq('id', matchId);
  if (error) throw new Error(error.message);
}
