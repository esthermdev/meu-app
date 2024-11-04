import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, RefreshControl, Keyboard, ActivityIndicator } from 'react-native';
import { ListItem, Avatar, SearchBar } from '@rneui/themed';
import { FlashList } from '@shopify/flash-list';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { Database } from '@/database.types';
import { FilterButton } from '@/components/buttons/FilterButtons';

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
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const divisionFilters = useMemo(() => {
    const uniqueDivisions = new Map<string, DivisionInfo>([
      ['All', {
        title: 'All',
        color: '#917120',
        division: 'All'
      }]
    ]);
  
    teams.forEach(team => {
      if (team.division && !uniqueDivisions.has(team.division)) {
        uniqueDivisions.set(team.division, {
          title: team.division,
          color: team.color || '#ccc',
          division: team.division as Division
        });
      }
    });
  
    return Array.from(uniqueDivisions.values());
  }, [teams]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`*, pool: pool_id (id, name, division)`)
        .order('name');
  
      if (error) throw error;
      
      setTeams(data as unknown as TeamWithPool[]);
    } catch (error) {
      console.error('Error fetching teams:', error);
      // Consider adding user feedback here
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTeams();
    setRefreshing(false);
  };

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const filteredTeams = useMemo(() => {
    const lowercaseQuery = searchQuery.toLowerCase();
    return teams
      .filter(team => 
        selectedDivision === 'All' || team.division === selectedDivision
      )
      .filter(team => 
        team.name.toLowerCase().includes(lowercaseQuery)
      );
  }, [teams, selectedDivision, searchQuery]);

  const TeamListItem = React.memo(({ item }: { item: TeamWithPool }) => (
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
  ));

  const renderItem = useCallback(({ item }: { item: TeamWithPool }) => (
    <TeamListItem item={item} />
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
            <FlashList
              data={filteredTeams}
              renderItem={renderItem}
              estimatedItemSize={200}
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
  // Layout containers
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  headerContainer: {
    borderBottomColor: '#D9D9D9',
    borderBottomWidth: 1,
  },
  listContainer: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search bar styles
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

  // Filter section
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  filterTitle: {
    fontFamily: 'OutfitLight',
    fontSize: 14,
    color: '#8F8DAA',
  },

  // Team list item
  teamListContainer: {
    gap: 10, 
    flexDirection: 'row', 
    justifyContent: 'flex-start', 
    alignItems: 'center', 
    borderColor: 'gray', 
    borderBottomWidth: 0.2, 
    backgroundColor: '#fff', 
    paddingVertical: 14, 
    marginHorizontal: 16
  },
  teamName: {
    fontFamily: 'OutfitBold',
    fontSize: 16,
    color: '#333243',
  },
  division: {
    color: 'white',
    fontFamily: 'OutfitLight',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 5,
  },
  divisionContainer: {
    borderRadius: 100,
    alignSelf: 'flex-start',
    paddingHorizontal: 5,
    paddingVertical: 2,
  }
});