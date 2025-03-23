import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/database.types';

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

export function useRoundIds(divisionId: number, roundId: number) {
  const [games, setGames] = useState<Games[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchGames() {
      try {
        const { data, error } = await supabase
          .from('games')
          .select(`
            *,
            datetime: datetime_id (*),
            team1: team1_id (*),
            team2: team2_id (*),
            scores(*)
          `)
          .eq('division_id', divisionId)
          .eq('round_id', roundId)
          .order('pool_id');

        if (error) throw error;
        if (isMounted) {
          setGames(data as unknown as Games[]);
        }
      } catch (e) {
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
      fetchGames();
    }

    return () => {
      isMounted = false;
    };
  }, [divisionId, roundId]);

  return { games, loading, error };
}

// hooks/useGamesFilter.tsx
export function useScheduleId(divisionId: number, scheduleId: number, refreshKey = 0) {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchGamesBySchedule() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('games')
          .select(`
            *,
            datetime: datetime_id (*),
            team1: team1_id (*),
            team2: team2_id (*),
            scores(*),
            rounds: round_id (*)
          `)
          .eq('division_id', divisionId)
          .eq('schedule_id', scheduleId)
          .order('round_id, id'); // Order by round_id first, then by game id

        if (error) throw error;
        if (isMounted) {
          setGames(data || []);
        }
      } catch (e) {
        if (isMounted) {
          setError(e instanceof Error ? e.message : 'An error occurred');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (divisionId && scheduleId) {
      fetchGamesBySchedule();
    }

    return () => {
      isMounted = false;
    };
  }, [divisionId, scheduleId, refreshKey]);

  return { games, loading, error };
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

