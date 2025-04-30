import { View, ActivityIndicator, Text } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { usePoolIds } from '@/hooks/useGamesFilter';
import { useLocalSearchParams } from 'expo-router';
import { typography } from '@/constants/Typography';
import PoolGameComponent from '@/components/features/gameviews/PoolGameComponent';


const Tab = createMaterialTopTabNavigator();

export default function PoolPlayScreen() {
  const params = useLocalSearchParams();
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
        tabBarInactiveTintColor: '#000',
        tabBarLabelStyle: { ...typography.textXSmall },
        tabBarIndicatorStyle: { backgroundColor: '#EA1D25' },
        tabBarAllowFontScaling: false,
        lazy: true,
      }}
    >
      {pools.map((pool) => (
        <Tab.Screen
          key={pool.id}
          name={`POOL ${pool.name}`}
          children={() => (
            <PoolGameComponent poolId={pool.id} divisionId={divisionId} />
          )}
        />
      ))}
    </Tab.Navigator>
  );
}