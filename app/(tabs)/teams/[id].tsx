// app/(tabs)/teams/[id].tsx
import { useCallback, useEffect, useState } from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import CustomText from '@/components/CustomText';
import { CustomHeader } from '@/components/headers/CustomHeader';
import LoadingIndicator from '@/components/LoadingIndicator';
import { typography } from '@/constants/Typography';
import { Database } from '@/database.types';
import { useTeamGamesSubscription } from '@/hooks/realtime/useTeamSubscriptions';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/utils/formatDate';
import { formatTime } from '@/utils/formatTime';

type TeamRow = Database['public']['Tables']['teams']['Row'];
type GameRow = Database['public']['Tables']['games']['Row'];
type DatetimeRow = Database['public']['Tables']['datetime']['Row'];
type ScoresRow = Database['public']['Tables']['scores']['Row'];
type FieldRow = Database['public']['Tables']['fields']['Row'];
type DivisionRow = Database['public']['Tables']['divisions']['Row'];

interface TeamDetail extends TeamRow {
  division_details?: DivisionRow | null;
}

interface GameWithDetails extends GameRow {
  team1: TeamRow | null;
  team2: TeamRow | null;
  datetime: DatetimeRow | null;
  field: FieldRow | null;
  scores: ScoresRow[];
}

const TeamDetails = () => {
  const { id } = useLocalSearchParams();
  const teamId = Number(Array.isArray(id) ? id[0] : id);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [games, setGames] = useState<GameWithDetails[]>([]);

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
      setTeam(teamData as unknown as TeamDetail);

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
      setGames(gamesData as unknown as GameWithDetails[]);
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

  const renderGameCard = (game: GameWithDetails) => (
    <View key={game.id} style={styles.gameCard}>
      <View style={styles.gameHeader}>
        <CustomText style={styles.dateText}>{formatDate(game.datetime?.date, 'short')}</CustomText>
        <View style={styles.timeContainer}>
          <CustomText style={styles.timeText}>{formatTime(game.datetime?.time)}</CustomText>
        </View>
        <CustomText style={styles.fieldText}>Field {game.field?.name}</CustomText>
      </View>

      {/* Teams and Score Container */}
      <View style={styles.matchupContainer}>
        {/* Left side: Teams */}
        <View style={styles.teamsSection}>
          {/* Team 1 */}
          <View style={styles.teamRow}>
            <Image
              source={
                game.team1?.avatar_uri
                  ? { uri: game.team1.avatar_uri }
                  : require('@/assets/images/avatar-placeholder.png')
              }
              style={styles.teamLogo}
            />
            <CustomText style={[styles.teamText, game.team1?.id === teamId ? styles.highlightedTeam : null]}>
              {game.team1?.name || 'TBD'}
            </CustomText>
          </View>

          {/* Team 2 */}
          <View style={styles.teamRow}>
            <Image
              source={
                game.team2?.avatar_uri
                  ? { uri: game.team2.avatar_uri }
                  : require('@/assets/images/avatar-placeholder.png')
              }
              style={styles.teamLogo}
            />
            <CustomText style={[styles.teamText, game.team2?.id === teamId ? styles.highlightedTeam : null]}>
              {game.team2?.name || 'TBD'}
            </CustomText>
          </View>
        </View>

        {/* Right side: Scores */}
        <View style={styles.scoresSection}>
          <CustomText style={styles.scoreText}>
            {game.scores && game.scores.length > 0 ? game.scores[0].team1_score : '-'}
          </CustomText>
          <CustomText style={styles.scoreText}>
            {game.scores && game.scores.length > 0 ? game.scores[0].team2_score : '-'}
          </CustomText>
        </View>
      </View>
    </View>
  );

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
              <View style={styles.gamesList}>{games.map((game) => renderGameCard(game))}</View>
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
  divisionContainer: {
    borderRadius: 100,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  divisionText: {
    ...typography.textMedium,
  },
  gamesSection: {
    padding: 20,
  },
  teamBadge: {
    borderRadius: 100,
    height: 70,
    width: 70,
  },
  teamInfoContainer: {
    alignItems: 'center',
    borderBottomColor: '#EFEFEF',
    borderBottomWidth: 1,
    padding: 20,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionTitle: {
    ...typography.textLargeBold,
    color: '#333',
    marginBottom: 15,
  },
  gamesList: {
    gap: 10,
  },
  // Game Card Styles - Adapted from GameComponent
  gameCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    gap: 15,
    marginBottom: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gameHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateText: {
    ...typography.textBold,
    color: '#999',
    width: 100,
  },
  timeContainer: {
    backgroundColor: '#999',
    borderRadius: 20,
    paddingHorizontal: 8,
  },
  timeText: {
    ...typography.text,
    color: '#fff',
  },
  fieldText: {
    ...typography.textBold,
    color: '#276B5D',
    textAlign: 'right',
    width: 100,
  },
  matchupContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  teamsSection: {
    flex: 3,
    gap: 8,
    justifyContent: 'space-between',
  },
  teamRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  teamLogo: {
    borderRadius: 18,
    height: 27,
    width: 27,
  },
  teamText: {
    ...typography.textSemiBold,
    color: '#444',
  },
  highlightedTeam: {
    color: '#EA1D25',
  },
  scoresSection: {
    alignItems: 'flex-end',
    flex: 1,
    gap: 10,
    justifyContent: 'space-between',
  },
  scoreText: {
    ...typography.textLargeBold,
    color: '#333',
    textAlign: 'center',
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
