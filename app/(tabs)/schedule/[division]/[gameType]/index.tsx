// app/(user)/admin/update-scores/[division]/[gameType]/index.tsx
import { useCallback, useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import ComingSoonPlaceholder from '@/components/ComingSoonPlaceholder';
import CustomText from '@/components/CustomText';
import GameComponent from '@/components/features/gameviews/GameComponent';
import { CustomHeader } from '@/components/headers/CustomHeader';
import LoadingIndicator from '@/components/LoadingIndicator';
import { typography } from '@/constants/Typography';
import { useGamesBySchedule } from '@/hooks/useGamesData';

import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  const { games, loading, error, refreshData } = useGamesBySchedule(divisionId, scheduleId);

  const [collapsedSections, setCollapsedSections] = useState<{
    [key: string]: boolean;
  }>({});

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

    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
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
          data: [],
        };
      }
      acc[roundId].data.push(game);
      return acc;
    }, {});

    // Convert map to array sorted by round id
    return Object.keys(roundsMap)
      .map((roundId) => roundsMap[roundId])
      .sort((a, b) => {
        // Get the first game's round_id from each section to compare
        const roundIdA = a.data[0].round_id;
        const roundIdB = b.data[0].round_id;
        return roundIdA - roundIdB;
      });
  }, [games]);

  if (loading && (!games || games.length === 0)) {
    return <LoadingIndicator message="Loading games..." />;
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
      <CustomHeader title={gameTypeTitle} refreshInfo />
      {/* Games List with Sections */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, section }) => {
          const sectionId = section.data[0].round_id.toString();
          if (collapsedSections[sectionId]) {
            return null; // Don't render items in collapsed sections
          }
          return <GameComponent game={item} />;
        }}
        renderSectionHeader={({ section }) => {
          const sectionId = section.data[0].round_id.toString();
          const isCollapsed = collapsedSections[sectionId];

          return (
            <TouchableOpacity style={styles.sectionHeader} activeOpacity={0.7} onPress={() => toggleSection(sectionId)}>
              <CustomText style={styles.sectionHeaderText}>{section.title}</CustomText>
              {isCollapsed ? (
                <MaterialIcons name="keyboard-arrow-down" size={24} color="#fff" />
              ) : (
                <MaterialIcons name="keyboard-arrow-left" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.gamesList}
        stickySectionHeadersEnabled={true}
        ListEmptyComponent={() => (
          <ComingSoonPlaceholder message="No games scheduled for this game type" iconName="event-note" />
        )}
        onRefresh={refreshData}
        refreshing={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#888',
    ...typography.textMedium,
    textAlign: 'center',
  },
  errorText: {
    color: '#EA1D25',
    ...typography.textMedium,
  },
  gamesList: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionHeader: {
    alignItems: 'center',
    backgroundColor: '#EA1D25',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    padding: 10,
  },
  sectionHeaderText: {
    color: '#fff',
    ...typography.textLargeSemiBold,
  },
});
