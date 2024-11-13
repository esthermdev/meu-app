import { View, Text, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useGames, usePoolIds } from '@/hooks/useGamesFilter';
import { FlashList } from '@shopify/flash-list';
import { Database } from '@/database.types';

const Tab = createMaterialTopTabNavigator()

export default function PoolPlayScreen() {
  const { poolplay } = useLocalSearchParams()

  const { games, loading, error } = useGames(Number(poolplay), 1);
  const { pools } = usePoolIds(Number(poolplay))
  console.log(pools)

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#EA1D25',
          tabBarInactiveTintColor: '#8F8DAA',
          tabBarLabelStyle: { fontFamily: 'Outfit-Semibold', fontSize: 12 },
          tabBarIndicatorStyle: { backgroundColor: '#EA1D25' },
        }}
      >
        {pools.map((pool) => (
          <Tab.Screen
            key={pool.id}
            name={pool.name}
            options={{ title: pool.name }}
          >
            {() => <View><Text>Pool{pool.name} Screen</Text></View>}
          </Tab.Screen>
        ))}

      </Tab.Navigator>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#D9D9D9',
    paddingTop: 10
  },
})

