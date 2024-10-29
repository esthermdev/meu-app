import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, RefreshControl, Keyboard, FlatList, TouchableOpacity, 
  ActivityIndicator } from 'react-native';
import { ListItem, Avatar, SearchBar } from '@rneui/themed';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { Database } from '@/database.types';

type TeamRow = Database['public']['Tables']['teams']['Row'];
type PoolRow = Database['public']['Tables']['pools']['Row'];
type Division = Database['public']['Enums']['division'] | 'All';

interface TeamWithPool extends TeamRow {
  pool: PoolRow | null;
}

interface DivisionInfo {
  title: string;
  color: string;
  division: Division;
}

const Teams = () => {
  const [teams, setTeams] = useState<TeamWithPool[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<Division>('All');
  const [divisionFilters, setDivisionFilters] = useState<DivisionInfo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const processDivisionsFromTeams = useCallback((teamsData: TeamWithPool[]) => {
    const uniqueDivisions = new Map<string, DivisionInfo>();
    
    // Add "All" filter by default
    uniqueDivisions.set('All', {
      title: 'All',
      color: '#917120',
      division: 'All'
    });

    // Process teams to get unique divisions and their colors
    teamsData.forEach(team => {
      if (team.division && !uniqueDivisions.has(team.division)) {
        uniqueDivisions.set(team.division, {
          title: team.division,
          color: team.color || '#ccc',
          division: team.division as Division
        });
      }
    });

    return Array.from(uniqueDivisions.values());
  }, []);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          pool: pool_id (
            id,
            name,
            division
          )
        `)
        .order('name');

      if (error) {
        setError('Error fetching teams. Please try again.');
        console.error('Error fetching teams:', error);
      } else if (data) {
        const teamsWithPools = data as unknown as TeamWithPool[];
        setTeams(teamsWithPools);
        setDivisionFilters(processDivisionsFromTeams(teamsWithPools));
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  }, [processDivisionsFromTeams]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTeams().then(() => setRefreshing(false));
  }, [fetchTeams]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const filteredTeams = useMemo(() => {
    return teams
      .filter(team => {
        if (selectedDivision === 'All') {
          return true;
        }
        // Log to debug
        console.log('Team:', team.name, 'Division:', team.division, 'Selected:', selectedDivision);
        return team.division === selectedDivision;
      })
      .filter(team => team.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [teams, selectedDivision, searchQuery]);

  const renderItem = useCallback(({ item }: { item: TeamWithPool }) => (
      <View style={{ backgroundColor: '#fff' }}>
        <ListItem.Content style={styles.teamListContainer}>
          <Avatar
            size={50}
            rounded
            title={item.name[0]}
            titleStyle={{ color: '#000' }}
            source={{ uri: item?.avatar_uri || undefined }}
            avatarStyle={{ borderColor: '#000', borderWidth: 0.5 }}
            containerStyle={{ backgroundColor: '#fff' }}
          />
          <View style={{ gap: 5 }}>
            <ListItem.Title style={styles.teamName} maxFontSizeMultiplier={1.2}>
              {item.name}
            </ListItem.Title>
            <View style={[{ backgroundColor: item.color || '#ccc' }, styles.divisionContainer]}>
              <ListItem.Subtitle maxFontSizeMultiplier={1.2} style={styles.division}>
                {item.division}
              </ListItem.Subtitle>
            </View>
          </View>
        </ListItem.Content>
      </View>
  ), []);

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <Text maxFontSizeMultiplier={1.2} style={styles.filterTitle}>
        Filters: 
      </Text>
      {divisionFilters.map((filter) => (
        <FilterButton
          key={filter.division}
          title={filter.title}
          color={filter.color}
          division={filter.division}
          onPress={setSelectedDivision}
          isSelected={selectedDivision === filter.division}
        />
      ))}
    </View>
  );

  // Update FilterButtonProps and FilterButton component
  interface FilterButtonProps {
    title: string;
    color: string;
    division: Division;
    onPress: (division: Division) => void;
    isSelected: boolean;
  }

  const FilterButton: React.FC<FilterButtonProps> = ({
    title,
    color,
    division,
    onPress,
    isSelected
  }) => (
    <TouchableOpacity 
      style={[
        styles.filterButton,
        { backgroundColor: color },
        isSelected && styles.filterButtonSelected
      ]} 
      onPress={() => onPress(division)}
    >
      <Text
        maxFontSizeMultiplier={1.2}
        style={[
          styles.filterByText,
          isSelected && styles.filterByTextSelected
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );


  return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <SearchBar
            placeholder="Search teams..."
            onChangeText={handleSearch}
            value={searchQuery}
            containerStyle={styles.searchBarContainer}
            inputContainerStyle={styles.searchBarInputContainer}
            inputStyle={styles.searchBarInput}
            round={true}
            lightTheme={true}
            clearIcon={{ color: '#86939e' }}
            searchIcon={{ color: '#86939e' }}
            onSubmitEditing={dismissKeyboard}
            returnKeyType="done"
          />
          {renderFilterButtons()}
        </View>
        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#EA1D25" />
            </View>
          ) : (
            <FlatList
              data={filteredTeams}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#EA1D25']}
                />
              }
              showsVerticalScrollIndicator={true}
            />
          )}
        </View>
      </View>
  );
};

export default React.memo(Teams);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flex: 1
  },
  headerContainer: {
    borderBottomColor: '#D9D9D9',
    borderBottomWidth: 1,
  },
  header: {
    fontFamily: 'OutfitBold',
    fontSize: 35,
    color: '#EA1D25'
  },
  searchBarContainer: {
    backgroundColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
    paddingHorizontal: 15,
    paddingVertical: 0
  },
  searchBarInputContainer: {
    borderRadius: 100,
    height: 40,
  },
  searchBarInput: {
    fontFamily: 'OutfitRegular',
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: 'center',
  },
  filterTitle: {
    fontFamily: 'OutfitLight',
    fontSize: 12,
    color: '#8F8DAA',
  },
  filterButton: {
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterButtonSelected: {
    borderColor: '#000',
    opacity: 0.9,
  },
  filterByText: {
    fontFamily: 'OutfitLight',
    fontSize: 12,
    color: '#fff',
  },
  filterByTextSelected: {
    fontFamily: 'OutfitMedium',
  },
  teamListContainer: {
    gap: 10, 
    flexDirection: 'row', 
    justifyContent: 'flex-start', 
    alignItems: 'center', 
    borderColor: 'gray', 
    borderBottomWidth: 0.2, 
    backgroundColor: '#fff', 
    paddingVertical: 15, 
    marginHorizontal: 15
  },
  teamName: {
    fontFamily: 'OutfitBold',
    fontSize: 16,
    color: '#333243',
  },
  division: {
    color: 'white',
    fontFamily: 'OutfitLight',
    fontSize: 10,
    textAlign: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  divisionContainer: {
    borderRadius: 100,
    alignSelf: 'flex-start',
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  avatarContainer: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#000',
  },
  avatarTitle: {
    color: '#000',
  },
  listItem: {
    paddingHorizontal: 15,
  },
  noTeamsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  noTeamsText: {
    fontFamily: 'OutfitRegular',
    fontSize: 16,
    color: '#8F8DAA',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontFamily: 'OutfitRegular',
    fontSize: 16,
    color: '#EA1D25',
    textAlign: 'center',
  },
});