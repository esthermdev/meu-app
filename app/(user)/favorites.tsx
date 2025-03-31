// app/(user)/favorites.tsx
import { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet,
  View, 
  RefreshControl,
  TextInput,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Keyboard
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useAuth } from '@/context/AuthProvider';
import { useFavorites } from '@/hooks/useFavorites';
import { FavoriteTeamsList } from '@/components/features/favorites/FavoriteTeamsList';
import { typography } from '@/constants/Typography';
import { supabase } from '@/lib/supabase';
import { Database } from '@/database.types';
import CustomText from '@/components/CustomText';

type DivisionRow = Database['public']['Tables']['divisions']['Row'];

// Section header component
const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.sectionHeader}>
    <CustomText style={styles.sectionHeaderText}>{title}</CustomText>
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
            <CustomText style={styles.title}>Select your favorite teams!</CustomText>
            <CustomText style={styles.subtitle}>Follow their games on the My Games screen.</CustomText>
            
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
              <MaterialIcons name='close' size={15} color="#86939e" onPress={() => setSearchQuery('')} />
            </View>
            
            {/* Status Bar */}
            <View style={styles.statsContainer}>
              <CustomText style={styles.favoritesCount}>
                <CustomText style={styles.favoritesCountNumber}>{favorites.size} teams </CustomText>selected
              </CustomText>
              <CustomText style={styles.remainingSlots}>
                <CustomText style={styles.remainingSlotsNumber}>{remainingFavorites} slots </CustomText>remaining
              </CustomText>
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
            <CustomText style={styles.messageText}>No teams found</CustomText>
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
    ...typography.heading4,
    paddingHorizontal: 20,
    marginTop: 15,
  },
  subtitle: {
    ...typography.text,
    paddingHorizontal: 20,
    marginBottom: 15
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
    ...typography.text,
    color: '#000',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  favoritesCount: {
    ...typography.text,
    color: '#EA1D25',
  },
  favoritesCountNumber: {
    ...typography.textBold,
    color: '#EA1D25',
  },
  remainingSlots: {
    ...typography.text,
    color: '#666',
  },
  remainingSlotsNumber: {
    ...typography.textBold,
  },
  messageText: {
    ...typography.text,
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
    ...typography.textBold,
    color: '#555',
  },
});

export default FavoritesScreen;