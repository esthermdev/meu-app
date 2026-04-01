// app/(tabs)/teams/[id].tsx
import { useCallback, useEffect, useState } from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import CustomText from '@/components/CustomText';
import GameComponent from '@/components/features/gameviews/GameComponent';
import { CustomHeader } from '@/components/headers/CustomHeader';
import LoadingIndicator from '@/components/LoadingIndicator';
import { typography } from '@/constants/Typography';
import { useTeamGamesSubscription } from '@/hooks/realtime/useTeamSubscriptions';
import { supabase } from '@/lib/supabase';
import { GameWithRelations } from '@/types/games';
import { TeamWithDivisionDetails } from '@/types/teams';

const TeamDetails = () => {
  const { id } = useLocalSearchParams();
  const teamId = Number(Array.isArray(id) ? id[0] : id);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [team, setTeam] = useState<TeamWithDivisionDetails | null>(null);
  const [games, setGames] = useState<GameWithRelations[]>([]);

  const fetchTeamDetails = useCallback(async () => {
    if (!Number.isFinite(teamId)) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // First fetch the team with division details
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select(
          `
          *,
          division_details:division_id(*)
        `,
        )
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;
      setTeam(teamData as unknown as TeamWithDivisionDetails);

      // Then fetch games where this team is playing
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select(
          `
          *,
          team1:team1_id(*),
          team2:team2_id(*),
          datetime:datetime_id(*),
          field:field_id(*),
          scores(*)
        `,
        )
        .or(`team1_id.eq.${teamId},team2_id.eq.${teamId}`)
        .order('datetime_id', { ascending: true });

      if (gamesError) throw gamesError;
      setGames(gamesData as unknown as GameWithRelations[]);
    } catch (error) {
      console.error('Error fetching team details:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teamId]);

  // Set up real-time subscription for score updates
  useEffect(() => {
    fetchTeamDetails();
  }, [fetchTeamDetails]);

  const gameIds = games.map((game) => game.id);
  useTeamGamesSubscription(gameIds, fetchTeamDetails);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTeamDetails();
  }, [fetchTeamDetails]);

  return (
    <View style={styles.container}>
      <CustomHeader title={team?.name ? team.name : ''} refreshInfo={true} />
      {loading && !refreshing ? (
        <LoadingIndicator message="Loading games for selected team..." />
      ) : team ? (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={onRefresh} colors={['#EA1D25']} tintColor="#EA1D25" />
          }>
          {/* Team Info */}
          <View style={styles.teamInfoContainer}>
            <Image
              source={team.avatar_uri ? { uri: team.avatar_uri } : require('@/assets/images/avatar-placeholder.png')}
              style={styles.teamBadge}
            />

            {team.division_details && (
              <View
                style={[
                  styles.divisionContainer,
                  {
                    backgroundColor: team.division_details.color_light || '#EFEFEF',
                    borderColor: team.division_details.color,
                    borderWidth: 1,
                  },
                ]}>
                <CustomText style={[styles.divisionText, { color: team.division_details.color }]}>
                  {team.division_details.title}
                </CustomText>
              </View>
            )}
          </View>

          {/* Games Section */}
          <View style={styles.gamesSection}>
            <View style={styles.sectionHeader}>
              <CustomText style={styles.sectionTitle}>Games</CustomText>
            </View>

            {games.length > 0 ? (
              <View style={styles.gamesList}>
                {games.map((game) => (
                  <GameComponent key={game.id} game={game} highlightedTeamId={teamId} noScoreFallback="-" />
                ))}
              </View>
            ) : (
              <View style={styles.noGamesContainer}>
                <CustomText style={styles.noGamesText}>No games scheduled</CustomText>
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.errorContainer}>
          <CustomText style={styles.errorText}>Team not found</CustomText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  teamInfoContainer: {
    alignItems: 'center',
    borderBottomColor: '#EFEFEF',
    borderBottomWidth: 1,
    padding: 20,
  },
  teamBadge: {
    borderRadius: 100,
    height: 70,
    width: 70,
  },
  divisionContainer: {
    borderRadius: 100,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  divisionText: {
    ...typography.textMedium,
  },
  gamesSection: {
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...typography.textLargeBold,
    color: '#333',
    marginBottom: 15,
  },
  gamesList: {
    gap: 10,
  },
  noGamesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  noGamesText: {
    ...typography.text,
    color: '#999',
  },
  errorContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    ...typography.textMedium,
    color: '#EA1D25',
  },
});

export default TeamDetails;
