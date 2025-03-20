// app/(user)/favorites.tsx
import React, { useState, useEffect, useMemo } from 'react';
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
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useAuth } from '@/context/AuthProvider';
import { useFavorites } from '@/hooks/useFavorites';
import { FavoriteTeamsList } from '@/components/FavoriteTeamsList';
import { typography } from '@/constants/Typography';
import { supabase } from '@/lib/supabase';
import { Database } from '@/database.types';

type DivisionRow = Database['public']['Tables']['divisions']['Row'];

// Section header component
const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
);

const FavoritesScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [divisions, setDivisions] = useState<DivisionRow[]>([]);
  
  const { session } = useAuth();
  const { 
    teams, 
    favorites, 
    toggleFavorite, 
    loadData,
    remainingFavorites,
  } = useFavorites(session);

  // Fetch divisions
  const fetchDivisions = async () => {
    try {
      const { data, error } = await supabase
        .from('divisions')
        .select('*')
        .order('display_order');
        
      if (error) throw error;
      setDivisions(data || []);
    } catch (error) {
      console.error('Error fetching divisions:', error);
    }
  };

  useEffect(() => {
    fetchDivisions();
  }, []);

  const filteredTeams = useMemo(() => {
    const lowercaseQuery = searchQuery.toLowerCase();
    const filtered = teams.filter(team => 
      team.name.toLowerCase().includes(lowercaseQuery)
    );
    
    // Sort teams with favorited ones at the top
    return filtered.sort((a, b) => {
      const aFavorited = favorites.has(a.id) ? 1 : 0;
      const bFavorited = favorites.has(b.id) ? 1 : 0;
      return bFavorited - aFavorited; // Descending order: favorites first
    });
  }, [teams, searchQuery, favorites]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), fetchDivisions()]);
    setRefreshing(false);
  };

  const handleRefreshAfterToggle = async () => {
    await loadData();
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior="padding">
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Select your favorite teams!</Text>
            
            {/* Custom Search Bar */}
            <View style={styles.searchBarContainer}>
              <MaterialIcons name="search" size={20} color="#86939e" style={styles.searchIcon} />
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
        renderItem={({ item, index }) => {
          // Check if we should display a section header above this item
          const currentItemFavorited = favorites.has(item.id);
          const prevItemFavorited = index > 0 ? favorites.has(filteredTeams[index - 1].id) : false;
          
          // If this is the first item OR we're transitioning from favorited to non-favorited
          const shouldShowHeader = index === 0 || (prevItemFavorited && !currentItemFavorited);
          
          return (
            <>
              {shouldShowHeader && (
                <SectionHeader 
                  title={currentItemFavorited ? "Favorite Teams" : "All Teams"} 
                />
              )}
              <FavoriteTeamsList 
                item={item}
                isFavorited={currentItemFavorited}
                onToggleFavorite={toggleFavorite}
                onRefreshData={handleRefreshAfterToggle}
              />
            </>
          );
        }}
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
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#000',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
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
  sectionHeader: {
    backgroundColor: '#f8f8f8',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  sectionHeaderText: {
    ...typography.bodyBold,
    color: '#555',
  },
});

export default FavoritesScreen;