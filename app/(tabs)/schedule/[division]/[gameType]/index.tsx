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
import GameComponent from '@/components/GameComponent';
import CustomHeader from '@/components/headers/CustomHeader';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function ScheduleScreen() {
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
      <CustomHeader title={gameTypeTitle} />
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
            <GameComponent game={item} />
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
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gamesList: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20
  },
  sectionHeader: {
    backgroundColor: '#EA1D25',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10
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