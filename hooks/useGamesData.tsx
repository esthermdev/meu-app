import { useCallback, useEffect, useState } from 'react';

import { Database } from '@/database.types';
import { supabase } from '@/lib/supabase';

import { useGameSubscription, useScheduleSubscription } from './realtime/useGameSubscriptions';

type GamesRow = Database['public']['Tables']['games']['Row'];
type TeamsRow = Database['public']['Tables']['teams']['Row'];
type PoolsRow = Database['public']['Tables']['pools']['Row'];
type DatetimeRow = Database['public']['Tables']['datetime']['Row'];
type ScoresRow = Database['public']['Tables']['scores']['Row'];

interface Games extends GamesRow {
  team1: TeamsRow | null;
  team2: TeamsRow | null;
  datetime: DatetimeRow | null;
  scores: ScoresRow[] | null;
}

export function useGamesByRound(divisionId: number, roundId: number) {
  const [games, setGames] = useState<Games[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch games function that can be called both initially and after score updates
  const fetchGames = useCallback(async () => {
    if (!divisionId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('games')
        .select(
          `
          *,
          datetime: datetime_id (*),
          team1: team1_id (*),
          team2: team2_id (*),
          scores(*),
          field: field_id(*)
        `,
        )
        .eq('division_id', divisionId)
        .eq('round_id', roundId)
        .order('id')
        .order('datetime_id');

      if (error) throw error;
      setGames(data as unknown as Games[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [divisionId, roundId]);

  // Initial data fetch
  useEffect(() => {
    fetchGames();
  }, [fetchGames, refreshTrigger]);

  // Set up real-time subscription for both games and scores
  useGameSubscription(divisionId, roundId, () => {
    console.log(`Game or score updated in division ${divisionId}, round ${roundId}`);
    setRefreshTrigger((prev) => prev + 1);
  });

  return {
    games,
    loading,
    error,
    refreshData: () => setRefreshTrigger((prev) => prev + 1),
  };
}

export function useGamesBySchedule(divisionId: number, scheduleId: number, refreshKey = 0) {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchGamesBySchedule = useCallback(async () => {
    if (!divisionId || !scheduleId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('games')
        .select(
          `
          *,
          datetime: datetime_id (*),
          team1: team1_id (*),
          team2: team2_id (*),
          scores(*),
          rounds: round_id (*),
          field: field_id (*)
        `,
        )
        .eq('division_id', divisionId)
        .eq('gametype_id', scheduleId)
        .order('round_id, id');

      if (error) throw error;
      setGames(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [divisionId, scheduleId]);

  // Initial data fetch
  useEffect(() => {
    fetchGamesBySchedule();
  }, [fetchGamesBySchedule, refreshTrigger, refreshKey]);

  // Extract game IDs for subscription
  const gameIds = games.map((game) => game.id);

  // Set up real-time subscription for score updates
  useScheduleSubscription(divisionId, scheduleId, gameIds, () => {
    setRefreshTrigger((prev) => prev + 1);
  });

  return {
    games,
    loading,
    error,
    refreshData: () => setRefreshTrigger((prev) => prev + 1),
  };
}

export function usePoolsByDivision(divisionId: number) {
  const [pools, setPools] = useState<PoolsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchPools() {
      try {
        const { data, error } = await supabase
          .from('pools')
          .select('*') // Just select all fields from pools
          .eq('division_id', divisionId)
          .order('name');

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        if (isMounted) {
          setPools(data || []);
        }

        console.log(
          `Fetched pools for division ID ${divisionId}:`,
          (data || []).map((pool) => ({ id: pool.id, name: pool.name })),
        );
      } catch (e) {
        console.error('Error in usePoolsByDivision:', e);
        if (isMounted) {
          setError(e instanceof Error ? e.message : 'An error occurred');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (divisionId) {
      fetchPools();
    } else {
      console.warn('No division ID provided to usePoolsByDivision');
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [divisionId]);

  return { pools, loading, error };
}
