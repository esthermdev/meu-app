import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
  ScrollView,
  SectionList,
  Alert,
  LayoutAnimation,
  UIManager,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useGameTypesByDivision } from '@/hooks/useScheduleConfig';
import { fonts, typography } from '@/constants/Typography';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomAdminHeader } from '@/components/headers/CustomAdminHeader';
import CustomText from '@/components/CustomText';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/database.types';
import AdminGameComponent from '@/components/features/gameviews/AdminGameComponent';
import { MaterialIcons } from '@expo/vector-icons';
import AdminBottomActionButtons from '@/components/buttons/AdminBottomActionButtons';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

type GamesRow = Database['public']['Tables']['games']['Row'];
type DatetimeRow = Database['public']['Tables']['datetime']['Row'];
type TeamRow = Database['public']['Tables']['teams']['Row'];
type ScoresRow = Database['public']['Tables']['scores']['Row'];
type FieldsRow = Database['public']['Tables']['fields']['Row'];
type RoundsRow = Database['public']['Tables']['rounds']['Row'];
type PoolsRow = Database['public']['Tables']['pools']['Row'];
interface Games extends GamesRow {
  datetime: DatetimeRow | null;
  team1: TeamRow | null;
  team2: TeamRow | null;
  scores: ScoresRow[] | null;
  field: FieldsRow | null;
  rounds: RoundsRow | null;
  pool: PoolsRow | null;
}

