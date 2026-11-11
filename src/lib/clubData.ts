import { supabase } from '@/lib/supabase';
import type { Match, MatchFormat, MatchInput, MatchStatus, Player } from '@/types';

// Helper konversi data profil akun menjadi Player
const toPlayer = (row: any): Player => ({
  id: String(row.id),
  name: row.display_name || row.name || row.username || 'Pemain',
  profileId: row.id,
  photo_url: row.photo_url || null,
});

// Helper konversi data match
const toMatch = (row: any): Match => ({
  id: row.id,
  date: row.match_date || row.date || new Date().toISOString().slice(0, 10),
  format: (row.format as MatchFormat) || 'singles',
  teamA: row.team_a || row.teamA || [],
  teamB: row.team_b || row.teamB || [],
  gamesA: Number(row.games_a ?? row.gamesA ?? 0),
  gamesB: Number(row.games_b ?? row.gamesB ?? 0),
  status: (row.approval_status || row.status || 'approved') as MatchStatus,
  createdBy: row.created_by || null,
});

// 1. AMBIL SEMUA PEMAIN DARI TABEL PROFILES (SELECT '*')
export async function fetchPlayers(): Promise<Player[]> {
  const playerList: Player[] = [];
  const registeredIds = new Set<string>();

  try {
    // Gunakan select('*') agar tidak error jika ada kolom yang belum dibuat di Supabase
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('*');

    if (!profileErr && profiles && profiles.length > 0) {
      for (const p of profiles) {
        playerList.push(toPlayer(p));
        registeredIds.add(p.id);
      }
    }
  } catch (err) {
    console.warn('Gagal ambil data profiles:', err);
  }

  try {
    // Ambil juga dari tabel club_players jika ada
    const { data: clubPlayers } = await supabase
      .from('club_players')
      .select('*');

    if (clubPlayers && clubPlayers.length > 0) {
      for (const cp of clubPlayers) {
        if (!registeredIds.has(cp.id) && !registeredIds.has(cp.profile_id)) {
          playerList.push({
            id: cp.id,
            name: cp.name || cp.username || 'Pemain',
            profileId: cp.profile_id || null,
          });
          registeredIds.add(cp.id);
        }
      }
    }
  } catch (err) {
    // Abaikan jika tabel club_players tidak ada
  }

  return playerList;
}

// 2. AMBIL SEMUA MATCH
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
    // Fallback ke matches
  }

  try {
    const { data: fallbackMatches } = await supabase
      .from('matches')
      .select('*')
      .order('date', { ascending: false });

    if (fallbackMatches) {
      return fallbackMatches.map(toMatch);
    }
  } catch (err) {
    // Tidak apa-apa jika belum ada match
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

  const { error: clubError } = await supabase.from('club_matches').insert(rowPayload);
  if (!clubError) return;

  const fallbackPayload = {
    date: input.date,
    format: input.format,
    teamA: input.teamA,
    teamB: input.teamB,
    gamesA: input.gamesA,
    gamesB: input.gamesB,
    status: status,
  };

  const { error: fallbackError } = await supabase.from('matches').insert(fallbackPayload);
  if (fallbackError) {
    console.error('Gagal simpan pertandingan:', clubError || fallbackError);
    throw new Error(clubError?.message || fallbackError.message || 'Gagal menyimpan match');
  }
}

// 4. PERSETUJUAN MATCH
export async function reviewMatch(matchId: string, status: 'approved' | 'rejected'): Promise<void> {
  const { error } = await supabase
    .from('club_matches')
    .update({ approval_status: status })
    .eq('id', matchId);

  if (error) {
    await supabase.from('matches').update({ status }).eq('id', matchId);
  }
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
  if (error) {
    await supabase.from('matches').update({
      date: input.date,
      format: input.format,
      teamA: input.teamA,
      teamB: input.teamB,
      gamesA: input.gamesA,
      gamesB: input.gamesB,
    }).eq('id', matchId);
  }
}

// 6. HAPUS MATCH
export async function removeMatch(matchId: string): Promise<void> {
  const { error } = await supabase.from('club_matches').delete().eq('id', matchId);
  if (error) {
    await supabase.from('matches').delete().eq('id', matchId);
  }
}
