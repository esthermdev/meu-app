import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { GameComponent } from './GameComponent';
import { supabase } from '@/lib/supabase';

const Tab = createMaterialTopTabNavigator();

interface Round {
  id: number;
  name: string;
}

const roundNames: { [key: number]: string } = {
  1: 'PP',
  2: 'CP',
  3: 'QF',
  4: 'SF',
  5: 'F'
};

interface GameRoundsNavigatorProps {
  divisionId: number;
  scheduleId: number;
  title: string;
}

export default function GameRoundsNavigator({ 
  divisionId, 
  scheduleId, 
  title 
}: GameRoundsNavigatorProps) {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRounds();
  }, [divisionId, scheduleId]);

  const fetchRounds = async () => {
    const { data, error } = await supabase
      .from('games')
      .select('round_id')
      .eq('division_id', divisionId)
      .eq('schedule_id', scheduleId)
      .order('round_id');

    if (error) {
      console.error('Error fetching rounds:', error);
      return;
    }

    // Get unique round IDs and create round objects
    const uniqueRounds = [...new Set(data.map(game => game.round_id))];
    const roundsData = uniqueRounds.map(roundId => ({
      id: Number(roundId),
      name: roundNames[roundId]
    }));
    console.log(roundsData)

    setRounds(roundsData);
    setLoading(false);
  };

  if (loading) {
    return null;
  }

  // If there's only one round, render GameComponent directly
  if (rounds.length === 1) {
    return (
      <GameComponent 
        divisionId={divisionId} 
        scheduleId={scheduleId} 
        title={title}
        roundId={rounds[0].id}
      />
    );
  }

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#EA1D25',
        tabBarInactiveTintColor: '#8F8DAA',
        tabBarLabelStyle: { fontFamily: 'OutfitSemibold', fontSize: 12 },
        tabBarIndicatorStyle: { backgroundColor: '#EA1D25' },
      }}
    >
      {rounds.map((round) => (
        <Tab.Screen
          key={round.id}
          name={round.name}
          options={{ title: round.name }}
        >
          {() => (
            <GameComponent
              divisionId={divisionId}
              scheduleId={scheduleId}
              title={title}
              roundId={round.id}
            />
          )}
        </Tab.Screen>
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#D9D9D9',
  },
  tabItem: {
    width: 'auto',
    padding: 0,
    minHeight: 40,
  },
  tabLabel: {
    textTransform: 'none',
    fontSize: 14,
    color: '#000',
    fontFamily: 'OutfitMedium',
  },
  tabIndicator: {
    backgroundColor: '#EA1D25',
    height: 3,
  },
});