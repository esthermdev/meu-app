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
          </View>
          
          {/* Team 2 */}
          <View style={styles.teamRow}>
            <Image 
              source={game.team2?.avatar_uri ? { uri: game.team2.avatar_uri } : require('@/assets/images/avatar-placeholder.png')} 
              style={styles.teamLogo} 
            />
            <Text style={styles.teamText}>{game.team2?.name}</Text>
          </View>
        </View>
        
        {/* Right side: Scores */}
        <View style={styles.scoresSection}>
          <TextInput
            style={styles.scoreInput}
            value={team1Score}
            onChangeText={setTeam1Score}
            keyboardType="number-pad"
            editable={!isCompleted}
          />
          <TextInput
            style={styles.scoreInput}
            value={team2Score}
            onChangeText={setTeam2Score}
            keyboardType="number-pad"
            editable={!isCompleted}
          />
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
          <Text style={styles.buttonText}>
            {isCompleted ? 'COMPLETED' : 'Mark Completed'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.updateScoreButton]}
          onPress={handleUpdateScore}
          disabled={isCompleted || isLoading}
        >
          <Text style={styles.buttonText}>Update Score</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gameCard: {
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    ...typography.bodyBold,
    color: '#999',
    width: 100,
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
    color: '#65B891',
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
    gap: 16,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  teamText: {
    ...typography.bodyBold,
    color: '#FFF',
  },
  scoresSection: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
  },
  scoreInput: {
    width: 50,
    height: 40,
    backgroundColor: '#3A3A3A',
    borderRadius: 8,
    color: '#FFF',
    textAlign: 'center',
    fontSize: 20,
    fontFamily: fonts.bold,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markCompletedButton: {
    backgroundColor: '#FF9500',
    marginRight: 8,
  },
  completedButton: {
    backgroundColor: '#65B891',
  },
  updateScoreButton: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: '#FFF',
    fontFamily: fonts.medium,
    fontSize: 14,
  },
});

export default AdminGameComponent;