import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import ComingSoonPlaceholder from '@/components/ComingSoonPlaceholder';
import CustomText from '@/components/CustomText';
import GameComponent from '@/components/features/gameviews/GameComponent';
import LoadingIndicator from '@/components/LoadingIndicator';
import { typography } from '@/constants/Typography';
import { useGamesBySchedule, usePoolsByDivision } from '@/hooks/useGamesData';
import { useGameTypesByDivision } from '@/hooks/useScheduleConfig';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RoundOption = {
  id: number;
  label: string;
};

type DivisionScheduleUiState = {
  selectedGameTypeTitle?: string;
  selectedPoolName?: string;
  selectedRoundId?: number;
};

const divisionScheduleUiState = new Map<number, DivisionScheduleUiState>();
const getDivisionScheduleUiStateStorageKey = (divisionId: number) => `schedule-division-ui-state:${divisionId}`;

export default function DivisionScheduleScreen() {
  const params = useLocalSearchParams();
  const divisionId = Number(params.division);
  const cachedUiState = divisionScheduleUiState.get(divisionId);

  const { gametypes, loading: gametypesLoading, error: gametypesError } = useGameTypesByDivision(divisionId);
  const { pools, loading: poolsLoading, error: poolsError } = usePoolsByDivision(divisionId);

  const [selectedGameTypeTitle, setSelectedGameTypeTitle] = useState<string | undefined>(
    cachedUiState?.selectedGameTypeTitle,
  );
  const [selectedPoolName, setSelectedPoolName] = useState<string | undefined>(cachedUiState?.selectedPoolName);
  const [selectedRoundId, setSelectedRoundId] = useState<number | undefined>(cachedUiState?.selectedRoundId);
  const [isUiStateHydrated, setIsUiStateHydrated] = useState(Boolean(cachedUiState) || !divisionId);

  const persistUiState = useCallback(
    async (partialState: DivisionScheduleUiState) => {
      if (!divisionId) {
        return;
      }

      const previousState = divisionScheduleUiState.get(divisionId) ?? {};
      const nextState = {
        ...previousState,
        ...partialState,
      };

      divisionScheduleUiState.set(divisionId, nextState);

      try {
        await AsyncStorage.setItem(getDivisionScheduleUiStateStorageKey(divisionId), JSON.stringify(nextState));
      } catch (error) {
        console.error('Failed to persist division schedule UI state:', error);
      }
    },
    [divisionId],
  );

  const updateCachedUiState = useCallback(
    (partialState: DivisionScheduleUiState) => {
      if (!divisionId) {
        return;
      }

      const previousState = divisionScheduleUiState.get(divisionId) ?? {};
      divisionScheduleUiState.set(divisionId, {
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
        const storedValue = await AsyncStorage.getItem(getDivisionScheduleUiStateStorageKey(divisionId));

        if (!isMounted) {
          return;
        }

        if (storedValue) {
          const parsedState = JSON.parse(storedValue) as DivisionScheduleUiState;
          divisionScheduleUiState.set(divisionId, parsedState);
          setSelectedGameTypeTitle(parsedState.selectedGameTypeTitle);
          setSelectedPoolName(parsedState.selectedPoolName);
          setSelectedRoundId(parsedState.selectedRoundId);
        }
      } catch (error) {
        console.error('Failed to hydrate division schedule UI state:', error);
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

  useEffect(() => {
    if (!isUiStateHydrated) {
      return;
    }

    updateCachedUiState({ selectedRoundId });
    void persistUiState({ selectedRoundId });
  }, [isUiStateHydrated, persistUiState, selectedRoundId, updateCachedUiState]);

  const {
    games,
    loading: gamesLoading,
    error: gamesError,
    refreshData,
  } = useGamesBySchedule(divisionId, selectedGameType?.id ?? 0);

  const roundOptions = useMemo(() => {
    if (isPoolPlay || !games.length) {
      return [];
    }

    const roundMap = games.reduce<Record<number, RoundOption>>((acc, game) => {
      if (!game.round_id) {
        return acc;
      }

      if (!acc[game.round_id]) {
        acc[game.round_id] = {
          id: game.round_id,
          label: game.rounds?.stage || `Round ${game.round_id}`,
        };
      }

      return acc;
    }, {});

    return Object.values(roundMap).sort((roundA, roundB) => roundA.id - roundB.id);
  }, [games, isPoolPlay]);

  const selectedRound = useMemo(
    () => roundOptions.find((round) => round.id === selectedRoundId) ?? roundOptions[0],
    [roundOptions, selectedRoundId],
  );

  const filteredGames = useMemo(() => {
    if (isPoolPlay) {
      if (!selectedPool) {
        return games;
      }

      return games.filter((game) => game.pool_id === selectedPool.id);
    }

    if (!selectedRound) {
      return games;
    }

    return games.filter((game) => game.round_id === selectedRound.id);
  }, [games, isPoolPlay, selectedPool, selectedRound]);

  useEffect(() => {
    if (!isUiStateHydrated) {
      return;
    }

    if (isPoolPlay) {
      setSelectedRoundId(undefined);
      return;
    }

    if (roundOptions.length > 0) {
      const hasSelectedRound = roundOptions.some((round) => round.id === selectedRoundId);

      if (!hasSelectedRound) {
        setSelectedRoundId(roundOptions[0].id);
      }
    }
  }, [isPoolPlay, isUiStateHydrated, roundOptions, selectedRoundId]);

  const filtersHeader = useMemo(
    () => (
      <View style={styles.filtersContainer}>
        <CustomText style={styles.filterPrompt}>
          Select a stage, then choose a pool or round to view the scheduled games.
        </CustomText>

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
                  {gametype.icon ? (
                    <MaterialCommunityIcons
                      name={gametype.icon as any}
                      size={24}
                      color={isSelected ? '#fff' : '#EA1D25'}
                    />
                  ) : null}
                  <CustomText style={[styles.gameTypeChipText, isSelected ? styles.gameTypeChipTextActive : null]}>
                    {gametype.title}
                  </CustomText>
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
                contentContainerStyle={styles.poolRow}
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
        ) : roundOptions.length > 1 ? (
          <View style={styles.filterRowViewport}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.poolRow}
              style={styles.filterScrollView}>
              {roundOptions.map((round) => {
                const isSelected = round.id === selectedRound?.id;

                return (
                  <TouchableOpacity
                    key={round.id}
                    style={[styles.filterChip, isSelected ? styles.filterChipActive : styles.filterChipInactive]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedRoundId(round.id)}>
                    <CustomText style={[styles.filterChipText, isSelected ? styles.filterChipTextActive : null]}>
                      {round.label}
                    </CustomText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </View>
    ),
    [
      gametypes,
      isPoolPlay,
      pools,
      poolsLoading,
      roundOptions,
      selectedGameType?.id,
      selectedPool?.id,
      selectedRound?.id,
    ],
  );

  if (gametypesLoading && gametypes.length === 0) {
    return <LoadingIndicator message="Loading schedule..." />;
  }

  if (gametypesError) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Error loading game types: {gametypesError}</Text>
      </View>
    );
  }

  if (!gametypes.length) {
    return <ComingSoonPlaceholder message="Pools and brackets coming soon!" iconName="account-tree" />;
  }

  if (gamesLoading && !games.length && selectedGameType) {
    return (
      <View style={styles.container}>
        {filtersHeader}
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#EA1D25" />
        </View>
      </View>
    );
  }

  if (gamesError) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        {filtersHeader}
        <Text style={styles.errorText}>Error loading games: {gamesError}</Text>
      </View>
    );
  }

  if (isPoolPlay && poolsError) {
    return (
      <View style={styles.container}>
        {filtersHeader}
        <ComingSoonPlaceholder message="Pool Play games coming soon!" iconName="pool" />
      </View>
    );
  }

  if (isPoolPlay && !poolsLoading && pools.length === 0) {
    return (
      <View style={styles.container}>
        {filtersHeader}
        <ComingSoonPlaceholder message="No pools available for this division" iconName="pool" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredGames}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          return (
            <View style={styles.gameItemContainer}>
              <GameComponent game={item} />
            </View>
          );
        }}
        ListHeaderComponent={filtersHeader}
        ListEmptyComponent={() => (
          <View style={styles.emptyStateContainer}>
            <ComingSoonPlaceholder
              message={isPoolPlay ? 'No games scheduled for this pool' : 'No games scheduled for this game type'}
              iconName="event-note"
            />
          </View>
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
    backgroundColor: '#E6E6E6',
    flex: 1,
  },
  emptyStateContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  errorText: {
    color: '#EA1D25',
    ...typography.textMedium,
  },
  filterPrompt: {
    ...typography.textLarge,
    color: '#111',
    paddingRight: 8,
  },
  filterRowViewport: {
    marginHorizontal: -20,
  },
  filterScrollView: {
    overflow: 'visible',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    gap: 15,
    padding: 20,
    marginBottom: 10,
  },
  gameItemContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
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
    backgroundColor: '#EA1D25',
    borderColor: '#EA1D25',
  },
  gameTypeChipInactive: {
    backgroundColor: '#fff',
    borderColor: '#EA1D25',
  },
  gameTypeChipText: {
    ...typography.heading5,
    color: '#111',
  },
  gameTypeChipTextActive: {
    color: '#fff',
  },
  gameTypeRow: {
    gap: 12,
    paddingHorizontal: 20,
  },
  loadingContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  poolLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  filterChip: {
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: -3,
  },
  filterChipActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  filterChipInactive: {
    backgroundColor: '#fff',
    borderColor: '#111',
  },
  filterChipText: {
    ...typography.heading5,
    color: '#111',
    textAlign: 'center',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  poolRow: {
    gap: 10,
    paddingHorizontal: 20,
  },
});
