// app/(tabs)/teams/index.tsx

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  RefreshControl, 
  Keyboard, 
  ActivityIndicator,
  TextInput,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Image
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { Database } from '@/database.types';
import { fonts, typography } from '@/constants/Typography';
import LoadingIndicator from '@/components/LoadingIndicator';
import CustomText from '@/components/CustomText';

type TeamRow = Database['public']['Tables']['teams']['Row'];
type PoolRow = Database['public']['Tables']['pools']['Row'];
type DivisionRow = Database['public']['Tables']['divisions']['Row'];

interface TeamWithDetails extends TeamRow {
  pool: PoolRow | null;
  division_details: DivisionRow | null;
}

interface DivisionInfo {
  title: string;
  code: string;
  color: string;
  color_light: string;
  id: number;
}

const Teams = () => {
  const [teams, setTeams] = useState<TeamWithDetails[]>([]);
  const [divisions, setDivisions] = useState<DivisionInfo[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      // Fetch teams with division details
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`
          *,
          pool: pool_id (*),
          division_details: division_id (*)
        `)
        .order('name');
  
      if (teamsError) throw teamsError;
      setTeams(teamsData as unknown as TeamWithDetails[]);
      
      // Fetch divisions
      const { data: divisionsData, error: divisionsError } = await supabase
        .from('divisions')
        .select('*')
        .order('display_order');
        
      if (divisionsError) throw divisionsError;
      
      // Create "All" filter and add with fetched divisions
      const allDivisions: DivisionInfo[] = [
        {
          id: 0,
          title: 'All',
          code: 'All',
          color: '#EA1D25',
          color_light: '#EA1D2517'
        },
        ...divisionsData.map((div: DivisionRow) => ({
          id: div.id,
          title: div.title,
          code: div.code,
          color: div.color,
          color_light: div.color_light || '#FFFFFF'
        }))
      ];
      
      setDivisions(allDivisions);
      
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const navigateToTeamDetails = (team: TeamWithDetails) => {
    // Navigate to team details/games
    router.push(`/teams/${team.id}`);
  };

  // Filter teams based on selected division and search query
  const filteredTeams = useMemo(() => {
    const lowercaseQuery = searchQuery.toLowerCase();
    return teams
      .filter(team => 
        selectedDivision === 'All' || team.division_details?.code === selectedDivision
      )
      .filter(team => 
        team.name.toLowerCase().includes(lowercaseQuery)
      );
  }, [teams, selectedDivision, searchQuery]);

  const renderTeamItem = ({ item }: { item: TeamWithDetails }) => {
    // Get division info either from division_details or find in divisions array by division code
    let divisionInfo = {
      title: item.division_details?.title || 'Unknown',
      color: '#EFEFEF',
      color_light: '#EFEFEF',
      textColor: '#333333'
    };
    
    if (item.division_details) {
      // Use division details directly from the team's joined division_details
      divisionInfo = {
        title: item.division_details.title,
        color: item.division_details.color,
        color_light: item.division_details.color_light || '#FFFFFF',
        textColor: item.division_details.color
      };
    }
    
    return (
      <TouchableOpacity 
        style={styles.teamItem}
        onPress={() => navigateToTeamDetails(item)}
      >
        <View style={styles.teamContent}>
          <View style={styles.teamAvatarContainer}>
            <View style={styles.teamAvatar}>
              {item.avatar_uri ? (
                <Image 
                  source={item.avatar_uri ? { uri: item.avatar_uri } : require('@/assets/images/avatar-placeholder.png') } 
                  style={styles.teamAvatarImage} 
                />
              ) : (
                <Text style={styles.teamAvatarText}>{item.name.charAt(0)}</Text>
              )}
            </View>
          </View>
          
          <View style={styles.teamInfo}>
            <CustomText style={styles.teamName}>{item.name}</CustomText>
            <View style={[
              styles.divisionLabel, 
              { 
                backgroundColor: divisionInfo.color_light,
                borderColor: divisionInfo.color,
                borderWidth: 1
              }
            ]}>
              <CustomText style={[
                styles.divisionText,
                { color: divisionInfo.textColor }
              ]}>
                {divisionInfo.title}
              </CustomText>
            </View>
          </View>
          <MaterialIcons name='keyboard-arrow-right' size={24} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        
        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color="#86939e" style={styles.searchIcon} />
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
        
        {/* Filters Section */}
        <View style={styles.filtersSection}>
          <View style={styles.filterButtonsContainer}>
            <CustomText style={styles.filterLabel}>Filter:</CustomText>
            {divisions.map((division) => {       
              return (
                <TouchableOpacity
                  key={division.code}
                  style={[
                    styles.filterButton,
                    { 
                      backgroundColor: division.color_light,
                      borderColor: division.color,
                      borderWidth: 1
                    },
                    selectedDivision === division.code && { 
                      borderWidth: 1,
                      borderColor: division.color
                    }
                  ]}
                  onPress={() => setSelectedDivision(division.code)}
                >
                  <CustomText style={[styles.filterButtonText, { color: division.color }]} >{division.title}</CustomText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        
        {/* Team List */}
        <View style={styles.listContainer}>
          {loading ? (
            <LoadingIndicator message='Loading Teams...' />
          ) : (
            <FlashList
              data={filteredTeams}
              renderItem={renderTeamItem}
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
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No teams found</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchBarContainer: {
    marginVertical: 15,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  filtersSection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  filterLabel: {
    ...typography.textBold,
    color: '#808080',
    marginRight: 5,
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5
  },
  filterButton: {
    paddingHorizontal: 7,
    borderRadius: 100,
  },
  filterButtonText: {
    ...typography.textSmallMedium,
  },
  listContainer: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    paddingHorizontal: 20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    ...typography.textMedium,
    color: '#8F8DAA',
    textAlign: 'center',
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  teamContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamAvatarContainer: {
    marginRight: 15,
  },
  teamAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#000',
  },
  teamAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  teamAvatarText: {
    ...typography.textBold,
    color: '#333',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    ...typography.textBold,
    color: '#333243',
    marginBottom: 5,
  },
  divisionLabel: {
    alignSelf: 'flex-start',
    borderRadius: 100,
    paddingHorizontal: 7,
  },
  divisionText: {
    ...typography.textXSmall
  },
});

export default Teams;