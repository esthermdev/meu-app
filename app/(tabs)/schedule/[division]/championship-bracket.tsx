import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useDivisions } from '@/hooks/useScheduleConfig';
import { useRoundIds } from '@/hooks/useGamesFilter';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import GameComponent from '@/components/GameComponent';

const Tab = createMaterialTopTabNavigator();

export default function ChampionshipBracketScreen() {
  const { divisionId } = useDivisions();
  const { games, loading, error } = useRoundIds(divisionId, 3);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#EA1D25" />
      </View>
    );
  }

  if (error || !games.length) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No games found</Text>
      </View>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#EA1D25',
        tabBarInactiveTintColor: '#8F8DAA',
        tabBarLabelStyle: { fontFamily: 'Outfit-Semibold', fontSize: 12 },
        tabBarIndicatorStyle: { backgroundColor: '#EA1D25' },
        lazy: true,
      }}
    >
      <Tab.Screen name="Crossover" options={{ title: "CP" }}>
        {() => <GameComponent divisionId={divisionId} roundId={2} />}
      </Tab.Screen>
      <Tab.Screen name="Quarters" options={{ title: "Q" }}>
        {() => <GameComponent divisionId={divisionId} roundId={3} />}
      </Tab.Screen>
      <Tab.Screen name="Semi-finals" options={{ title: "SF" }}>
        {() => <GameComponent divisionId={divisionId} roundId={4} />}
      </Tab.Screen>
      <Tab.Screen name="Finals" options={{ title: "F" }}>
        {() => <GameComponent divisionId={divisionId} roundId={5} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}