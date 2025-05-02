import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/database.types';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

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

export function useScoreSubscription(gameIds: number[], onUpdate: (updatedGameId?: number) => void) {
  const previousGameIdsRef = useRef<number[]>([]);

  // We'll use a debounce mechanism to avoid too frequent updates
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedUpdate = useCallback((gameId?: number) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      onUpdate(gameId);
      debounceTimeoutRef.current = null;
    }, 300); // 300ms debounce
  }, [onUpdate]);

  useEffect(() => {
    if (!gameIds || gameIds.length === 0) return;

    // Only resubscribe if game IDs have changed
    const gameIdsChanged = gameIds.length !== previousGameIdsRef.current.length ||
      gameIds.some((id, index) => previousGameIdsRef.current[index] !== id);

    if (!gameIdsChanged && previousGameIdsRef.current.length > 0) {
      return; // Skip resubscription if game IDs haven't changed
    }

    previousGameIdsRef.current = [...gameIds];

    console.log('Setting up score subscription for game IDs:', gameIds);

    // Create a subscription channel
    const subscription = supabase
      .channel('game-scores-updates')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scores'
        },
        (payload: RealtimePostgresChangesPayload<ScoresRow>) => {
          console.log('Received score update:', payload);

          // Check if this update is relevant to our games
          const updatedGameId = payload.new && 'game_id' in payload.new ? payload.new.game_id : undefined;
          if (updatedGameId && gameIds.includes(updatedGameId)) {
            debouncedUpdate(updatedGameId);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up score subscription');
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      subscription.unsubscribe();
    };
  }, [gameIds, debouncedUpdate]);
}

export function useRoundIds(divisionId: number, roundId: number) {
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
        .select(`
          *,
          datetime: datetime_id (*),
          team1: team1_id (*),
          team2: team2_id (*),
          scores(*),
          field: field_id(*)
        `)
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

  // Extract game IDs for subscription
  const gameIds = games.map(game => game.id);
  
  // Set up score subscription
  useScoreSubscription(gameIds, (updatedGameId) => {
    console.log('Score updated for game:', updatedGameId);
    setRefreshTrigger(prev => prev + 1);
  });

  return { games, loading, error, refreshData: () => setRefreshTrigger(prev => prev + 1) };
}

// hooks/useGamesFilter.tsx
export function useScheduleId(divisionId: number, scheduleId: number, refreshKey = 0) {
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
        .select(`
          *,
          datetime: datetime_id (*),
          team1: team1_id (*),
          team2: team2_id (*),
          scores(*),
          rounds: round_id (*),
          field: field_id (*)
        `)
        .eq('division_id', divisionId)
        .eq('gametype_id', scheduleId)
        .order('round_id, id');

      if (error) throw error;
      setGames(data || []);

      // Inside your fetch function (either fetchGames or fetchGamesBySchedule)
      console.log(`Fetching games with division_id=${divisionId} and scheduleId/roundId=${scheduleId}`);
      // After the query
      console.log('Query result:', { data, error });
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
  const gameIds = games.map(game => game.id);
  
  // Set up score subscription
  useScoreSubscription(gameIds, () => {
    setRefreshTrigger(prev => prev + 1);
  });

  return { 
    games, 
    loading, 
    error, 
    refreshData: () => setRefreshTrigger(prev => prev + 1) 
  };
}

export function usePoolIds(divisionId: number) {
  const [pools, setPools] = useState<PoolsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchPools() {
      try {
        console.log("Fetching pools for division ID:", divisionId);

        const { data, error } = await supabase
          .from('pools')
          .select('*')  // Just select all fields from pools
          .eq('division_id', divisionId)
          .order('name');

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        console.log("Fetched pools:", data);

        if (isMounted) {
          setPools(data || []);
        }
      } catch (e) {
        console.error("Error in usePoolIds:", e);
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
      console.warn("No division ID provided to usePoolIds");
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [divisionId]);

  return { pools, loading, error };
}

