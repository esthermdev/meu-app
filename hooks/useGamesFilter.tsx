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
    async function fetchGames() {
      try {
        const { data, error } = await supabase
          .from('games')
          .select(`*, team1: team1_id(name), team2: team2_id(name )`)
          .eq('division_id', divisionId)
          .eq('round_id', roundId)
          .order('pool_id')

        if (error) throw error;
        setGames(data as unknown as Games[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (divisionId) {
      fetchGames();
    }
  }, [divisionId]);

  return { games, loading, error };
}

export function usePoolIds(divisionId: number) {
  const [pools, setPools] = useState<PoolsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPools() {
      try {
        const { data, error } = await supabase
          .from('pools')
          .select(`*`)
          .eq('division_id', divisionId)

        if (error) throw error;
        setPools(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (divisionId) {
      fetchPools();
    }
  }, [divisionId]);

  return { pools, loading, error };
}