// app/(tabs)/home/mygames.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Database } from '@/database.types';
import { useAuth } from '@/context/AuthProvider';
import { formatDate } from '@/utils/formatDate';
import { formatTime } from '@/utils/formatTime';
import { typography } from '@/constants/Typography';
import LoadingIndicator from '@/components/LoadingIndicator';
import { router } from 'expo-router';
import PrimaryButton from '@/components/buttons/PrimaryButton';
import UpdateScoreModal from '@/components/features/modals/UpdateScoreModal';
import { updateGameScore } from '@/utils/updateGameScore';
import CustomText from '@/components/CustomText';

type GamesRow = Database['public']['Tables']['games']['Row'];
type DatetimeRow = Database['public']['Tables']['datetime']['Row'];
type TeamRow = Database['public']['Tables']['teams']['Row'];
type ScoresRow = Database['public']['Tables']['scores']['Row'];
type FieldsRow = Database['public']['Tables']['fields']['Row'];

interface Games extends GamesRow {
  datetime: DatetimeRow | null;
  team1: TeamRow;
  team2: TeamRow;
  scores?: ScoresRow[];
  field: FieldsRow | null;
}

const MyGames = () => {
  const [games, setGames] = useState<Games[]>([]);
  const [filteredGames, setFilteredGames] = useState<Games[]>([]);
  const [favoriteTeamIds, setFavoriteTeamIds] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const [modalVisible, setModalVisible] = useState(false);

  const [currentGame, setCurrentGame] = useState<Games | null>(null);
  const [team1Score, setTeam1Score] = useState('0');
  const [team2Score, setTeam2Score] = useState('0');

  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      fetchFavoriteGames(session.user.id);
    }
  }, []);

  useEffect(() => {
    if (games.length > 0) {
      console.log("All games:", games.length);
      
      // Log actual date values to debug
      const allDates = games.map(game => {
        const date = game.datetime?.date || '';
        console.log(`Game ${game.id} date value: "${date}"`);
        return date;
      }).filter(date => date !== '');
      
      console.log("All dates before deduplication:", allDates);
      
      // Create a map to standardize dates and ensure uniqueness
      const dateMap = new Map<string, string>();
      
      games.forEach(game => {
        if (game.datetime?.date) {
          // Create a standardized key for comparison by parsing and reformatting
          try {
            const dateObj = new Date(game.datetime.date);
            // Use ISO format date part for deduplication key
            const standardKey = dateObj.toISOString().split('T')[0];
            console.log(`Game date: ${game.datetime.date} -> Standard key: ${standardKey}`);
            dateMap.set(standardKey, game.datetime.date);
          } catch (e) {
            // If date parsing fails, fall back to string normalization
            const standardKey = game.datetime.date.trim();
            console.log(`Date parsing failed for: ${game.datetime.date}, using trimmed value`);
            dateMap.set(standardKey, game.datetime.date);
          }
        }
      });
      
      // Convert the map values (original date strings) to an array
      const uniqueDates = Array.from(dateMap.values());
      console.log("Unique dates after deduplication:", uniqueDates);
      
      // Sort dates chronologically
      uniqueDates.sort((a, b) => {
        return new Date(a).getTime() - new Date(b).getTime();
      });
      
      setDates(uniqueDates);
      
      // Set first date as selected by default
      if (uniqueDates.length > 0 && !selectedDate) {
        setSelectedDate(uniqueDates[0]);
        console.log("Setting initial selected date:", uniqueDates[0]);
      }
    }
  }, [games]);

  useEffect(() => {
    if (selectedDate) {
      console.log("Filtering for selected date:", selectedDate);
      
      try {
        // Parse the selected date for comparison
        const selectedDateObj = new Date(selectedDate);
        const selectedDateStr = selectedDateObj.toISOString().split('T')[0];
        
        const filtered = games.filter(game => {
          try {
            // Check if the game has a datetime
            if (!game.datetime?.date) {
              console.log(`Game ${game.id} has no date`);
              return false;
            }
            
            // Parse the game date for standardized comparison
            const gameDateObj = new Date(game.datetime.date);
            const gameDateStr = gameDateObj.toISOString().split('T')[0];
            
            const isMatch = gameDateStr === selectedDateStr;
            console.log(`Game ${game.id} date="${game.datetime.date}" (${gameDateStr}) matches=${isMatch}`);
            
            return isMatch;
          } catch (e) {
            // If date parsing fails, fall back to string comparison
            console.log(`Date parsing failed for game ${game.id}, falling back to string comparison`);
            const normalizedGameDate = game.datetime?.date?.trim() ?? '';
            const normalizedSelectedDate = selectedDate.trim();
            
            return normalizedGameDate === normalizedSelectedDate;
          }
        });
        
        console.log(`Found ${filtered.length} games for date ${selectedDate}`);
        
        // Sort filtered games by time
        filtered.sort((a, b) => {
          const timeA = a.datetime?.time || '';
          const timeB = b.datetime?.time || '';
          return timeA.localeCompare(timeB);
        });
        
        setFilteredGames(filtered);
      } catch (e) {
        // If date parsing completely fails, fall back to basic string comparison
        console.log("Date parsing error for filtering, falling back to basic comparison");
        
        const normalizedSelectedDate = selectedDate.trim();
        const filtered = games.filter(game => {
          const gameDate = game.datetime?.date || '';
          const normalizedGameDate = gameDate.trim();
          
          return normalizedGameDate === normalizedSelectedDate;
        });
        
        setFilteredGames(filtered);
      }
    } else {
      setFilteredGames(games);
    }
  }, [selectedDate, games]);

  const fetchFavoriteGames = async (userId: string) => {
    try {
      setLoading(true);

      // First, get the user's favorite team IDs
      const { data: favoriteTeams, error } = await supabase
        .from('favorite_teams')
        .select('team_id')
        .eq('user_id', userId);

      if (error) throw error;

      if (!favoriteTeams?.length) {
        setGames([]);
        setFavoriteTeamIds([]);
        setLoading(false);
        return;
      }

      const teamIds = favoriteTeams.map(team => team.team_id);
      setFavoriteTeamIds(teamIds);

      // Then fetch all games where either team1 or team2 is in the favorite teams
      const { data, error: gamesError } = await supabase
        .from('games')
        .select(`
          *, 
          datetime: datetime_id (*),
          team1:team1_id (*),
          team2:team2_id (*),
          scores(*),
          field: field_id (*)
        `)
        .or(`team1_id.in.(${teamIds.join(',')}),team2_id.in.(${teamIds.join(',')})`)
        .order('datetime_id', { ascending: true });

      if (gamesError) throw gamesError;

      setGames(data as unknown as Games[]);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch favorite games');
      console.error('Error fetching favorite games:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    if (session) {
      fetchFavoriteGames(session.user.id).finally(() => setRefreshing(false));
    } else {
      setRefreshing(false);
    }
  }, [session]);

  // This function prepares the modal with game data and shows it
  const openScoreModal = (game: Games) => {
    setCurrentGame(game);
    // Set initial scores from existing data if available
    if (game.scores && game.scores[0]) {
      setTeam1Score(game.scores[0].team1_score.toString());
      setTeam2Score(game.scores[0].team2_score.toString());
    } else {
      setTeam1Score('0');
      setTeam2Score('0');
    }
    setModalVisible(true);
  };

  // Helper function to update local state optimistically
  const updateLocalGameState = (gameId: number, team1Score: number, team2Score: number) => {
    const updatedGames = games.map(game => {
      if (game.id === gameId) {
        // Create proper structure for scores array
        const updatedScores = game.scores && game.scores.length > 0
          ? [...game.scores] // Copy existing scores array
          : []; // Create new array if none exists

        if (updatedScores.length > 0) {
          // Update first score in array
          updatedScores[0] = {
            ...updatedScores[0],
            team1_score: team1Score,
            team2_score: team2Score,
            game_id: gameId
          };
        } else {
          // Add new score to array
          updatedScores.push({
            team1_score: team1Score,
            team2_score: team2Score,
            game_id: gameId,
            id: 0, // Temporary ID, will be replaced on next fetch
            is_finished: false, // Default value
            round_id: null // Default value
          });
        }

        return {
          ...game,
          scores: updatedScores
        };
      }
      return game;
    });

    setGames(updatedGames);
    setFilteredGames(prev => prev.map(game => {
      if (game.id === gameId) {
        const found = updatedGames.find(g => g.id === game.id);
        return found || game;
      }
      return game;
    }));
  };

  // This function processes the score update with optimistic UI
  const submitScore = async (team1ScoreStr: string, team2ScoreStr: string, _datetimeId: number | null, _fieldId: number | null) => {
    if (!currentGame) return;

    const team1ScoreNum = parseInt(team1ScoreStr);
    const team2ScoreNum = parseInt(team2ScoreStr);

    // Immediately update UI optimistically
    updateLocalGameState(currentGame.id, team1ScoreNum, team2ScoreNum);

    // Close modal right away for better UX
    setModalVisible(false);

    // Then perform the actual update (only scores for regular users)
    const success = await updateGameScore({
      gameId: currentGame.id,
      team1Score: team1ScoreNum,
      team2Score: team2ScoreNum,
      scoreId: currentGame.scores?.[0]?.id,
    });

    // If the update failed, refresh to get correct data
    if (!success && session) {
      fetchFavoriteGames(session.user.id);
    }
  };

  const renderDateFilter = () => (
    <View style={styles.dateFilterContainer}>
      <CustomText style={styles.dateLabel}>Date</CustomText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
        {dates.map((date) => (
          <TouchableOpacity
            key={date}
            style={[
              styles.dateButton,
              selectedDate === date && styles.selectedDateButton
            ]}
            onPress={() => setSelectedDate(date)}
          >
            <CustomText style={[
              styles.dateButtonText,
              selectedDate === date && styles.selectedDateText
            ]}>
              {formatDate(date, 'short')}
            </CustomText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderGame = ({ item }: { item: Games }) => {
    const isGameFinished = item.scores && item.scores[0]?.is_finished;

    return (
      <View style={styles.gameCard}>
        <View style={styles.gameHeader}>
          <CustomText style={styles.dateText}>{formatDate(item.datetime?.date, 'short')}</CustomText>
          <View style={styles.timeContainer}>
            <CustomText style={styles.timeText}>{formatTime(item.datetime?.time)}</CustomText>
          </View>
          <CustomText style={styles.fieldText}>Field {item.field?.name}</CustomText>
        </View>

        {/* Teams and Score Container */}
        <View style={styles.matchupContainer}>
          {/* Left side: Teams */}
          <View style={styles.teamsSection}>
            {/* Team 1 */}
            <View style={styles.teamRow}>
              <Image
                source={item.team1.avatar_uri ? { uri: item.team1.avatar_uri } : require('@/assets/images/avatar-placeholder.png')}
                style={styles.teamLogo}
              />
              <CustomText style={[
                styles.teamText,
                favoriteTeamIds.includes(item.team1.id) && styles.highlightedTeam
              ]}>
                {item.team1.name}
              </CustomText>
            </View>

            {/* Team 2 */}
            <View style={styles.teamRow}>
              <Image
                source={item.team2.avatar_uri ? { uri: item.team2.avatar_uri } : require('@/assets/images/avatar-placeholder.png')}
                style={styles.teamLogo}
              />
              <CustomText style={[
                styles.teamText,
                favoriteTeamIds.includes(item.team2.id) && styles.highlightedTeam
              ]}>
                {item.team2.name}
              </CustomText>
            </View>
          </View>

          {/* Right side: Scores */}
          <View style={styles.scoresSection}>
            <CustomText style={styles.scoreText}>
              {item.scores && item.scores[0] ? item.scores[0].team1_score : 0}
            </CustomText>
            <CustomText style={styles.scoreText}>
              {item.scores && item.scores[0] ? item.scores[0].team2_score : 0}
            </CustomText>
          </View>
        </View>

        {isGameFinished ? (
          <View style={styles.completedContainer}>
            <CustomText style={styles.completedText}>Game completed</CustomText>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.updateScoreButton}
            onPress={() => openScoreModal(item)}
          >
            <CustomText style={styles.updateScoreText}>Update Score</CustomText>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.messageText}>Please <Text style={styles.linkText} onPress={() => router.push('/(user)')}>log in</Text> to view your favorite games</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <LoadingIndicator message='Loading your games...' />
    );
  }

  return (
    <View style={styles.container}>
      {games.length > 0 ? (
        <>
          {renderDateFilter()}
          <FlatList
            data={filteredGames}
            renderItem={renderGame}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContainer}
          />

          {/* Using the reusable modal component */}
          {currentGame && (
            <UpdateScoreModal
              visible={modalVisible}
              onClose={() => setModalVisible(false)}
              onSubmit={submitScore}
              team1Name={currentGame.team1.name}
              team2Name={currentGame.team2.name}
              team1Score={team1Score}
              team2Score={team2Score}
              setTeam1Score={setTeam1Score}
              setTeam2Score={setTeam2Score}
              datetimeId={currentGame.datetime?.id || null}
              fieldId={currentGame.field?.id || null}
              setDatetimeId={() => {}} // Read-only for users
              setFieldId={() => {}} // Read-only for users
              readOnlyDateTimeField={true}
            />
          )}
        </>
      ) : (
        <View style={styles.centerContainer}>
          <Text style={styles.messageText}>
            No games found. Add some teams to your favorites list <Text
              onPress={() => router.push('/(user)')}
              style={styles.linkText}
            >here</Text>!
          </Text>
          <PrimaryButton
            title='Go back'
            onPress={() => router.back()}
            style={{ backgroundColor: '#000', padding: 12, width: 125 }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 15
  },
  linkText: {
    color: '#EA1D25',
    ...typography.heading5,
    textDecorationLine: 'underline'
  },
  messageText: {
    ...typography.heading5,
    color: '#00000066',
    textAlign: 'center',
  },
  // Date filter container
  dateFilterContainer: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    ...typography.textBold,
    color: '#333',
    marginRight: 12
  },
  dateScroll: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 7
  },
  dateButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  dateButtonText: {
    ...typography.textMedium,
    color: '#999999'
  },
  selectedDateButton: {
    backgroundColor: '#FE0000',
  },
  selectedDateText: {
    color: '#fff',
  },
  // Game List Container
  matchupContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamsSection: {
    flex: 3,
    justifyContent: 'space-between',
    gap: 10,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoresSection: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  listContainer: {
    paddingTop: 5,
    paddingHorizontal: 20,
    paddingBottom: 10
  },
  gameCard: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
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
    width: 100
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
    textAlign: 'right'
  },
  teamText: {
    ...typography.textLargeSemiBold,
    color: '#444',
  },
  highlightedTeam: {
    color: '#FE0000',
    fontWeight: '700',
  },
  teamLogo: {
    width: 27,
    height: 27,
    borderRadius: 18,
  },
  scoreText: {
    ...typography.heading4,
    color: '#333',
  },
  updateScoreButton: {
    alignItems: 'center',
  },
  updateScoreText: {
    ...typography.textSmallBold,
    color: '#EA1D25',
    textDecorationLine: 'underline'
  },
  completedContainer: {
    alignItems: 'center',
  },
  completedText: {
    ...typography.textSmallBold,
    color: '#276B5D', // Using a green color to indicate completion
  },
});

export default MyGames;