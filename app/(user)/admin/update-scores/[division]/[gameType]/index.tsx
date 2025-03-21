// app/(user)/admin/update-scores/[division]/[gameType]/index.tsx
import React, { useState, useCallback, useMemo } from 'react';
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
  UIManager
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { fonts } from '@/constants/Typography';
import AdminGameComponent from '@/components/AdminGameComponent';
import { useScheduleId } from '@/hooks/useGamesFilter';
import LoadingIndicator from '@/components/LoadingIndicator';
import { CustomUpdateScoresHeader } from '@/components/headers/CustomUpdateScoresHeader';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import AdminBottomActionButtons from '@/components/buttons/AdminBottomActionButtons';

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
  
  const { games, loading, error } = useScheduleId(divisionId, scheduleId, refreshKey);

  const [collapsedSections, setCollapsedSections] = useState<{[key: string]: boolean}>({});

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
              refreshGames();
            } catch (error) {
              console.error('Error marking all games as completed:', error);
              Alert.alert('Error', 'Failed to mark all games as completed');
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
              refreshGames();
            } catch (error) {
              console.error('Error resetting games:', error);
              Alert.alert('Error', 'Failed to reset games');
            }
          }
        }
      ]
    );
  };

  if (loading && (!games || games.length === 0)) {
    return <LoadingIndicator message='Loading games...' />;
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
      
      <SafeAreaView style={{ backgroundColor: "#EA1D25" }}>
        <CustomUpdateScoresHeader title={gameTypeTitle} />
      </SafeAreaView>

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
              onGameStatusChange={refreshGames}
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
      />

      {/* Bottom Action Buttons */}
      <AdminBottomActionButtons 
        leftButton={() => null}
        rightButton={() => null}
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
});