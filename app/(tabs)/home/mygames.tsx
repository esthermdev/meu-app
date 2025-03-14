// app/(tabs)/home/mygames.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Image,
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

type GamesRow = Database['public']['Tables']['games']['Row'];
type DatetimeRow = Database['public']['Tables']['datetime']['Row'];
type TeamRow = Database['public']['Tables']['teams']['Row'];
type ScoresRow = Database['public']['Tables']['scores']['Row'];

interface Games extends GamesRow {
  datetime: DatetimeRow | null;
  team1: TeamRow;
  team2: TeamRow;
  scores?: ScoresRow[];
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
      // Extract unique dates from games
      const uniqueDates = [...new Set(games.map(game => game.datetime?.date || ''))];
      uniqueDates.sort(); // Sort dates chronologically
      setDates(uniqueDates);
      
      // Set first date as selected by default
      if (uniqueDates.length > 0 && !selectedDate) {
        setSelectedDate(uniqueDates[0]);
      }
    }
  }, [games]);

  useEffect(() => {
    // Filter games by selected date
    if (selectedDate) {
      const filtered = games.filter(game => game.datetime?.date === selectedDate);
      setFilteredGames(filtered);
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
          scores(*)
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
  console.log('Game data structure:', JSON.stringify(games[0], null, 2));

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    if (session) {
      fetchFavoriteGames(session.user.id).finally(() => setRefreshing(false));
    } else {
      setRefreshing(false);
    }
  }, [session]);

  const handleUpdateScore = (game: Games) => {
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

  const submitScore = async () => {
    if (!currentGame) return;
    
    try {
      // Check if score record exists for this game
      const { data, error: checkError } = await supabase
        .from('scores')
        .select('*')
        .eq('game_id', currentGame.id);
      
      if (checkError) throw checkError;
      
      let result;
      
      if (data && data.length > 0) {
        // Update existing score
        result = await supabase
          .from('scores')
          .update({
            team1_score: parseInt(team1Score),
            team2_score: parseInt(team2Score),
          })
          .eq('game_id', currentGame.id);
      } else {
        // Insert new score
        result = await supabase
          .from('scores')
          .insert({
            game_id: currentGame.id,
            team1_score: parseInt(team1Score),
            team2_score: parseInt(team2Score),
          });
      }
      
      if (result.error) throw result.error;
      
      // Update the local state
      const updatedGames = games.map(game => {
        if (game.id === currentGame.id) {
          // Create proper structure for scores array
          const updatedScores = game.scores && game.scores.length > 0 
            ? [...game.scores] // Copy existing scores array
            : []; // Create new array if none exists
            
          if (updatedScores.length > 0) {
            // Update first score in array
            updatedScores[0] = {
              ...updatedScores[0],
              team1_score: parseInt(team1Score),
              team2_score: parseInt(team2Score),
              game_id: currentGame.id
            };
          } else {
            // Add new score to array
            updatedScores.push({
              team1_score: parseInt(team1Score),
              team2_score: parseInt(team2Score),
              game_id: currentGame.id,
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
        if (game.id === currentGame.id) {
          const found = updatedGames.find(g => g.id === game.id);
          return found || game;
        }
        return game;
      }));

      setModalVisible(false);
      
    } catch (error) {
      console.error('Error updating score:', error);
      Alert.alert('Error', 'Failed to update score');
    }
  };

  const renderDateFilter = () => (
    <View style={styles.dateFilterContainer}>
      <Text style={styles.dateLabel}>Date</Text>
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
            <Text style={[
              styles.dateButtonText,
              selectedDate === date && styles.selectedDateText
            ]}>
              {formatDate(date, 'short')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderGame = ({ item }: { item: Games }) => (
    <View style={styles.gameCard}>
      <View style={styles.gameHeader}>
        <Text style={styles.dateText}>{formatDate(item.datetime?.date, 'short')}</Text>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(item.datetime?.time)}</Text>
        </View>
        <Text style={styles.fieldText}>Field {item.field_id}</Text>
      </View>
      
      {/* Team 1 Container */}
      <View style={styles.teamsContainer}>
        <View style={styles.teamSideLeft}>
          <Text 
            style={[
              styles.teamText, 
              favoriteTeamIds.includes(item.team1.id) && styles.highlightedTeam
            ]}
          >
            {item.team1.name}
          </Text>
        </View>
        <Image 
          source={item.team1.avatar_uri ? { uri: item.team1.avatar_uri } : require('@/assets/images/avatar-placeholder.png')} 
          style={styles.teamLogo} 
        />
        
        {/* Scores Container */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>
            {item.scores && item.scores[0] ? item.scores[0].team1_score : 0} : {item.scores && item.scores[0] ? item.scores[0].team2_score : 0}
          </Text>
        </View>
        
        {/* Team 2 Container */}
        <Image 
          source={item.team2.avatar_uri ? { uri: item.team2.avatar_uri } : require('@/assets/images/avatar-placeholder.png')} 
          style={styles.teamLogo} 
        />
        <View style={styles.teamSideRight}>
          <Text 
            style={[
              styles.teamText,
              favoriteTeamIds.includes(item.team2.id) && styles.highlightedTeam
            ]}
          >
            {item.team2.name}
          </Text>
        </View>

      </View>
      
      <TouchableOpacity 
        style={styles.updateScoreButton} 
        onPress={() => handleUpdateScore(item)}
      >
        <Text style={styles.updateScoreText}>Update Score</Text>
      </TouchableOpacity>
    </View>
  );

  const renderScoreUpdateModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Update Score</Text>
          
          <View>
            <View style={styles.teamScoreRow}>
              <Text style={styles.modalTeamName}>{currentGame?.team1.name}</Text>
              <TextInput
                style={styles.scoreInput}
                keyboardType="number-pad"
                value={team1Score}
                onChangeText={setTeam1Score}
                maxLength={3}
              />
            </View>
            
            <View style={styles.teamScoreRow}>
              <Text style={styles.modalTeamName}>{currentGame?.team2.name}</Text>
              <TextInput
                style={styles.scoreInput}
                keyboardType="number-pad"
                value={team2Score}
                onChangeText={setTeam2Score}
                maxLength={3}
              />
            </View>
          </View>
          
          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.updateButton}
              onPress={submitScore}
            >
              <Text style={styles.buttonText}>Update Score</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (!session) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.messageText}>Please log in to view your favorite games</Text>
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
          {renderScoreUpdateModal()}
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
    backgroundColor: '#f5f5f5',
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
    ...typography.h5,
    textDecorationLine: 'underline'
  },
  messageText: {
    ...typography.h5,
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
    ...typography.bodyMedium,
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
    ...typography.bodyMedium,
    color: '#999999'
  },
  selectedDateButton: {
    backgroundColor: '#FE0000',
  },
  selectedDateText: {
    color: 'white',
  },
  // Game List Container
  listContainer: {
    paddingTop: 5,
    paddingHorizontal: 20,
    paddingBottom: 10
  },
  gameCard: {
    backgroundColor: 'white',
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
    ...typography.bodyBold,
    color: '#999'
  },
  timeContainer: {
    backgroundColor: '#999',
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  timeText: {
    ...typography.body,
    color: '#fff'
  },
  fieldText: {
    ...typography.bodyBold,
    color: '#276B5D',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamSideLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginRight: 8
  },
  teamSideRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginLeft: 8
  },
  teamText: {
    ...typography.bodyMedium,
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
  scoreContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 10
  },
  scoreText: {
    ...typography.h3,
    color: '#333',
  },
  updateScoreButton: {
    alignItems: 'center',
  },
  updateScoreText: {
    ...typography.bodySmall,
    color: '#EA1D25',
    textDecorationLine: 'underline'
  },
  // Modal styles
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    ...typography.h4,
    marginBottom: 15
  },
  teamScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTeamName: {
    ...typography.h5,
    flex: 1,
  },
  scoreInput: {
    width: 48,
    height: 40,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    textAlign: 'center',
    ...typography.h5,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#000000',
    padding: 12,
    borderRadius: 6,
    width: '48%',
    justifyContent: 'center',
  },
  updateButton: {
    backgroundColor: '#EA1D25',
    padding: 12,
    borderRadius: 6,
    width: '48%',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    ...typography.bodyMedium
  },
});

export default MyGames;