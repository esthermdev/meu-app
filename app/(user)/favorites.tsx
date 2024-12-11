import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  RefreshControl, 
  ActivityIndicator,
} from 'react-native';
import { SearchBar } from '@rneui/themed';
import { FlashList } from '@shopify/flash-list';
import { useAuth } from '@/context/AuthProvider';
import { useFavorites } from '@/hooks/useFavorites';
import { TeamListItem } from '@/components/TeamListItem';

const FavoritesScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { session } = useAuth();
  const { 
    teams, 
    favorites, 
    loading, 
    toggleFavorite, 
    loadData,
    remainingFavorites,
  } = useFavorites(session);

  const filteredTeams = useMemo(() => {
    const lowercaseQuery = searchQuery.toLowerCase();
    return teams.filter(team => 
      team.name.toLowerCase().includes(lowercaseQuery)
    );
  }, [teams, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleRefreshAfterToggle = async () => {
    await loadData();
  };

  if (!session) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.messageText}>Please login to manage your favorites</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={{ fontFamily: 'OutfitBold', fontSize: 20, padding: 16 }}>Select your favorite teams!</Text>
        <SearchBar
          placeholder="Search teams..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          containerStyle={styles.searchBarContainer}
          inputContainerStyle={styles.searchBarInputContainer}
          inputStyle={styles.searchBarInput}
          round={true}
          lightTheme={true}
          clearIcon={{ color: '#86939e' }}
          searchIcon={{ color: '#86939e' }}
        />
        <View style={styles.favoritesInfoContainer}>
          <Text style={styles.favoritesCount}>
            {favorites.size} {favorites.size === 1 ? 'Team' : 'Teams'} Selected
          </Text>
          <Text style={[
            styles.remainingSlots,
            remainingFavorites === 0 && styles.remainingSlotsWarning
          ]}>
            {remainingFavorites} {remainingFavorites === 1 ? 'slot' : 'slots'} remaining
          </Text>
        </View>
      </View>
      <FlashList
        data={filteredTeams}
        renderItem={({ item }) => (
          <TeamListItem 
            item={item}
            isFavorited={favorites.has(item.id)}
            onToggleFavorite={toggleFavorite}
            onRefreshData={handleRefreshAfterToggle}
          />
        )}
        estimatedItemSize={80}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#EA1D25']}
          />
        }
        ListEmptyComponent={
          <View style={styles.centeredContainer}>
            <Text style={styles.messageText}>No teams found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    borderBottomColor: '#D9D9D9',
    borderBottomWidth: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  searchBarContainer: {
    backgroundColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
    paddingHorizontal: 15,
    paddingVertical: 0,
  },
  searchBarInputContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 100,
    height: 40,
  },
  searchBarInput: {
    fontFamily: 'OutfitRegular',
    fontSize: 16,
  },
  favoritesCount: {
    fontFamily: 'OutfitMedium',
    fontSize: 14,
    color: '#8F8DAA',
  },
  messageText: {
    fontFamily: 'OutfitRegular',
    fontSize: 16,
    color: '#8F8DAA',
    textAlign: 'center',
  },
  favoritesInfoContainer: {
    padding: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainingSlots: {
    fontFamily: 'OutfitMedium',
    fontSize: 14,
    color: '#8F8DAA',
  },
  remainingSlotsWarning: {
    color: '#EA1D25',
  }
});

export default FavoritesScreen;