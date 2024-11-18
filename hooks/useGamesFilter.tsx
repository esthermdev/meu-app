import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/database.types';

type GamesRow = Database['public']['Tables']['games']['Row'];
type TeamsRow = Database['public']['Tables']['teams']['Row'];
type PoolsRow = Database['public']['Tables']['pools']['Row'];

interface Games extends GamesRow {
  team1: TeamsRow | null;
  team2: TeamsRow | null;
}

export function useGames(divisionId: number, roundId: number) {
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
            team1:teams!games_team1_id_fkey(*),
            team2:teams!games_team2_id_fkey(*)
          `)
          .eq('division_id', divisionId)
          .eq('round_id', roundId)
          .order('pool_id');

        if (error) throw error;
        if (isMounted) {
          setGames(data as Games[]);
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

export function usePoolIds(divisionId: number) {
  const [pools, setPools] = useState<PoolsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchPools() {
      try {
        const { data, error } = await supabase
          .from('pools')
          .select('*')
          .eq('division_id', divisionId)
          .order('name');

        if (error) throw error;
        if (isMounted) {
          setPools(data || []);
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
      fetchPools();
    }

    return () => {
      isMounted = false;
    };
  }, [divisionId]);

  return { pools, loading, error };
}