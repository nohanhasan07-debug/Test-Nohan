import { useCallback, useEffect, useMemo, useState } from 'react';
import { getErrorMessage } from '@/lib/errors';
import {
  fetchMatches,
  fetchPlayers,
  insertMatch,
  insertPlayer,
  linkPlayerToProfile,
  removeMatch,
  reviewMatch,
  updateMatch,
} from '@/lib/clubData';
import type { Match, MatchInput, Player } from '@/types';

const LOAD_ERROR = 'Data klub tidak bisa dimuat. Coba lagi.';

interface SaveOptions {
  matchId?: string;
  status: 'pending' | 'approved';
}

export function useClubData() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const matches = useMemo(() => allMatches.filter((match) => match.status === 'approved'), [allMatches]);
  const reviewMatches = useMemo(() => allMatches.filter((match) => match.status !== 'approved'), [allMatches]);

  const load = useCallback(async () => {
    try {
      const [nextPlayers, nextMatches] = await Promise.all([fetchPlayers(), fetchMatches()]);
      setPlayers(nextPlayers);
      setAllMatches(nextMatches);
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
    async (input: MatchInput, options: SaveOptions) => {
      if (options.matchId) {
        await updateMatch(options.matchId, input);
      } else {
        await insertMatch(input, options.status);
      }
      await load();
    },
    [load],
  );

  const approveOrRejectMatch = useCallback(
    async (matchId: string, status: 'approved' | 'rejected') => {
      await reviewMatch(matchId, status);
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
    reviewMatches,
    loaded,
    loadError,
    reload: load,
    addPlayer,
    linkPlayer,
    saveMatch,
    approveOrRejectMatch,
    deleteMatch,
  };
}
