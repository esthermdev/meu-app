import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, SectionList, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import ComingSoonPlaceholder from '@/components/ComingSoonPlaceholder';
import CustomText from '@/components/CustomText';
import { CustomHeader } from '@/components/headers/CustomHeader';
import { typography } from '@/constants/Typography';
import { usePoolsByDivision } from '@/hooks/useGamesData';
import { supabase } from '@/lib/supabase';
import { Standings, StandingWithTeam } from '@/types/standings';

export default function DivisionStandings() {
  const { division, divisionName } = useLocalSearchParams();
  const { pools, loading, error } = usePoolsByDivision(Number(division));
  const [standingsData, setStandingsData] = useState<Standings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasGamesStarted, setHasGamesStarted] = useState(false);

  const fetchStandings = useCallback(async () => {
    setIsLoading(true);
    const poolIds = pools.map((pool) => pool.id);

    // Get all the rankings data
    const { data, error } = await supabase
      .from('rankings')
      .select(
        `
        *,
        teams!inner (id, pool_id, seed, name, avatar_uri)
      `,
      )
      .in('teams.pool_id', poolIds);

    if (error) {
      console.error('Error fetching standings:', error);
    } else if (data) {
      // Check if games have started by seeing if there are any wins or losses
      const gamesStarted = data.some((item) => (item.wins || 0) > 0 || (item.losses || 0) > 0);
      setHasGamesStarted(gamesStarted);

      // Sort data based on whether games have started
      const sortedData = data.sort((a, b) => {
        // Always group by pool
        if ((a.teams?.pool_id || 0) !== (b.teams?.pool_id || 0)) {
          return (a.teams?.pool_id || 0) - (b.teams?.pool_id || 0);
        }

        if (gamesStarted) {
          // If games have started, first sort by pool_rank
          const rankA = a.pool_rank || 0;
          const rankB = b.pool_rank || 0;

          if (rankA !== rankB) {
            return rankA - rankB; // Sort by pool_rank ascending
          }

          // If pool_rank is the same, fall back to original seeding
          const seedA = a.teams?.seed || 0;
          const seedB = b.teams?.seed || 0;
          return seedA - seedB;
        } else {
          // If games haven't started yet, just sort by seed
          const seedA = a.teams?.seed || 0;
          const seedB = b.teams?.seed || 0;
          return seedA - seedB;
        }
      });

      // Format data into sections
      const sectionData: Standings[] = pools.map((pool) => ({
        title: pool.name,
        poolId: pool.id,
        data: sortedData.filter((standing) => standing.teams?.pool_id === pool.id) as StandingWithTeam[],
      }));

      setStandingsData(sectionData);
    }

    setIsLoading(false);
  }, [pools]);

  useEffect(() => {
    if (!loading) {
      if (pools.length > 0) {
        fetchStandings();
      } else {
        setIsLoading(false);
      }
    }
  }, [fetchStandings, loading, pools.length]);

  const renderSectionHeader = ({ section }: { section: Standings }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.poolLabelContainer}>
        <CustomText style={styles.poolLabel}>{section.title}</CustomText>
      </View>
      <View style={styles.recordHeaderContainer}>
        <CustomText style={styles.recordHeaderText}>W</CustomText>
        <CustomText style={styles.recordDivider}>—</CustomText>
        <CustomText style={styles.recordHeaderText}>L</CustomText>
      </View>
    </View>
  );

  const renderItem = ({ item, index }: { item: StandingWithTeam; index: number }) => (
    <View style={styles.itemContainer}>
      <CustomText style={styles.rankNumber}>{hasGamesStarted ? item.pool_rank : item.teams?.seed}</CustomText>
      <Image
        source={
          item.teams?.avatar_uri ? { uri: item.teams.avatar_uri } : require('@/assets/images/avatar-placeholder.png')
        }
        style={styles.teamLogo}
      />
      <CustomText style={styles.teamName}>{item.teams?.name}</CustomText>
      <View style={styles.recordContainer}>
        <CustomText style={styles.recordText}>{item.wins || 0}</CustomText>
        <CustomText style={[styles.recordDivider, { color: '#000', ...typography.textSmall }]}>—</CustomText>
        <CustomText style={styles.recordText}>{item.losses || 0}</CustomText>
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

  if (error || (!loading && !pools.length)) {
    return (
      <View style={styles.container}>
        <CustomHeader title={divisionName} />
        <ComingSoonPlaceholder message="Standings coming soon!" iconName="leaderboard" />
      </View>
    );
  }

  if (!loading && pools.length > 0 && standingsData.length === 0 && !isLoading) {
    return (
      <View style={styles.container}>
        <CustomHeader title={divisionName} />
        <ComingSoonPlaceholder message="Pools coming soon!" iconName="leaderboard" />
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
        // Add a pull-to-refresh functionality
        refreshing={isLoading}
        onRefresh={fetchStandings}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    alignItems: 'center',
    backgroundColor: '#EA1D25', // Red background for pool headers
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  poolLabelContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 6,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  poolLabel: {
    ...typography.textLargeBold,
    color: '#EA1D25',
  },
  recordHeaderContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  recordHeaderText: {
    ...typography.textLargeBold,
    color: '#fff',
    textAlign: 'center',
    width: 30,
  },
  recordDivider: {
    ...typography.text,
    color: '#fff',
  },
  itemContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomColor: '#E5E5E5',
    borderBottomWidth: 1,
    flexDirection: 'row',
    padding: 12,
  },
  rankNumber: {
    ...typography.textSmall,
    color: '#9E9E9E',
    width: 20,
  },
  teamLogo: {
    borderRadius: 20,
    height: 25,
    marginHorizontal: 7,
    width: 25,
  },
  teamName: {
    flex: 1,
    ...typography.textSemiBold,
  },
  recordContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  recordText: {
    ...typography.text,
    textAlign: 'center',
    width: 30,
  },
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
});
