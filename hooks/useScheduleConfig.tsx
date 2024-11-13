import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/database.types';

type Division = Database['public']['Tables']['divisions']['Row'];
type ScheduleOption = Database['public']['Tables']['schedule_options']['Row'];

export function useDivisions() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDivisions() {
      try {
        const { data, error } = await supabase
          .from('divisions')
          .select('*')
          .order('display_order');

        if (error) throw error;
        setDivisions(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchDivisions();
  }, []);

  return { divisions, loading, error };
}

export function useScheduleOptions(divisionId: number) {
  const [scheduleOptions, setScheduleOptions] = useState<ScheduleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchScheduleOptions() {
      try {
        const { data, error } = await supabase
          .from('schedule_options')
          .select('*')
          .eq('division_id', divisionId)
          .order('display_order');

        if (error) throw error;
        setScheduleOptions(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (divisionId) {
      fetchScheduleOptions();
    }
  }, [divisionId]);

  return { scheduleOptions, loading, error };
}