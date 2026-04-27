import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  RefreshControl,
  ScrollView,
  SectionList,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import AdminBottomActionButtons from '@/components/buttons/AdminBottomActionButtons';
import CustomText from '@/components/CustomText';
import AdminGameComponent from '@/components/features/gameviews/AdminGameComponent';
import { CustomAdminHeader } from '@/components/headers/CustomAdminHeader';
import { typography } from '@/constants/Typography';
import { usePoolsByDivision } from '@/hooks/useGamesData';
import { useGameTypesByDivision } from '@/hooks/useScheduleConfig';
import { supabase } from '@/lib/supabase';
import { GameWithRoundAndPool } from '@/types/games';

import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

type Section = {
  id: string;
  title: string;
  data: GameWithRoundAndPool[];
};

type AdminUpdateScoresUiState = {
  selectedGameTypeTitle?: string;
  selectedPoolName?: string;
};

const adminUpdateScoresUiState = new Map<number, AdminUpdateScoresUiState>();
const getAdminUpdateScoresUiStateStorageKey = (divisionId: number) => `admin-update-scores-ui-state:${divisionId}`;

export default function UpdateScoresDivisionScreen() {
  const params = useLocalSearchParams();
  const divisionId = Number(params.division);
  const divisionName = params.divisionName as string;
  const cachedUiState = adminUpdateScoresUiState.get(divisionId);

  const { gametypes, loading: gametypesLoading, error } = useGameTypesByDivision(divisionId);
  const { pools, loading: poolsLoading } = usePoolsByDivision(divisionId);

  const [selectedGameTypeTitle, setSelectedGameTypeTitle] = useState<string | undefined>(
    cachedUiState?.selectedGameTypeTitle,
  );
  const [selectedPoolName, setSelectedPoolName] = useState<string | undefined>(cachedUiState?.selectedPoolName);
  const [games, setGames] = useState<GameWithRoundAndPool[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [isUiStateHydrated, setIsUiStateHydrated] = useState(Boolean(cachedUiState) || !divisionId);

  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

  const persistUiState = useCallback(
    async (partialState: AdminUpdateScoresUiState) => {
      if (!divisionId) {
        return;
      }

      const previousState = adminUpdateScoresUiState.get(divisionId) ?? {};
      const nextState = {
        ...previousState,
        ...partialState,
      };

      adminUpdateScoresUiState.set(divisionId, nextState);

      try {
        await AsyncStorage.setItem(getAdminUpdateScoresUiStateStorageKey(divisionId), JSON.stringify(nextState));
      } catch (persistError) {
        console.error('Failed to persist admin update-scores UI state:', persistError);
      }
    },
    [divisionId],
  );

  const updateCachedUiState = useCallback(
    (partialState: AdminUpdateScoresUiState) => {
      if (!divisionId) {
        return;
      }

      const previousState = adminUpdateScoresUiState.get(divisionId) ?? {};
      adminUpdateScoresUiState.set(divisionId, {
        ...previousState,
        ...partialState,
      });
    },
    [divisionId],
  );

  useEffect(() => {
    let isMounted = true;

    async function hydrateUiState() {
      if (!divisionId || cachedUiState) {
        if (isMounted) {
          setIsUiStateHydrated(true);
        }
        return;
      }

      try {
        const storedValue = await AsyncStorage.getItem(getAdminUpdateScoresUiStateStorageKey(divisionId));

        if (!isMounted) {
          return;
        }

        if (storedValue) {
          const parsedState = JSON.parse(storedValue) as AdminUpdateScoresUiState;
          adminUpdateScoresUiState.set(divisionId, parsedState);
          setSelectedGameTypeTitle(parsedState.selectedGameTypeTitle);
          setSelectedPoolName(parsedState.selectedPoolName);
        }
      } catch (hydrateError) {
        console.error('Failed to hydrate admin update-scores UI state:', hydrateError);
      } finally {
        if (isMounted) {
          setIsUiStateHydrated(true);
        }
      }
    }

    hydrateUiState();

    return () => {
      isMounted = false;
    };
  }, [cachedUiState, divisionId]);

  const selectedGameType = useMemo(
    () => gametypes.find((gametype) => gametype.title === selectedGameTypeTitle) ?? gametypes[0],
    [gametypes, selectedGameTypeTitle],
  );

  const isPoolPlay = selectedGameType?.route === 'poolplay';

  const selectedPool = useMemo(
    () => pools.find((pool) => pool.name === selectedPoolName) ?? pools[0],
    [pools, selectedPoolName],
  );

  useEffect(() => {
    if (!isUiStateHydrated) {
      return;
    }

    if (gametypes.length === 0) {
      return;
    }

    const hasSelectedGameType = gametypes.some((gametype) => gametype.title === selectedGameTypeTitle);

    if (!hasSelectedGameType) {
      setSelectedGameTypeTitle(gametypes[0].title);
    }
  }, [gametypes, isUiStateHydrated, selectedGameTypeTitle]);

  useEffect(() => {
    if (!isUiStateHydrated) {
      return;
    }

    if (!isPoolPlay) {
      return;
    }

    if (pools.length > 0) {
      const hasSelectedPool = pools.some((pool) => pool.name === selectedPoolName);

      if (!hasSelectedPool) {
        setSelectedPoolName(pools[0].name);
      }
    }
  }, [isPoolPlay, isUiStateHydrated, pools, selectedPoolName]);

  useEffect(() => {
    if (!isUiStateHydrated) {
      return;
    }

    updateCachedUiState({ selectedGameTypeTitle });
    void persistUiState({ selectedGameTypeTitle });
  }, [isUiStateHydrated, persistUiState, selectedGameTypeTitle, updateCachedUiState]);

  useEffect(() => {
    if (!isUiStateHydrated) {
      return;
    }

    updateCachedUiState({ selectedPoolName });
    void persistUiState({ selectedPoolName });
  }, [isUiStateHydrated, persistUiState, selectedPoolName, updateCachedUiState]);

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
      setGames(data as unknown as GameWithRoundAndPool[]);
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

  const filteredGames = useMemo(() => {
    if (!selectedGameType) {
      return games;
    }

    const gamesByGameType = games.filter((game) => game.gametype_id === selectedGameType.id);

    if (!isPoolPlay || !selectedPool) {
      return gamesByGameType;
    }

    return gamesByGameType.filter((game) => game.pool_id === selectedPool.id);
  }, [games, isPoolPlay, selectedGameType, selectedPool]);

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

  const sections = useMemo(() => {
    if (!filteredGames || filteredGames.length === 0) return [];

    const roundsMap = filteredGames.reduce<Record<number, Section>>((acc, game) => {
      const roundId = game.round_id ?? -1;

      if (!acc[roundId]) {
        acc[roundId] = {
          id: `round-${String(roundId)}`,
          title: game.rounds?.stage || 'Games',
          data: [],
        };
      }

      acc[roundId].data.push(game);
      return acc;
    }, {});

    return Object.values(roundsMap).sort((sectionA, sectionB) => {
      const roundIdA = sectionA.data[0]?.round_id ?? 0;
      const roundIdB = sectionB.data[0]?.round_id ?? 0;
      return roundIdA - roundIdB;
    });
  }, [filteredGames]);

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

  const filtersHeader = useMemo(
    () => (
      <View style={styles.filtersContainer}>
        <View style={styles.filterRowViewport}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gameTypeRow}
            style={styles.filterScrollView}>
            {gametypes.map((gametype) => {
              const isSelected = gametype.id === selectedGameType?.id;

              return (
                <TouchableOpacity
                  key={gametype.id}
                  style={[styles.gameTypeChip, isSelected ? styles.gameTypeChipActive : styles.gameTypeChipInactive]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedGameTypeTitle(gametype.title)}>
                  {gametype.icon ? <MaterialCommunityIcons name={gametype.icon as any} size={24} color="#fff" /> : null}
                  <CustomText style={styles.gameTypeChipText}>{gametype.title}</CustomText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {isPoolPlay ? (
          poolsLoading ? (
            <View style={styles.poolLoadingContainer}>
              <ActivityIndicator size="small" color="#EA1D25" />
            </View>
          ) : pools.length > 0 ? (
            <View style={styles.filterRowViewport}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChipRow}
                style={styles.filterScrollView}>
                {pools.map((pool) => {
                  const isSelected = pool.id === selectedPool?.id;

                  return (
                    <TouchableOpacity
                      key={pool.id}
                      style={[styles.filterChip, isSelected ? styles.filterChipActive : styles.filterChipInactive]}
                      activeOpacity={0.85}
                      onPress={() => setSelectedPoolName(pool.name)}>
                      <CustomText style={[styles.filterChipText, isSelected ? styles.filterChipTextActive : null]}>
                        {`POOL ${pool.name}`}
                      </CustomText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : null
        ) : null}
      </View>
    ),
    [gametypes, isPoolPlay, pools, poolsLoading, selectedGameType?.id, selectedPool?.id],
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
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index, section }) => {
              const sectionId = section.id;
              if (collapsedSections[sectionId]) {
                return null;
              }

              const isLastItemInSection = index === section.data.length - 1;

              return (
                <View style={[styles.gameItemContainer, isLastItemInSection && styles.lastGameItemInSection]}>
                  <AdminGameComponent game={item} onGameStatusChange={refreshGames} />
                </View>
              );
            }}
            renderSectionHeader={({ section }) => {
              if (isPoolPlay) {
                return null;
              }

              const sectionId = section.id;
              const isCollapsed = collapsedSections[sectionId];

              return (
                <TouchableOpacity
                  style={[styles.sectionHeader]}
                  activeOpacity={0.7}
                  onPress={() => toggleSection(sectionId)}>
                  <CustomText style={styles.sectionHeaderText}>{section.title}</CustomText>
                  {isCollapsed ? (
                    <MaterialIcons name="keyboard-arrow-down" size={24} color="#fff" />
                  ) : (
                    <MaterialIcons name="keyboard-arrow-left" size={24} color="#fff" />
                  )}
                </TouchableOpacity>
              );
            }}
            stickySectionHeadersEnabled={true}
            ListHeaderComponent={filtersHeader}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <CustomText style={styles.emptyText}>No games found for this selection</CustomText>
              </View>
            )}
            extraData={[games, collapsedSections, selectedGameType?.id, selectedPool?.id]}
            refreshControl={
              <RefreshControl
                refreshing={gamesLoading}
                onRefresh={refreshGames}
                colors={['#EA1D25']}
                tintColor="#EA1D25"
              />
            }
            ItemSeparatorComponent={({ section }) => {
              const sectionId = section.id;
              const isCollapsed = collapsedSections[sectionId];

              if (isCollapsed) {
                return null;
              }

              return <View style={styles.itemSeparator} />;
            }}
          />

          {/* Bottom Action Buttons */}
          <AdminBottomActionButtons
            leftButton={handleMarkAllCompleted}
            rightButton={handleResetAllGames}
            rightText="Reset All Games"
            leftText="End All Games"
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
  filtersContainer: {
    backgroundColor: '#000',
    gap: 15,
    padding: 20,
  },
  filterPrompt: {
    color: '#fff',
    ...typography.heading3,
  },
  filterRowViewport: {
    marginHorizontal: -20,
  },
  gameTypeRow: {
    gap: 14,
    paddingHorizontal: 20,
  },
  filterScrollView: {
    overflow: 'visible',
  },
  gameTypeChip: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    marginRight: -3,
    gap: 3,
    boxShadow: '0px 2px 0px 0px #EA1D25',
  },
  gameTypeChipActive: {
    backgroundColor: '#F71622',
    borderColor: '#F71622',
  },
  gameTypeChipInactive: {
    backgroundColor: '#660000',
    borderColor: '#F71622',
  },
  gameTypeChipText: {
    ...typography.heading5,
    color: '#fff',
  },
  poolLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  filterChipRow: {
    gap: 10,
    paddingHorizontal: 20,
  },
  filterChip: {
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: -3,
  },
  filterChipActive: {
    backgroundColor: '#EA1D25',
    borderColor: '#EA1D25',
  },
  filterChipInactive: {
    backgroundColor: '#4D0000',
    borderColor: '#EA1D25',
  },
  filterChipText: {
    ...typography.heading5,
    color: '#fff',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  container: {
    backgroundColor: '#000',
    flex: 1,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#EA1D25',
    ...typography.textMedium,
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
  gameItemContainer: {
    paddingHorizontal: 10,
  },
  lastGameItemInSection: {
    marginBottom: 10,
  },
  sectionHeader: {
    alignItems: 'center',
    backgroundColor: '#1a0000',
    borderColor: '#EA1D25',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    marginBottom: 10,
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
  itemSeparator: {
    height: 10,
  },
});
