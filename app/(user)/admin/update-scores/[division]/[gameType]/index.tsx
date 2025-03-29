// app/(user)/admin/update-scores/[division]/[gameType]/index.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar, 
  SafeAreaView, 
  SectionList,
  Alert,
  LayoutAnimation, 
  Platform, 
  UIManager,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { fonts } from '@/constants/Typography';
import AdminGameComponent from '@/components/features/gameviews/AdminGameComponent';
import { useScheduleId } from '@/hooks/useGamesFilter';
import LoadingIndicator from '@/components/LoadingIndicator';
import { MaterialIcons } from '@expo/vector-icons';
import AdminBottomActionButtons from '@/components/buttons/AdminBottomActionButtons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomAdminHeader } from '@/components/headers/CustomAdminHeader';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function UpdateScoresScreen() {
  const params = useLocalSearchParams();
  const divisionId = Number(params.division);
  const scheduleId = Number(params.gameType);
  const gameTypeTitle = params.gameTypeTitle as string;
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Maintain our own games state locally
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false); // New - separate loading state for actions
  
  const [collapsedSections, setCollapsedSections] = useState<{[key: string]: boolean}>({});

  const insets = useSafeAreaInsets();

  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

  // Fetch games function
  const fetchGames = useCallback(async () => {
    if (!actionLoading) setLoading(true); // Only show loading if not in middle of an action
    try {
              const { data, error: fetchError } = await supabase
        .from('games')
        .select(`
          *,
          datetime: datetime_id (*),
          team1: team1_id (*),
          team2: team2_id (*),
          scores(*),
          rounds: round_id (*)
        `)
        .eq('division_id', divisionId)
        .eq('gametype_id', scheduleId)
        .order('id');
      
      if (fetchError) throw fetchError;
      setGames(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load games');
      console.error('Error fetching games:', err);
    } finally {
      setLoading(false);
    }
  }, [divisionId, scheduleId, actionLoading]);

  // Initial fetch
  useEffect(() => {
    fetchGames();
  }, [fetchGames, refreshKey]);

  const toggleSection = useCallback((sectionId: string) => {
    const animationConfig = {
      duration: 300,
      update: {
        duration: 300,
        property: LayoutAnimation.Properties.opacity,
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        duration: 200,
        property: LayoutAnimation.Properties.opacity,
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    };
    
    LayoutAnimation.configureNext(animationConfig);
    
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);

  const refreshGames = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Group games by round_id
  const sections = useMemo(() => {
    if (!games || games.length === 0) return [];
    
    // Create a map of round_id to games
    const roundsMap = games.reduce((acc, game) => {
      const roundId = game.round_id;
      if (!acc[roundId]) {
        acc[roundId] = {
          title: game.rounds?.stage || '',
          data: []
        };
      }
      acc[roundId].data.push(game);
      return acc;
    }, {});
    
    // Convert map to array sorted by round id
    return Object.keys(roundsMap)
      .map(roundId => roundsMap[roundId])
      .sort((a, b) => {
        // Get the first game's round_id from each section to compare
        const roundIdA = a.data[0].round_id;
        const roundIdB = b.data[0].round_id;
        return roundIdA - roundIdB;
      });
  }, [games]);

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
                  const { error: updateError } = await supabase
                    .from('scores')
                    .update({ is_finished: true })
                    .eq('id', game.scores[0].id);
                  
                  if (updateError) throw updateError;
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
              Alert.alert('Success', 'All games marked as completed');
            } catch (err) {
              console.error('Error marking all games as completed:', err);
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
      'Are you sure you want to reset all games? This will clear all scores and mark games as not completed.',
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
                const { error: updateError } = await supabase
                  .from('scores')
                  .update({ 
                    is_finished: false,
                    team1_score: 0,
                    team2_score: 0
                  })
                  .in('id', scoreIds);
                  
                if (updateError) throw updateError;
                
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
              
              Alert.alert('Success', 'All games have been reset');
            } catch (err) {
              console.error('Error resetting games:', err);
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
    // Refresh games when a game status changes
    refreshGames();
  }, [refreshGames]);

  if (loading && (!games || games.length === 0)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#EA1D25" />
      </View>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Error loading games: {error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#EA1D25" />
      
      <View style={{ 
        paddingTop: Platform.OS === 'android' ? statusBarHeight : insets.top,
        backgroundColor: '#EA1D25' 
      }}>
        <CustomAdminHeader title={gameTypeTitle} />
      </View>

      {/* Action loading overlay */}
      {actionLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#EA1D25" />
        </View>
      )}

      {/* Games List with Sections */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, section }) => {
          const sectionId = section.data[0].round_id.toString();
          if (collapsedSections[sectionId]) {
            return null; // Don't render items in collapsed sections
          }
          return (
            <AdminGameComponent 
              game={item} 
              onGameStatusChange={handleGameStatusChange}
            />
          );
        }}
        renderSectionHeader={({ section }) => {
          const sectionId = section.data[0].round_id.toString();
          const isCollapsed = collapsedSections[sectionId];
          
          return (
            <TouchableOpacity 
              style={styles.sectionHeader}
              activeOpacity={0.7}
              onPress={() => toggleSection(sectionId)}
            >
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
              {isCollapsed ? 
                <MaterialIcons name='keyboard-arrow-down' size={24} color='#fff' /> : 
                <MaterialIcons name='keyboard-arrow-left' size={24} color='#fff' /> }
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.gamesList}
        stickySectionHeadersEnabled={true}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No games found for this selection</Text>
          </View>
        )}
        extraData={[games, collapsedSections]} // Add extraData to ensure re-render when these states change
      />

      {/* Bottom Action Buttons */}
      <AdminBottomActionButtons 
        leftButton={handleMarkAllCompleted}
        rightButton={handleResetAllGames} // Updated to use handleResetAllGames
        rightText='Reset All Games'
        leftText='Mark All Games as Completed'
        rightColor='#DDCF9B'
        leftColor='#ED8C22'
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gamesList: {
    paddingHorizontal: 15,
    paddingBottom: 15
  },
  sectionHeader: {
    backgroundColor: '#1a0000',
    borderWidth: 1,
    borderColor: '#EA1D25',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15
  },
  sectionHeaderText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.semiBold,
  },
  expandIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandIconText: {
    color: '#fff',
    fontSize: 12,
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
});