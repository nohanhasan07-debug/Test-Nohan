import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/errors';
import {
  fetchMatches,
  fetchPlayers,
  insertMatch,
  insertPlayer,
  linkPlayerToProfile,
  removeMatch,
  updateMatch,
} from '@/lib/clubData';
import type { Match, MatchInput, Player } from '@/types';

const LOAD_ERROR = 'Data klub tidak bisa dimuat. Coba lagi.';

export function useClubData() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [nextPlayers, nextMatches] = await Promise.all([fetchPlayers(), fetchMatches()]);
      setPlayers(nextPlayers);
      setMatches(nextMatches);
      setLoadError(null);
    } catch (error) {
      setLoadError(getErrorMessage(error, LOAD_ERROR));
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addPlayer = useCallback(
    async (name: string) => {
      await insertPlayer(name);
      await load();
    },
    [load],
  );

  const linkPlayer = useCallback(
    async (playerId: string, profileId: string | null) => {
      await linkPlayerToProfile(playerId, profileId);
      await load();
    },
    [load],
  );

  const saveMatch = useCallback(
    async (input: MatchInput, matchId?: string) => {
      if (matchId) {
        await updateMatch(matchId, input);
      } else {
        await insertMatch(input);
      }
      await load();
    },
    [load],
  );

  const deleteMatch = useCallback(
    async (matchId: string) => {
      await removeMatch(matchId);
      await load();
    },
    [load],
  );

  return {
    players,
    matches,
    loaded,
    loadError,
    reload: load,
    addPlayer,
    linkPlayer,
    saveMatch,
    deleteMatch,
  };
}
