import { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, SectionList, StyleSheet, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { usePoolIds } from '@/hooks/useGamesFilter';
import { supabase } from '@/lib/supabase';
import { Database } from '@/database.types';
import CustomHeader from '@/components/headers/CustomHeader';
import { fonts, typography } from '@/constants/Typography';

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
  const { division, divisionName } = useLocalSearchParams();
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
        teams!inner (id, pool_id, seed, name, avatar_uri)
      `)
      .in('teams.pool_id', poolIds)
      .order('teams(seed)', { ascending: true })
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
      <View style={styles.poolLabelContainer}>
        <Text style={styles.poolLabel}>{section.title}</Text>
      </View>
      <View style={styles.recordHeaderContainer}>
        <Text style={styles.recordHeaderText}>W</Text>
        <Text style={styles.recordDivider}>—</Text>
        <Text style={styles.recordHeaderText}>L</Text>
      </View>
    </View>
  );

  const renderItem = ({ item, index }: { item: Standings, index: number }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.rankNumber}>{item.teams?.seed}</Text>
      <Image 
        source={item.teams?.avatar_uri ? { uri: item.teams.avatar_uri } : require('@/assets/images/avatar-placeholder.png')} 
        style={styles.teamLogo} 
      />
      <Text style={styles.teamName}>{item.teams?.name}</Text>
      <View style={styles.recordContainer}>
        <Text style={styles.recordText}>{item.wins}</Text>
        <Text style={[styles.recordDivider, { color: '#000', ...typography.body }]}>—</Text>
        <Text style={styles.recordText}>{item.losses}</Text>
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
      <CustomHeader title={divisionName} />
      <SectionList
        sections={standingsData}
        keyExtractor={(item, index) => item.teams?.id?.toString() || index.toString()}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
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
    backgroundColor: '#EA1D25', // Red background for pool headers
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12
  },
  poolLabelContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  poolLabel: {
    ...typography.bodyLarge,
    color: '#EA1D25'
  },
  recordHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordHeaderText: {
    ...typography.bodyLarge,
    textAlign: 'center',
    width: 30,
    color: '#fff'
  },
  recordDivider: {
    ...typography.body,
    color: '#fff'
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#fff',
  },
  rankNumber: {
    ...typography.body,
    color: '#9E9E9E',
    width: 15,
  },
  teamLogo: {
    width: 25,
    height: 25,
    borderRadius: 20,
    marginHorizontal: 7,
  },
  teamName: {
    flex: 1,
    ...typography.bodyMedium
  },
  recordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordText: {
    ...typography.body,
    textAlign: 'center',
    width: 30,
  },
});