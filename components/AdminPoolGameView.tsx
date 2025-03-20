// components/PoolAdminView.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  FlatList,
  Alert 
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { fonts } from '@/constants/Typography';
import AdminGameComponent from './AdminGameComponent';
import { router } from 'expo-router';

interface PoolAdminViewProps {
  poolId: number;
  divisionId: number;
}

const PoolAdminView: React.FC<PoolAdminViewProps> = ({ poolId, divisionId }) => {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch games for this pool
  const fetchPoolGames = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          datetime: datetime_id (*),
          team1: team1_id (*),
          team2: team2_id (*),
          scores(*)
        `)
        .eq('division_id', divisionId)
        .eq('pool_id', poolId)
        .order('id');
      
      if (error) throw error;
      setGames(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoolGames();
  }, [divisionId, poolId]);

  // Handle marking all games as completed
  const handleMarkAllCompleted = async () => {
    Alert.alert(
      'Confirm',
      'Are you sure you want to mark all games as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: async () => {
            setLoading(true);
            try {
              // For each game, see if it has a score record
              for (const game of games) {
                if (game.scores && game.scores.length > 0) {
                  // Update existing score record
                  await supabase
                    .from('scores')
                    .update({ is_finished: true })
                    .eq('id', game.scores[0].id);
                } else {
                  // Create new score record
                  await supabase
                    .from('scores')
                    .insert({
                      game_id: game.id,
                      team1_score: 0,
                      team2_score: 0,
                      is_finished: true,
                      round_id: game.round_id
                    });
                }
              }
              
              Alert.alert('Success', 'All games marked as completed');
              fetchPoolGames(); // Refresh the list
            } catch (error) {
              console.error('Error marking all games as completed:', error);
              Alert.alert('Error', 'Failed to mark all games as completed');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Handle resetting all games
  const handleResetAllGames = async () => {
    Alert.alert(
      'Confirm Reset',
      'Are you sure you want to reset all games? This will clear all scores and mark games as not completed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: async () => {
            setLoading(true);
            try {
              // Get all score IDs associated with these games
              const scoreIds = games
                .filter(game => game.scores && game.scores.length > 0)
                .map(game => game.scores[0].id);
              
              if (scoreIds.length > 0) {
                // Delete all score records
                await supabase
                  .from('scores')
                  .delete()
                  .in('id', scoreIds);
              }
              
              Alert.alert('Success', 'All games have been reset');
              fetchPoolGames(); // Refresh the list
            } catch (error) {
              console.error('Error resetting games:', error);
              Alert.alert('Error', 'Failed to reset games');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading && games.length === 0) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color="#EA1D25" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.errorText}>Error loading games: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Games List */}
      <FlatList
        data={games}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <AdminGameComponent 
            game={item} 
            onGameStatusChange={fetchPoolGames}
          />
        )}
        contentContainerStyle={styles.gamesList}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No games found for this pool</Text>
          </View>
        )}
      />

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={handleResetAllGames}
        >
          <Text style={styles.resetButtonText}>Reset All Games</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.completeAllButton}
          onPress={handleMarkAllCompleted}
        >
          <Text style={styles.completeAllButtonText}>Mark All Games as Completed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gamesList: {
    padding: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontFamily: fonts.medium,
    fontSize: 16,
    textAlign: 'center',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#151515',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#E5D9B6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  resetButtonText: {
    color: '#000',
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  completeAllButton: {
    flex: 1,
    backgroundColor: '#FF9500',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  completeAllButtonText: {
    color: '#fff',
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  errorText: {
    color: '#EA1D25',
    fontSize: 16,
    fontFamily: fonts.medium,
  },
});

export default PoolAdminView;