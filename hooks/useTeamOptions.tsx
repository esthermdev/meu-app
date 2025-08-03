import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface TeamOption {
  id: number;
  label: string;
  name: string;
}

export const useTeamOptions = (divisionId?: number | null) => {
  const [teamOptions, setTeamOptions] = useState<TeamOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTeamOptions = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('teams')
          .select('*')
          .order('name');

        // Filter by division if provided
        if (divisionId !== undefined && divisionId !== null) {
          query = query.eq('division_id', divisionId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching team options:', error);
          setTeamOptions([]);
          return;
        }

        const options: TeamOption[] = data?.map(item => ({
          id: item.id,
          label: item.name,
          name: item.name
        })) || [];

        // Add TBD option at the beginning
        const tbdOption: TeamOption = {
          id: -1,
          label: 'TBD',
          name: 'TBD'
        };

        setTeamOptions([tbdOption, ...options]);
      } catch (error) {
        console.error('Error fetching team options:', error);
        setTeamOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamOptions();
  }, [divisionId]);

  return { teamOptions, loading };
};