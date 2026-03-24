// app/(user)/favorites.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, RefreshControl, StyleSheet, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { Link } from 'expo-router';

import CustomText from '@/components/CustomText';
import { FavoriteTeamsListItem } from '@/components/features/favorites/FavoriteTeamsListItem';
import { typography } from '@/constants/Typography';
import { useAuth } from '@/context/AuthProvider';
import { useFavoriteTeams } from '@/hooks/useFavoriteTeams';
import { TeamWithDetails } from '@/types/teams';

import { MaterialIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';

type FavoriteTeamsListItemData =
  | { type: 'header'; id: string; title: 'Favorite Teams' | 'All Teams' }
  | { type: 'team'; id: string; team: TeamWithDetails };

// Section header component
const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.sectionHeader}>
    <CustomText style={styles.sectionHeaderText}>{title}</CustomText>
  </View>
);

const FavoritesScreen = () => {
  const listRef = useRef<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { session } = useAuth();
  const { teams, favorites, toggleFavorite, loadData, remainingFavorites } = useFavoriteTeams(session);

  const filteredTeams = useMemo(() => {
    const lowercaseQuery = searchQuery.toLowerCase();
    const filtered = teams.filter((team) => team.name.toLowerCase().includes(lowercaseQuery));

    // Sort teams with favorited ones at the top
    return filtered.sort((a, b) => {
      const aFavorited = favorites.has(a.id) ? 1 : 0;
      const bFavorited = favorites.has(b.id) ? 1 : 0;
      return bFavorited - aFavorited; // Descending order: favorites first
    });
  }, [teams, searchQuery, favorites]);

  const listData = useMemo<FavoriteTeamsListItemData[]>(() => {
    const favoriteTeams = filteredTeams.filter((team) => favorites.has(team.id));
    const nonFavoriteTeams = filteredTeams.filter((team) => !favorites.has(team.id));

    const data: FavoriteTeamsListItemData[] = [];

    if (favoriteTeams.length > 0) {
      data.push({ type: 'header', id: 'header-favorites', title: 'Favorite Teams' });
      favoriteTeams.forEach((team) => data.push({ type: 'team', id: `team-${team.id}`, team }));
    }

    if (nonFavoriteTeams.length > 0) {
      data.push({ type: 'header', id: 'header-all', title: 'All Teams' });
      nonFavoriteTeams.forEach((team) => data.push({ type: 'team', id: `team-${team.id}`, team }));
    }

    return data;
  }, [filteredTeams, favorites]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleToggleFavorite = async (teamId: number) => {
    const result = await toggleFavorite(teamId);

    if (result.success) {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });

      // FlashList may apply one more layout pass after data mutation.
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
      });
    }

    return result;
  };

  const scrollToTop = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  useEffect(() => {
    if (favorites.size === 0) {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [favorites.size]);

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
          scrollToTop();
        }}>
        <View style={styles.headerContainer}>
          <CustomText style={styles.title}>Select your favorite teams!</CustomText>
          <CustomText style={styles.subtitle}>
            Follow their games on the{' '}
            <Link href="/(tabs)/home/mygames" style={styles.link}>
              My Games
            </Link>{' '}
            screen.
          </CustomText>

          {/* Custom Search Bar */}
          <View style={styles.searchBarContainer}>
            <MaterialIcons name="search" size={20} color="#86939e" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search teams..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#86939e"
              allowFontScaling={false}
            />
            <MaterialIcons name="close" size={15} color="#86939e" onPress={() => setSearchQuery('')} />
          </View>

          {/* Status Bar */}
          <View style={styles.statsContainer}>
            <CustomText style={styles.favoritesCount}>
              <CustomText style={styles.favoritesCountNumber}>{favorites.size} teams </CustomText>
              selected
            </CustomText>
            <CustomText style={styles.remainingSlots}>
              <CustomText style={styles.remainingSlotsNumber}>{remainingFavorites} slots </CustomText>
              remaining
            </CustomText>
          </View>
        </View>
      </TouchableWithoutFeedback>

      <FlashList
        ref={listRef}
        data={listData}
        extraData={favorites}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return <SectionHeader title={item.title} />;
          }

          const isFavorited = favorites.has(item.team.id);
          return (
            <FavoriteTeamsListItem item={item.team} isFavorited={isFavorited} onToggleFavorite={handleToggleFavorite} />
          );
        }}
        keyExtractor={(item) => item.id}
        getItemType={(item) => item.type}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EA1D25']} />}
        ListEmptyComponent={
          <View style={styles.centeredContainer}>
            <CustomText style={styles.messageText}>No teams found</CustomText>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  centeredContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  favoritesCount: {
    ...typography.text,
    color: '#EA1D25',
  },
  favoritesCountNumber: {
    ...typography.textBold,
    color: '#EA1D25',
  },
  headerContainer: {
    borderBottomColor: '#EFEFEF',
    borderBottomWidth: 1,
    paddingBottom: 15,
  },
  link: {
    color: '#4357AD',
    textDecorationLine: 'underline',
  },
  messageText: {
    ...typography.text,
    color: '#8F8DAA',
    textAlign: 'center',
  },
  remainingSlots: {
    ...typography.text,
    color: '#666',
  },
  remainingSlotsNumber: {
    ...typography.textBold,
  },
  searchBarContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#000',
    borderRadius: 100,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    ...typography.text,
    color: '#000',
  },
  sectionHeader: {
    backgroundColor: '#f8f8f8',
    borderBottomColor: '#EFEFEF',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  sectionHeaderText: {
    ...typography.textBold,
    color: '#555',
  },
  statsContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  subtitle: {
    ...typography.text,
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  title: {
    ...typography.heading4,
    marginTop: 15,
    paddingHorizontal: 20,
  },
});

export default FavoritesScreen;
