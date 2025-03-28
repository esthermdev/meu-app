// components/AdminGameComponent.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Database } from '@/database.types';
import { formatDate } from '@/utils/formatDate';
import { formatTime } from '@/utils/formatTime';
import { typography } from '@/constants/Typography';
import { supabase } from '@/lib/supabase';
import { fonts } from '@/constants/Typography';
import UpdateScoreModal from '../modals/UpdateScoreModal';
import { updateGameScore } from '@/utils/updateGameScore';

type GamesRow = Database['public']['Tables']['games']['Row'];
type DatetimeRow = Database['public']['Tables']['datetime']['Row'];
type TeamRow = Database['public']['Tables']['teams']['Row'];
type ScoresRow = Database['public']['Tables']['scores']['Row'];

// Define the interface that matches what useRoundIds returns
interface FetchedGame extends GamesRow {
  team1: TeamRow | null;
  team2: TeamRow | null;
  datetime: DatetimeRow | null;
  scores: ScoresRow[] | null;
}

interface AdminGameComponentProps {
  game: FetchedGame;
  onGameStatusChange: () => void;
}

const AdminGameComponent: React.FC<AdminGameComponentProps> = ({ game, onGameStatusChange }) => {
  const [team1Score, setTeam1Score] = useState<string>('0');
  const [team2Score, setTeam2Score] = useState<string>('0');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Update the local state when the game prop changes
  useEffect(() => {
    if (game.scores && game.scores.length > 0) {
      setTeam1Score(game.scores[0].team1_score.toString());
      setTeam2Score(game.scores[0].team2_score.toString());
      setIsCompleted(game.scores[0].is_finished || false);
    } else {
      setTeam1Score('0');
      setTeam2Score('0');
      setIsCompleted(false);
    }
  }, [game]);

  const openScoreModal = () => {
    setModalVisible(true);
  };

  const submitScore = async (team1ScoreStr: string, team2ScoreStr: string) => {
    setIsLoading(true);

    // Update local state immediately for UI feedback
    setTeam1Score(team1ScoreStr);
    setTeam2Score(team2ScoreStr);

    const success = await updateGameScore({
      gameId: game.id,
      team1Score: team1ScoreStr,
      team2Score: team2ScoreStr,
      scoreId: game.scores && game.scores.length > 0 ? game.scores[0].id : null,
      roundId: game.round_id,
      onSuccess: () => {
        setModalVisible(false);
        onGameStatusChange();
      }
    });

    // If failed, we don't need to do anything special here as the UI is already showing
    // the updated scores that the user entered
    setIsLoading(false);

    // Close modal on failure too (UI already has user's input values)
    if (!success) {
      setModalVisible(false);
    }
  };

  const handleMarkCompleted = async () => {
    setIsLoading(true);

    try {
      if (game) {
        // Check if the game already has a score record
        if (game.scores && game.scores.length > 0) {
          // Update existing score record
          const { error } = await supabase
            .from('scores')
            .update({
              is_finished: true
            })
            .eq('id', game.scores[0].id);

          if (error) throw error;
        } else {
          // Create a new score record if none exists
          const { error } = await supabase
            .from('scores')
            .insert({
              game_id: game.id,
              team1_score: parseInt(team1Score),
              team2_score: parseInt(team2Score),
              is_finished: true,
              round_id: game.round_id
            });

          if (error) throw error;
        }

        // Update local state
        setIsCompleted(true);
        
        // Notify parent component to refresh
        onGameStatusChange();
      }
    } catch (error) {
      console.error('Error marking game as completed:', error);
      Alert.alert('Error', 'Failed to mark game as completed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.gameCard}>
      <View style={styles.gameHeader}>
        <Text style={styles.dateText}>{formatDate(game.datetime?.date, 'short')}</Text>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(game.datetime?.time)}</Text>
        </View>
        <Text style={styles.fieldText}>Field {game.field_id}</Text>
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
            <Text style={styles.teamText}>{game.team1?.name}</Text>
            <View style={styles.scoresSection}>
              <TextInput
                style={styles.scoreInput}
                value={team1Score}
                onChangeText={setTeam1Score}
                keyboardType="number-pad"
                editable={!isCompleted}
              />
            </View>
          </View>

          {/* Team 2 */}
          <View style={styles.teamRow}>
            <Image
              source={game.team2?.avatar_uri ? { uri: game.team2.avatar_uri } : require('@/assets/images/avatar-placeholder.png')}
              style={styles.teamLogo}
            />
            <Text style={styles.teamText}>{game.team2?.name}</Text>
            <View style={styles.scoresSection}>
              <TextInput
                style={styles.scoreInput}
                value={team2Score}
                onChangeText={setTeam2Score}
                keyboardType="number-pad"
                editable={!isCompleted}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.markCompletedButton,
            isCompleted && styles.completedButton
          ]}
          onPress={handleMarkCompleted}
          disabled={isCompleted || isLoading}
        >
          <Text style={[styles.buttonText, isCompleted ? { color: '#ED8C22' } : { color: '#242424' }]}>
            {isCompleted ? 'COMPLETED' : 'Mark Completed'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.updateScoreButton]}
          onPress={openScoreModal}
        >
          <Text style={styles.buttonText}>Update Score</Text>
        </TouchableOpacity>
      </View>

      {/* Reusable Score Update Modal */}
      <UpdateScoreModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={submitScore}
        team1Name={game.team1?.name || 'Team 1'}
        team2Name={game.team2?.name || 'Team 2'}
        team1Score={team1Score}
        team2Score={team2Score}
        setTeam1Score={setTeam1Score}
        setTeam2Score={setTeam2Score}
        isLoading={isLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  gameCard: {
    backgroundColor: '#2A2A2A',
    padding: 15,
    borderRadius: 12,
    gap: 12,
    marginTop: 12,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    ...typography.bodyBold,
    color: '#CCCCCC',
    width: 100,
  },
  timeContainer: {
    backgroundColor: '#EA1D253D',
    borderColor: '#EA1D25',
    borderWidth: 1,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  timeText: {
    ...typography.body,
    color: '#fff'
  },
  fieldText: {
    ...typography.bodyBold,
    color: '#CCCCCC',
    width: 100,
    textAlign: 'right',
  },
  matchupContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamsSection: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 15
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamLogo: {
    width: 30,
    height: 30,
    borderRadius: 14,
    marginRight: 8
  },
  teamText: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#FFF',
  },
  scoresSection: {
    flex: 2,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  scoreInput: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: fonts.bold,
    textAlign: 'right'
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markCompletedButton: {
    backgroundColor: '#ED8C22',
    borderColor: '#ED8C22',
    borderWidth: 1,
  },
  completedButton: {
    backgroundColor: '#242424',
    borderColor: '#ED8C22',
    borderWidth: 1,
  },
  updateScoreButton: {
    backgroundColor: '#CCCCCC',
    borderColor: '#CCCCCC',
    borderWidth: 1,
  },
  buttonText: {
    color: '#242424',
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
});

export default AdminGameComponent;