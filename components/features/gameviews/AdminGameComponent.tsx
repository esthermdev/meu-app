// components/AdminGameComponent.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Database } from '@/database.types';
import { formatDate } from '@/utils/formatDate';
import { formatTime } from '@/utils/formatTime';
import { typography } from '@/constants/Typography';
import { supabase } from '@/lib/supabase';
import { fonts } from '@/constants/Typography';

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
  const [team1Score, setTeam1Score] = useState<string>(
    game.scores && game.scores[0] ? game.scores[0].team1_score.toString() : '0'
  );
  const [team2Score, setTeam2Score] = useState<string>(
    game.scores && game.scores[0] ? game.scores[0].team2_score.toString() : '0'
  );
  const [isCompleted, setIsCompleted] = useState<boolean>(
    game.scores && game.scores[0] ? game.scores[0].is_finished || false : false
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const handleUpdateScore = async () => {
    setIsLoading(true);
    
    try {
      // Check if score record exists
      if (game.scores && game.scores.length > 0) {
        // Update existing score
        const { error } = await supabase
          .from('scores')
          .update({
            team1_score: parseInt(team1Score),
            team2_score: parseInt(team2Score),
          })
          .eq('id', game.scores[0].id);
          
        if (error) throw error;
      } else {
        // Create new score record
        const { error } = await supabase
          .from('scores')
          .insert({
            game_id: game.id,
            team1_score: parseInt(team1Score),
            team2_score: parseInt(team2Score),
            is_finished: false,
            round_id: game.round_id
          });
          
        if (error) throw error;
      }
      
      setModalVisible(false);
      Alert.alert('Success', 'Score updated successfully');
      onGameStatusChange();
    } catch (error) {
      console.error('Error updating score:', error);
      Alert.alert('Error', 'Failed to update score');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkCompleted = async () => {
    setIsLoading(true);
    
    try {
      if (game.scores && game.scores.length > 0) {
        // Update existing score record
        const { error } = await supabase
          .from('scores')
          .update({
            is_finished: true
          })
          .eq('id', game.scores[0].id);
          
        if (error) throw error;
        
        setIsCompleted(true);
        Alert.alert('Success', 'Game marked as completed');
        onGameStatusChange();
      } else {
        // Create new score record and mark as completed
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
        
        setIsCompleted(true);
        Alert.alert('Success', 'Game marked as completed');
        onGameStatusChange();
      }
    } catch (error) {
      console.error('Error marking game as completed:', error);
      Alert.alert('Error', 'Failed to mark game as completed');
    } finally {
      setIsLoading(false);
    }
  };

  const openScoreModal = () => {
    setModalVisible(true);
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
          <Text style={[styles.buttonText, isCompleted ? { color: '#ED8C22' } : { color: '#242424' } ]}>
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

      {/* Score Update Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Score</Text>
            
            {/* Team 1 Score */}
            <View style={styles.modalTeamContainer}>
              <Text style={styles.modalTeamName}>{game.team1?.name || 'Team 1'}</Text>
              <View style={styles.modalScoreInputContainer}>
                <TextInput
                  style={styles.modalScoreInput}
                  keyboardType="number-pad"
                  value={team1Score}
                  onChangeText={setTeam1Score}
                  maxLength={2}
                />
              </View>
            </View>
            
            {/* Team 2 Score */}
            <View style={styles.modalTeamContainer}>
              <Text style={styles.modalTeamName}>{game.team2?.name || 'Team 2'}</Text>
              <View style={styles.modalScoreInputContainer}>
                <TextInput
                  style={styles.modalScoreInput}
                  keyboardType="number-pad"
                  value={team2Score}
                  onChangeText={setTeam2Score}
                  maxLength={2}
                />
              </View>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
                disabled={isLoading}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalUpdateButton}
                onPress={handleUpdateScore}
                disabled={isLoading}
              >
                <Text style={styles.modalUpdateButtonText}>Update Score</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    color: '#fff',
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
    color: '#fff',
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
  },
  completedButton: {
    backgroundColor: '#242424',
    borderColor: '#ED8C22',
    borderWidth: 1,
  },
  updateScoreButton: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: '#242424',
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
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
  modalTeamContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTeamName: {
    ...typography.h5,
    flex: 1,
  },
  modalScoreInputContainer: {
    width: 48,
    height: 40,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  modalScoreInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    ...typography.h5,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    backgroundColor: '#000000',
    padding: 12,
    borderRadius: 6,
    width: '48%',
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    color: 'white',
    textAlign: 'center',
    ...typography.bodyMedium
  },
  modalUpdateButton: {
    backgroundColor: '#EA1D25',
    padding: 12,
    borderRadius: 6,
    width: '48%',
    justifyContent: 'center',
  },
  modalUpdateButtonText: {
    color: 'white',
    textAlign: 'center',
    ...typography.bodyMedium
  },
});

export default AdminGameComponent;