export default function GameTypesScreen() {
  const params = useLocalSearchParams();
  const divisionId = Number(params.division);
  const divisionName = params.divisionName as string;

  const { gametypes, loading: gametypesLoading, error } = useGameTypesByDivision(divisionId);
  const [selectedGameType, setSelectedGameType] = useState<number | null>(null);
  const [games, setGames] = useState<Games[]>([]);
  const [filteredGames, setFilteredGames] = useState<Games[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<{
    [key: string]: boolean;
  }>({});
  const [refreshKey, setRefreshKey] = useState(0);

  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

  // Set first game type as selected when gametypes load
  useEffect(() => {
    if (gametypes && gametypes.length > 0 && !selectedGameType) {
      setSelectedGameType(gametypes[0].id);
    }
  }, [gametypes, selectedGameType]);

  // Fetch all games for the division
  const fetchGames = useCallback(async () => {
    if (!divisionId) return;

    try {
      if (!actionLoading) setGamesLoading(true);
      const { data, error: fetchError } = await supabase
        .from('games')
        .select(
          `
          *,
          datetime: datetime_id (*),
          team1: team1_id (*),
          team2: team2_id (*),
          scores(*),
          rounds: round_id (*),
          field: field_id (*),
          pool: pool_id (*)
        `,
        )
        .eq('division_id', divisionId)
        .order('round_id, id');

      if (fetchError) throw fetchError;
      setGames(data as unknown as Games[]);
    } catch (e) {
      console.error('Error fetching games:', e);
      Alert.alert('Error', 'Failed to load games');
    } finally {
      setGamesLoading(false);
    }
  }, [divisionId, actionLoading]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames, refreshKey]);

  // Filter games by selected game type
  useEffect(() => {
    if (selectedGameType !== null) {
      const filtered = games.filter((game) => game.gametype_id === selectedGameType);
      setFilteredGames(filtered);
    } else {
      setFilteredGames(games);
    }
  }, [selectedGameType, games]);

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

  const refreshGames = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Group games by round_id
  const sections = useMemo(() => {
    if (!filteredGames || filteredGames.length === 0) return [];

    // determine if selected gametype is poolplay
    const selectedGametypes = gametypes || [];
    const selectedGt = selectedGametypes.find((gt) => gt.id === selectedGameType);
    const isPoolPlay = selectedGt?.route === 'poolplay';

    if (isPoolPlay) {
      // Group by pool_id
      const poolsMap = filteredGames.reduce(
        (acc, game) => {
          const poolId = game.pool_id;
          const key = poolId ?? -1;
          if (!acc[key]) {
            acc[key] = {
              title: game.pool?.name ? `Pool ${game.pool.name}` : (game.pool?.name ?? 'No Pool'),
              data: [] as Games[],
              poolId: poolId,
            };
          }
          acc[key].data.push(game);
          return acc;
        },
        {} as Record<number, { title: string; data: Games[]; poolId: number | null }>,
      );

      return Object.keys(poolsMap)
        .map((k) => ({
          id: `pool-${String(poolsMap[Number(k)].poolId ?? 'none')}`,
          title: poolsMap[Number(k)].title,
          data: poolsMap[Number(k)].data,
          poolId: poolsMap[Number(k)].poolId,
          roundId: null,
        }))
        .sort((a, b) => {
          const aId = a.poolId ?? 0;
          const bId = b.poolId ?? 0;
          return aId - bId;
        });
    }

    // Fallback: Group by round_id
    const roundsMap = filteredGames.reduce(
      (acc, game) => {
        const roundId = game.round_id;
        if (roundId === null) return acc;

        if (!acc[roundId]) {
          acc[roundId] = {
            title: game.rounds?.stage || '',
            data: [],
          };
        }
        acc[roundId].data.push(game);
        return acc;
      },
      {} as Record<number, { title: string; data: Games[] }>,
    );

    // Convert map to array sorted by round id
    return Object.keys(roundsMap)
      .map((roundId) => ({
        id: `round-${String(roundId)}`,
        title: roundsMap[Number(roundId)].title,
        data: roundsMap[Number(roundId)].data,
        roundId: Number(roundId),
        poolId: null,
      }))
      .sort((a, b) => {
        const roundIdA = a.roundId ?? 0;
        const roundIdB = b.roundId ?? 0;
        return roundIdA - roundIdB;
      });
  }, [filteredGames, gametypes, selectedGameType]);

  // whether selected gametype is poolplay — used in renderers
  const isPoolPlay = useMemo(() => {
    const selectedGt = (gametypes || []).find((gt) => gt.id === selectedGameType);
    return selectedGt?.route === 'poolplay';
  }, [gametypes, selectedGameType]);

  // Handle marking all games as completed
  const handleMarkAllCompleted = async () => {
    Alert.alert('Confirm', 'Are you sure you want to mark all games as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes',
        onPress: async () => {
          setActionLoading(true);
          try {
            const updatePromises = filteredGames.map(async (game) => {
              if (game.scores && game.scores.length > 0) {
                const { error: updateError } = await supabase
                  .from('scores')
                  .update({ is_finished: true })
                  .eq('id', game.scores[0].id);

                if (updateError) throw updateError;
              }
            });

            await Promise.all(updatePromises);

            // Update local state
            const updatedGames = games.map((game) => {
              if (game.scores && game.scores.length > 0 && filteredGames.find((fg) => fg.id === game.id)) {
                return {
                  ...game,
                  scores: [
                    {
                      ...game.scores[0],
                      is_finished: true,
                    },
                  ],
                };
              }
              return game;
            });

            setGames(updatedGames);
            Alert.alert('Success', 'All games marked as completed');
          } catch (err) {
            console.error('Error marking games as completed:', err);
            Alert.alert('Error', 'Failed to mark games as completed');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
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
              const scoreIds = filteredGames
                .filter((game) => game.scores && game.scores.length > 0)
                .map((game) => game.scores![0].id);

              if (scoreIds.length > 0) {
                const { error: updateError } = await supabase
                  .from('scores')
                  .update({
                    is_finished: false,
                    team1_score: 0,
                    team2_score: 0,
                  })
                  .in('id', scoreIds);

                if (updateError) throw updateError;

                // Update local state
                const updatedGames = games.map((game) => {
                  if (game.scores && game.scores.length > 0 && filteredGames.find((fg) => fg.id === game.id)) {
                    return {
                      ...game,
                      scores: [
                        {
                          ...game.scores[0],
                          is_finished: false,
                          team1_score: 0,
                          team2_score: 0,
                        },
                      ],
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
          },
        },
      ],
    );
  };

  const renderGameTypeFilter = () => (
    <View style={styles.filterContainer}>
      <CustomText style={styles.filterLabel}>Stage</CustomText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {gametypes.map((gametype) => (
          <TouchableOpacity
            key={gametype.id}
            style={[styles.filterButton, selectedGameType === gametype.id && styles.selectedFilterButton]}
            onPress={() => setSelectedGameType(gametype.id)}>
            <CustomText
              style={[styles.filterButtonText, selectedGameType === gametype.id && styles.selectedFilterText]}>
              {gametype.title}
            </CustomText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (gametypesLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#EA1D25" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <CustomText style={styles.errorText}>Error loading game types: {error}</CustomText>
      </SafeAreaView>
    );
  }

  if (gamesLoading && (!games || games.length === 0)) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#000',
        }}>
        <ActivityIndicator size="large" color="#EA1D25" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#EA1D25" />
      <View
        style={{
          paddingTop: Platform.OS === 'android' ? statusBarHeight : insets.top,
          backgroundColor: '#EA1D25',
        }}>
        <CustomAdminHeader title={divisionName} />
      </View>

      {/* Action loading overlay */}
      {actionLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#EA1D25" />
        </View>
      )}

      {gametypes && gametypes.length > 0 ? (
        <>
          {renderGameTypeFilter()}
          <SectionList
            sections={sections as any}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, section }) => {
              // section objects now include a stable `id` created in useMemo
              const sectionId = (section as any).id ?? section.data[0]?.round_id?.toString() ?? '';
              if (collapsedSections[sectionId]) {
                return null;
              }
              return <AdminGameComponent game={item} onGameStatusChange={refreshGames} />;
            }}
            renderSectionHeader={({ section }) => {
              const sectionId = (section as any).id ?? section.data[0]?.round_id?.toString() ?? '';
              const isCollapsed = collapsedSections[sectionId];

              return (
                <TouchableOpacity
                  style={styles.sectionHeader}
                  activeOpacity={0.7}
                  onPress={() => toggleSection(sectionId)}>
                  <CustomText style={styles.sectionHeaderText}>{(section as any).title}</CustomText>
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
              <View style={styles.emptyContainer}>
                <CustomText style={styles.emptyText}>No games found for this selection</CustomText>
              </View>
            )}
            extraData={[games, collapsedSections, selectedGameType, isPoolPlay]}
            refreshControl={
              <RefreshControl
                refreshing={gamesLoading}
                onRefresh={refreshGames}
                colors={['#EA1D25']}
                tintColor="#EA1D25"
              />
            }
          />

          {/* Bottom Action Buttons */}
          <AdminBottomActionButtons
            leftButton={handleMarkAllCompleted}
            rightButton={handleResetAllGames}
            rightText="Reset All Games"
            leftText="Mark All Games as Completed"
            rightColor="#DDCF9B"
            leftColor="#ED8C22"
          />
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <CustomText style={styles.emptyText}>No game types available</CustomText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: '#000',
    flex: 1,
  },
  content: {
    gap: 12,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#EA1D25',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    color: '#fff',
    fontFamily: fonts.semiBold,
    fontSize: 18,
  },
  gameTypeItem: {
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 12,
    flexDirection: 'row',
    padding: 16,
  },
  icon: {
    marginRight: 15,
  },
  gameTypeText: {
    ...typography.textLargeBold,
    color: '#fff',
    flex: 1,
  },
  errorText: {
    color: '#EA1D25',
    ...typography.textMedium,
  },
  // Filter styles
  filterContainer: {
    alignItems: 'center',
    backgroundColor: '#000',
    flexDirection: 'row',
    marginTop: 15,
    paddingHorizontal: 15,
  },
  filterLabel: {
    ...typography.textBold,
    color: '#fff',
    marginRight: 12,
  },
  filterScroll: {
    backgroundColor: '#222',
    borderRadius: 12,
    flexDirection: 'row',
    padding: 7,
  },
  filterButton: {
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  filterButtonText: {
    ...typography.textMedium,
    color: '#999999',
  },
  selectedFilterButton: {
    backgroundColor: '#EA1D25',
  },
  selectedFilterText: {
    color: '#fff',
  },
  // Game list styles
  gamesList: {
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  sectionHeader: {
    alignItems: 'center',
    backgroundColor: '#1a0000',
    borderColor: '#EA1D25',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    padding: 10,
  },
  sectionHeaderText: {
    color: '#fff',
    ...typography.textLargeSemiBold,
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
  loadingOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1000,
  },
});
