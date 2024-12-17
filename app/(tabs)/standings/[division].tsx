import { useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { usePoolIds } from '@/hooks/useGamesFilter';
import { supabase } from '@/lib/supabase';
import { Database } from '@/database.types';

type StandingsRow = Database['public']['Tables']['rankings']['Row']
type TeamsRow = Database['public']['Tables']['teams']['Row'];

interface Standings extends StandingsRow {
  teams: TeamsRow | null;
}

export default function DivisionStandings() {
  const { division } = useLocalSearchParams();
  const { pools, loading, error } = usePoolIds(Number(division));
  const [standings, setStandings] = useState<Standings[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStandings = async () => {
    setIsLoading(true);

    const poolIds = pools.map(pool => pool.id)

    const { data, error } = await supabase
      .from('rankings')
      .select(`
        wins,
        losses,
        pool_rank,
        teams!inner (pool_id, seed, name)
      `)
      .in('teams.pool_id', poolIds)
      .order('teams(pool_id)', { ascending: true })
      .order('pool_rank', { ascending: true });

      if (error) {
          console.error('Error fetching teams:', error);
      } else {
        setStandings(data as Standings[])
      }
    
    setIsLoading(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#EA1D25" />
      </View>
    );
  }

  if (error || !pools.length) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No pools found</Text>
      </View>
    );
  }

  return (
    <View>
      {pools.map((pool, index) => (
        <View key={index}>
          <Text>{pool.name}</Text>
        </View>
      ))}
    </View>
  );
}