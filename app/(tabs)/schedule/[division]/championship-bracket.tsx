import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useRoundIds } from '@/hooks/useGamesFilter';
import GameComponent from '@/components/GameComponent';

const Tab = createMaterialTopTabNavigator();

export default function ChampionshipBracketScreen() {
  const { division } = useLocalSearchParams();
  const { games, loading, error } = useRoundIds(Number(division), 3);

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
        {() => <GameComponent divisionId={Number(division)} roundId={2} />}
      </Tab.Screen>
      <Tab.Screen name="Quarters" options={{ title: "Q" }}>
        {() => <GameComponent divisionId={Number(division)} roundId={3} />}
      </Tab.Screen>
      <Tab.Screen name="Semi-finals" options={{ title: "SF" }}>
        {() => <GameComponent divisionId={Number(division)} roundId={4} />}
      </Tab.Screen>
      <Tab.Screen name="Finals" options={{ title: "F" }}>
        {() => <GameComponent divisionId={Number(division)} roundId={5} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}