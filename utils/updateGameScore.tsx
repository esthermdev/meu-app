// utils/gameScoreUtils.ts
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';

interface UpdateScoreParams {
  gameId: number;
  team1Score: string | number;
  team2Score: string | number;
  scoreId?: number | null;  // Optional, used if we're updating an existing score
  roundId?: number | null;  // Optional, for creating new scores
  onSuccess?: () => void;   // Callback for successful operations
}

export const updateGameScore = async ({
  gameId,
  team1Score,
  team2Score,
  scoreId,
  roundId,
  onSuccess
}: UpdateScoreParams): Promise<boolean> => {
  try {
    // Convert scores to numbers if they're strings
    const team1ScoreNum = typeof team1Score === 'string' ? parseInt(team1Score) : team1Score;
    const team2ScoreNum = typeof team2Score === 'string' ? parseInt(team2Score) : team2Score;
    
    // First, check if we already know if the score exists (via scoreId)
    if (scoreId) {
      // Update existing score
      const { error } = await supabase
        .from('scores')
        .update({
          team1_score: team1ScoreNum,
          team2_score: team2ScoreNum,
        })
        .eq('id', scoreId);
        
      if (error) throw error;
    } else {
      // Check if score record exists for this game
      const { data, error: checkError } = await supabase
        .from('scores')
        .select('id')
        .eq('game_id', gameId);
      
      if (checkError) throw checkError;
      
      if (data && data.length > 0) {
        // Update existing score
        const { error } = await supabase
          .from('scores')
          .update({
            team1_score: team1ScoreNum,
            team2_score: team2ScoreNum,
          })
          .eq('game_id', gameId);
          
        if (error) throw error;
      } else {
        // Create new score record
        const { error } = await supabase
          .from('scores')
          .insert({
            game_id: gameId,
            team1_score: team1ScoreNum,
            team2_score: team2ScoreNum,
            is_finished: false,
            round_id: roundId
          });
          
        if (error) throw error;
      }
    }
    
    // Call success callback if provided
    if (onSuccess) {
      onSuccess();
    }
    
    return true;
  } catch (error) {
    console.error('Error updating game score:', error);
    Alert.alert('Error', 'Failed to update score');
    return false;
  }
};