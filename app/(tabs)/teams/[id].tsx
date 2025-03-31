import { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Image
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Database } from '@/database.types';
import { formatDate } from '@/utils/formatDate';
import { formatTime } from '@/utils/formatTime';
import { typography } from '@/constants/Typography';
import LoadingIndicator from '@/components/LoadingIndicator';
import CustomHeader from '@/components/headers/CustomHeader';
import CustomText from '@/components/CustomText';

type TeamRow = Database['public']['Tables']['teams']['Row'];
type GameRow = Database['public']['Tables']['games']['Row'];
type DatetimeRow = Database['public']['Tables']['datetime']['Row'];
type ScoresRow = Database['public']['Tables']['scores']['Row'];
type FieldRow = Database['public']['Tables']['fields']['Row'];
type DivisionRow = Database['public']['Tables']['divisions']['Row'];

interface TeamDetails extends TeamRow {
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
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<TeamDetails | null>(null);
  const [games, setGames] = useState<GameWithDetails[]>([]);

  useEffect(() => {
    const fetchTeamDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // First fetch the team with division details
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select(`
            *,
            division_details:division_id(*)
          `)
          .eq('id', id)
          .single();
          
        if (teamError) throw teamError;
        setTeam(teamData as unknown as TeamDetails);
        
        // Then fetch games where this team is playing
        const { data: gamesData, error: gamesError } = await supabase
          .from('games')
          .select(`
            *,
            team1:team1_id(*),
            team2:team2_id(*),
            datetime:datetime_id(*),
            field:field_id(*),
            scores(*)
          `)
          .or(`team1_id.eq.${id},team2_id.eq.${id}`)
          .order('datetime_id', { ascending: true });
          
        if (gamesError) throw gamesError;
        setGames(gamesData as unknown as GameWithDetails[]);
      } catch (error) {
        console.error('Error fetching team details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeamDetails();
  }, [id]);

  const renderGameCard = (game: GameWithDetails) => (
    <View key={game.id} style={styles.gameCard}>
      <View style={styles.gameHeader}>
        <CustomText style={styles.dateText}>{formatDate(game.datetime?.date, 'short')}</CustomText>
        <View style={styles.timeContainer}>
          <CustomText style={styles.timeText}>{formatTime(game.datetime?.time)}</CustomText>
        </View>
        <CustomText style={styles.fieldText}>Field {game.field?.id}</CustomText>
      </View>
      
      {/* Teams and Score Container */}
      <View style={styles.matchupContainer}>
        {/* Left side: Teams */}
        <View style={styles.teamsSection}>
          {/* Team 1 */}
          <View style={styles.teamRow}>
            <Image 
              source={game.team1?.avatar_uri ? { uri: game.team1.avatar_uri } : require('@/assets/images/avatar-placeholder.png')}
              style={styles.teamLogo}
            />
            <CustomText style={[
              styles.teamText,
              game.team1?.id.toString() === id ? styles.highlightedTeam : null
            ]}>
              {game.team1?.name || 'TBD'}
            </CustomText>
          </View>  

          {/* Team 2 */}
          <View style={styles.teamRow}>
            <Image 
              source={game.team2?.avatar_uri ? { uri: game.team2.avatar_uri } : require('@/assets/images/avatar-placeholder.png')}
              style={styles.teamLogo}
            />
            <CustomText style={[
              styles.teamText,
              game.team2?.id.toString() === id ? styles.highlightedTeam : null
            ]}>
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
      <CustomHeader title={team?.name ? team.name : ""} />    
      {loading ? (
        <LoadingIndicator message='Loading games for selected team...' />
      ) : team ? (
        <ScrollView style={styles.content}>
          {/* Team Info */}
          <View style={styles.teamInfoContainer}>
            <Image 
              source={team.avatar_uri ? { uri: team.avatar_uri } : require('@/assets/images/avatar-placeholder.png')}
              style={styles.teamBadge}
            />
            
            {team.division_details && (
              <View style={[
                styles.divisionContainer,
                {
                  backgroundColor: team.division_details.color_light || '#EFEFEF',
                  borderColor: team.division_details.color,
                  borderWidth: 1
                }
              ]}>
                <CustomText style={[styles.divisionText, { color: team.division_details.color }]}>
                  {team.division_details.title}
                </CustomText>
              </View>
            )}
          </View>
          
          {/* Games Section */}
          <View style={styles.gamesSection}>
            <CustomText style={styles.sectionTitle}>Games</CustomText>
            
            {games.length > 0 ? (
              <View style={styles.gamesList}>
                {games.map(game => renderGameCard(game))}
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
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  teamInfoContainer: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  teamBadge: {
    width: 70,
    height: 70,
    borderRadius: 100,
  },
  divisionContainer: {
    marginTop: 10,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  divisionText: {
    ...typography.textMedium
  },
  gamesSection: {
    padding: 20,
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
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    gap: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    ...typography.textBold,
    color: '#999',
    width: 100,
  },
  timeContainer: {
    backgroundColor: '#999',
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  timeText: {
    ...typography.text,
    color: '#fff'
  },
  fieldText: {
    ...typography.textBold,
    color: '#276B5D',
    width: 100,
    textAlign: 'right',
  },
  matchupContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamsSection: {
    flex: 3,
    justifyContent: 'space-between',
    gap: 8,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamLogo: {
    width: 27,
    height: 27,
    borderRadius: 18,
  },
  teamText: {
    ...typography.textSemiBold,
    color: '#444',
  },
  highlightedTeam: {
    color: '#EA1D25',
  },
  scoresSection: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  scoreText: {
    ...typography.textLargeBold,
    color: '#333',
    textAlign: 'center',
  },
  noGamesContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noGamesText: {
    ...typography.text,
    color: '#999',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    ...typography.textMedium,
    color: '#EA1D25',
  },
});

export default TeamDetails;