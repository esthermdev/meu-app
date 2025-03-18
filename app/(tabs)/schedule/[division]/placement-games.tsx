// app/(tabs)/schedule/placement-games.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useDivisions } from '@/hooks/useScheduleConfig';
import GameComponent from '@/components/GameComponent';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/database.types';
import LoadingIndicator from '@/components/LoadingIndicator';
import { formatDate } from '@/utils/formatDate';
import { typography } from '@/constants/Typography';
import { FontAwesome } from '@expo/vector-icons';

type Round = Tables<'rounds'>;
type Game = Tables<'games'> & {
  datetime: Tables<'datetime'> | null;
};

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// Define which round IDs to show on this screen
const PLACEMENT_ROUND_IDS = [6, 7, 8, 9, 10, 11, 12];

export default function PlacementGames() {
  const { divisionId } = useDivisions();
  const [loading, setLoading] = useState(true);
  const [placementRounds, setPlacementRounds] = useState<Round[]>([]);
  const [roundsWithGames, setRoundsWithGames] = useState<{[key: number]: boolean}>({});
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<{[key: number]: boolean}>({});

  // Fetch placement rounds from the database
  useEffect(() => {
    const fetchPlacementRounds = async () => {
      setLoading(true);
      
      try {
        // Fetch only the rounds with IDs we want to display
        const { data, error } = await supabase
          .from('rounds')
          .select('*')
          .in('id', PLACEMENT_ROUND_IDS)
          .order('id', { ascending: true });
        
        if (error) throw error;
        
        if (data) {
          setPlacementRounds(data);
        }
      } catch (error) {
        console.error('Error fetching placement rounds:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlacementRounds();
  }, []);

  useEffect(() => {
    if (placementRounds.length > 0) {
      const initialExpandedState: {[key: number]: boolean} = {};
      placementRounds.forEach(round => {  
        initialExpandedState[round.id] = true; // Start with all sections expanded
      });
      setExpandedSections(initialExpandedState);
    }
  }, [placementRounds]);

  const toggleSection = (roundId: number) => {
    // Configure the animation
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    // Toggle the section
    setExpandedSections(prev => ({
      ...prev,
      [roundId]: !prev[roundId]
    }));
  };
  

  // Fetch games and extract dates
  useEffect(() => {
    const fetchGames = async () => {
      if (!divisionId || placementRounds.length === 0) return;
      
      try {
        const status: {[key: number]: boolean} = {};
        let fetchedGames: Game[] = [];
        
        // Get all games for this division in the placement rounds
        const { data, error } = await supabase
          .from('games')
          .select(`
            *,
            datetime:datetime_id(*)
          `)
          .eq('division_id', divisionId)
          .in('round_id', PLACEMENT_ROUND_IDS);
        
        if (error) throw error;
        
        if (data) {
          fetchedGames = data as unknown as Game[];
          setAllGames(fetchedGames);
          
          // Extract unique dates
          const uniqueDates = [...new Set(fetchedGames
            .filter(game => game.datetime?.date)
            .map(game => game.datetime?.date || '')
          )];
          uniqueDates.sort(); // Sort dates chronologically
          setDates(uniqueDates);
          
          // Set default date if there are games
          if (uniqueDates.length > 0 && !selectedDate) {
            setSelectedDate(uniqueDates[0]);
          }
          
          // Check which rounds have games
          placementRounds.forEach(round => {
            status[round.id] = fetchedGames.some(game => game.round_id === round.id);
          });
          
          setRoundsWithGames(status);
        }
      } catch (error) {
        console.error('Error fetching games:', error);
      }
    };

    if (divisionId && placementRounds.length > 0) {
      fetchGames();
    }
  }, [divisionId, placementRounds]);

  if (loading) {
    return <LoadingIndicator message='Loading placement games...' />;
  }

  // Filter games by selected date and round
  const getGamesForRoundAndDate = (roundId: number) => {
    if (!selectedDate) return true; // If no date selected, show all
    
    // Check if the round has any games on the selected date
    const hasGamesOnDate = allGames.some(game => 
      game.round_id === roundId && 
      game.datetime?.date === selectedDate
    );
    
    return hasGamesOnDate;
  };

  // Render date filter
  const renderDateFilter = () => (
    <View style={styles.dateFilterContainer}>
      <Text style={styles.dateLabel}>Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
        <TouchableOpacity
          style={[
            styles.dateButton,
            !selectedDate && styles.selectedDateButton
          ]}
          onPress={() => setSelectedDate('')}
        >
          <Text style={[
            styles.dateButtonText,
            !selectedDate && styles.selectedDateText
          ]}>
            All
          </Text>
        </TouchableOpacity>
        
        {dates.map((date) => (
          <TouchableOpacity
            key={date}
            style={[
              styles.dateButton,
              selectedDate === date && styles.selectedDateButton
            ]}
            onPress={() => setSelectedDate(date)}
          >
            <Text style={[
              styles.dateButtonText,
              selectedDate === date && styles.selectedDateText
            ]}>
              {formatDate(date, 'short')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {renderDateFilter()}
      
      {placementRounds.map((round) => (
        // Only render sections that have games for the current division and selected date
        roundsWithGames[round.id] && getGamesForRoundAndDate(round.id) ? (
          <View key={round.id} style={styles.section}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => toggleSection(round.id)}
            >
              <Text style={styles.sectionTitle}>{round.stage}</Text>
              {expandedSections[round.id] ? <FontAwesome name='caret-up' size={24} color={'#fff'} /> : <FontAwesome name='caret-down' size={24} color={'#fff'} />}
            </TouchableOpacity>
            
            {expandedSections[round.id] && (
              <GameComponent 
                divisionId={divisionId} 
                roundId={round.id}
              />
            )}
          </View>
        ) : null
      ))}
      
      {/* Show a message if no games are found */}
      {placementRounds.length === 0 || Object.values(roundsWithGames).every(value => !value) ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No placement games scheduled yet</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateFilterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    ...typography.bodyMedium,
    color: '#333',
    marginRight: 12
  },
  dateScroll: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 7
  },
  dateButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  dateButtonText: {
    ...typography.bodyMedium,
    color: '#999999'
  },
  selectedDateButton: {
    backgroundColor: '#FE0000',
  },
  selectedDateText: {
    color: '#fff',
    ...typography.bodyMedium
  },
  section: {
    marginBottom: 10,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#EA1D25',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandIcon: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    ...typography.h5,
    color: '#fff',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'GeistRegular',
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  }
});