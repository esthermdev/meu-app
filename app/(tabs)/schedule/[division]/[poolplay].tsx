import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { usePoolIds } from '@/hooks/useGamesFilter';
import PoolScreen from '@/components/PoolScreen';

const Tab = createMaterialTopTabNavigator();

export default function PoolPlayScreen() {
  const { poolplay } = useLocalSearchParams();
  const { pools, loading, error } = usePoolIds(Number(poolplay));

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
            <PoolScreen poolId={pool.id} divisionId={Number(poolplay)} />
          )}
        />
      ))}
    </Tab.Navigator>
  );
}