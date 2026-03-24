import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { DivisionRow, GameTypeRow } from '@/types/database';

export function useDivisions() {
  const [divisions, setDivisions] = useState<DivisionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const params = useLocalSearchParams();
  const divisionId = Number(params.division);
  const divisionName = params.divisionName as string;

  const fetchDivisions = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('divisions').select('*').order('display_order');

      if (error) throw error;
      setDivisions(data);
      setError(null);
      console.log('Divisions fetched successfully:', data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDivisions();
  }, [fetchDivisions]);

  const refreshDivisions = useCallback(async () => {
    setRefreshing(true);
    await fetchDivisions();
  }, [fetchDivisions]);

  return {
    divisionId,
    divisionName,
    divisions,
    loading,
    refreshing,
    error,
    refreshDivisions,
  };
}

export function useGameTypesByDivision(divisionId: number) {
  const [gametypes, setGametypes] = useState<GameTypeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGametypes() {
      try {
        const { data, error } = await supabase
          .from('gametypes')
          .select('*')
          .eq('division_id', divisionId)
          .order('display_order');

        if (error) throw error;
        setGametypes(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (divisionId) {
      fetchGametypes();
    }
  }, [divisionId]);

  return { gametypes, loading, error };
}
