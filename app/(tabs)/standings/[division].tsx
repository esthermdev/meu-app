import { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, SectionList, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { usePoolIds } from '@/hooks/useGamesFilter';
import { supabase } from '@/lib/supabase';
import { Database } from '@/database.types';

type StandingsRow = Database['public']['Tables']['rankings']['Row']
type TeamsRow = Database['public']['Tables']['teams']['Row'];

interface Standings extends StandingsRow {
  teams: TeamsRow | null;
}

interface StandingsSection {
  title: string;
  poolId: number;
  data: Standings[];
}

export default function DivisionStandings() {
  const { division } = useLocalSearchParams();
  const { pools, loading, error } = usePoolIds(Number(division));
  const [standingsData, setStandingsData] = useState<StandingsSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (pools.length > 0) {
      fetchStandings();
    }
  }, [pools]);

  const fetchStandings = async () => {
    setIsLoading(true);
    const poolIds = pools.map(pool => pool.id);

    const { data, error } = await supabase
      .from('rankings')
      .select(`
        *,
        teams!inner (id, pool_id, seed, name)
      `)
      .in('teams.pool_id', poolIds)
      .order('teams(pool_id)', { ascending: true })
      .order('pool_rank', { ascending: true });

    if (error) {
      console.error('Error fetching standings:', error);
    } else if (data) {
      // Format data into sections
      const sectionData: StandingsSection[] = pools.map(pool => ({
        title: pool.name,
        poolId: pool.id,
        data: data.filter(standing => 
          standing.teams?.pool_id === pool.id
        ) as Standings[]
      }));
      
      setStandingsData(sectionData);
    }
    
    setIsLoading(false);
  };

  const renderSectionHeader = ({ section }: { section: StandingsSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: Standings }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.teamName}>{item.teams?.name}</Text>
      <View style={styles.recordContainer}>
        <Text style={styles.record}>{item.wins}W - {item.losses}L</Text>
      </View>
    </View>
  );

  if (loading || isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#EA1D25" />
      </View>
    );
  }

  if (error || !pools.length) {
    return (
      <View style={styles.centerContainer}>
        <Text>No pools found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={standingsData}
        keyExtractor={(item, index) => item.teams?.id?.toString() || index.toString()}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    backgroundColor: '#f4f4f4',
    padding: 10,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  teamName: {
    fontSize: 14,
    flex: 1,
  },
  recordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  record: {
    fontSize: 14,
    color: '#666',
  },
});