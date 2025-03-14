import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  RefreshControl,
  TextInput,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useAuth } from '@/context/AuthProvider';
import { useFavorites } from '@/hooks/useFavorites';
import { TeamListItem } from '@/components/TeamListItem';
import CustomHeader from '@/components/headers/CustomHeader';
import { typography } from '@/constants/Typography';

const FavoritesScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { session } = useAuth();
  const { 
    teams, 
    favorites, 
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

  return (
    <View style={styles.container}>
      <CustomHeader title="Favorites" />
      <KeyboardAvoidingView behavior="padding">
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Select your favorite teams!</Text>
            
            {/* Custom Search Bar */}
            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={20} color="#86939e" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search teams..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#86939e"
              />
            </View>
            
            {/* Status Bar */}
            <View style={styles.statsContainer}>
              <Text style={styles.favoritesCount}>
                <Text style={styles.favoritesCountNumber}>{favorites.size} teams </Text>selected
              </Text>
              <Text style={styles.remainingSlots}>
                <Text style={styles.remainingSlotsNumber}>{remainingFavorites} slots </Text>remaining
              </Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      
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
    borderBottomColor: '#EFEFEF',
    borderBottomWidth: 1,
    paddingBottom: 15,
  },
  title: {
    ...typography.h4,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchBarContainer: {
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 100,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#000',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    ...typography.bodyMedium,
    color: '#000',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  favoritesCount: {
    ...typography.body,
    color: '#EA1D25',
  },
  favoritesCountNumber: {
    ...typography.bodyBold,
    color: '#EA1D25',
  },
  remainingSlots: {
    ...typography.body,
    color: '#666',
  },
  remainingSlotsNumber: {
    ...typography.bodyBold,
  },
  messageText: {
    fontFamily: 'GeistRegular',
    fontSize: 16,
    color: '#8F8DAA',
    textAlign: 'center',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default FavoritesScreen;