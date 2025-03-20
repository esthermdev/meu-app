import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useDivisions } from '@/hooks/useScheduleConfig';
import { usePoolIds } from '@/hooks/useGamesFilter';
import PoolGameComponent from '@/components/PoolGameComponent';
import { useLocalSearchParams } from 'expo-router';
import PoolAdminView from '@/components/AdminPoolGameView';


const Tab = createMaterialTopTabNavigator();

export default function PoolPlayScreen() {
  const params = useLocalSearchParams();
  console.log(params)
  const divisionId = Number(params.division)
  const { pools, loading, error } = usePoolIds(divisionId);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#EA1D25" />
      </View>
    );
  }

  if (error || !pools.length) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No pools found</Text>
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
      {pools.map((pool) => (
        <Tab.Screen
          key={pool.id}
          name={`Pool ${pool.name}`}
          children={() => (
            <PoolAdminView poolId={pool.id} divisionId={divisionId} />
          )}
        />
      ))}
    </Tab.Navigator>
  );
}