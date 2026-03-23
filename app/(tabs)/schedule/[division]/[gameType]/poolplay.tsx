import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import ComingSoonPlaceholder from '@/components/ComingSoonPlaceholder';
import PoolGameView from '@/components/features/gameviews/PoolGameView';
import { typography } from '@/constants/Typography';
import { usePoolsByDivision } from '@/hooks/useGamesData';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();

export default function PoolPlayScreen() {
  const params = useLocalSearchParams();
  const divisionId = Number(params.division);
  const { pools, loading, error } = usePoolsByDivision(divisionId);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#EA1D25" />
      </View>
    );
  }

  if (error || !pools.length) {
    return <ComingSoonPlaceholder message="No pools available for this division" iconName="pool" />;
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
      }}>
      {pools.map((pool) => (
        <Tab.Screen key={pool.id} name={`POOL ${pool.name}`}>
          {() => <PoolGameView poolId={pool.id} divisionId={divisionId} />}
        </Tab.Screen>
      ))}
    </Tab.Navigator>
  );
}
