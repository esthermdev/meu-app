import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { usePoolIds } from '@/hooks/useGamesFilter';

export default function DivisionStandings() {
  const { division } = useLocalSearchParams();
  const { pools, loading, error } = usePoolIds(Number(division));

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
    <View>
      {pools.map((pool, index) => (
        <View key={index}>
          <Text>{pool.name}</Text>
        </View>
      ))}
    </View>
  );
}