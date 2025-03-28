// components/PoolAdminView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,  
  ActivityIndicator, 
  FlatList,
  Alert, 
  RefreshControl
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { fonts } from '@/constants/Typography';
import AdminGameComponent from './AdminGameComponent';
import AdminBottomActionButtons from '../../buttons/AdminBottomActionButtons';

interface PoolAdminViewProps {
  poolId: number;
  divisionId: number;
}

const PoolAdminView: React.FC<PoolAdminViewProps> = ({ poolId, divisionId }) => {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false); // Separate loading state for actions
  const [refreshing, setRefreshing] = useState(false);
  const [updateCounter, setUpdateCounter] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch games for this pool
  const fetchPoolGames = useCallback(async () => {
    if (!actionLoading) setLoading(true); // Only show loading if not in middle of an action
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
      // Create a deep copy to ensure React detects the change
      const gamesWithUpdatedStatus = data?.map(game => ({
        ...game
      })) || [];
      setGames(gamesWithUpdatedStatus);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
      console.error('Error fetching games:', e);
    } finally {
      setLoading(false);
    }
  }, [divisionId, poolId, actionLoading]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPoolGames();
    setRefreshing(false);
  }, [fetchPoolGames]);

  useEffect(() => {
    fetchPoolGames();
  }, [fetchPoolGames, updateCounter]);

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
            setActionLoading(true);
            try {
              // For each game, see if it has a score record
              const updatePromises = games.map(async (game) => {
                if (game.scores && game.scores.length > 0) {
                  // Update existing score record
                  const { error } = await supabase
                    .from('scores')
                    .update({ is_finished: true })
                    .eq('id', game.scores[0].id);
                  
                  if (error) throw error;
                }
              });
              
              await Promise.all(updatePromises);
              
              // Update local state to reflect changes before re-fetching
              const updatedGames = games.map(game => {
                if (game.scores && game.scores.length > 0) {
                  return {
                    ...game,
                    scores: [{
                      ...game.scores[0],
                      is_finished: true
                    }]
                  };
                }
                return game;
              });
              
              setGames(updatedGames);
              
              // Force a refresh by incrementing the update counter
              setUpdateCounter(prev => prev + 1);
            } catch (error) {
              console.error('Error marking all games as completed:', error);
              Alert.alert('Error', 'Failed to mark all games as completed');
            } finally {
              setActionLoading(false);
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
      'Are you sure you want to reset all games? This will reset scores and mark games as not completed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: async () => {
            setActionLoading(true);
            try {
              // Get all score IDs associated with these games
              const scoreIds = games
                .filter(game => game.scores && game.scores.length > 0)
                .map(game => game.scores[0].id);
              
              if (scoreIds.length > 0) {
                // Update score records to reset them
                const { error } = await supabase
                  .from('scores')
                  .update({ 
                    is_finished: false,
                    team1_score: 0,
                    team2_score: 0
                  })
                  .in('id', scoreIds);
                  
                if (error) throw error;
                
                // Update local state to reflect changes before re-fetching
                const updatedGames = games.map(game => {
                  if (game.scores && game.scores.length > 0) {
                    return {
                      ...game,
                      scores: [{
                        ...game.scores[0],
                        is_finished: false,
                        team1_score: 0,
                        team2_score: 0
                      }]
                    };
                  }
                  return game;
                });
                
                setGames(updatedGames);
              }
              
              // Force a refresh by incrementing the update counter
              setUpdateCounter(prev => prev + 1);
              Alert.alert('Success', 'All games have been reset');
            } catch (error) {
              console.error('Error resetting games:', error);
              Alert.alert('Error', 'Failed to reset games');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleGameStatusChange = useCallback(() => {
    // Force a refresh by incrementing the update counter
    setUpdateCounter(prev => prev + 1);
  }, []);

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
      {actionLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#EA1D25" />
        </View>
      )}
      <FlatList
        data={games}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <AdminGameComponent 
            game={item} 
            onGameStatusChange={handleGameStatusChange}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#EA1D25"]}
            tintColor="#EA1D25"
          />
        }
        contentContainerStyle={styles.gamesList}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No games found for this pool</Text>
          </View>
        )}
        extraData={[updateCounter, games]}
      />

      {/* Bottom Action Buttons */}
      <AdminBottomActionButtons 
        leftButton={handleMarkAllCompleted}
        rightButton={handleResetAllGames}
        rightText='Reset All Games'
        leftText='Mark All Games as Completed'
        rightColor='#DDCF9B'
        leftColor='#ED8C22'
      />
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
    backgroundColor: '#000',
  },
  gamesList: {
    paddingHorizontal: 15,
    paddingTop: 3,
    paddingBottom: 15
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  errorText: {
    color: '#EA1D25',
    fontSize: 16,
    fontFamily: fonts.medium,
  },
});

export default PoolAdminView;