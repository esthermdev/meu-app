import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Header from '@/components/headers/Header';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          header: () => <Header />,
          tabBarLabelStyle: {fontFamily: 'OutfitRegular'}

        }}>
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            title: 'Schedule',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'calendar' : 'calendar-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="teams"
          options={{
            title: 'Teams',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'people' : 'people-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="standings"
          options={{
            title: 'Standings',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'podium' : 'podium-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="info"
          options={{
            title: 'Information',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'information-circle' : 'information-circle-outline'} color={color} />
            ),
          }}
        />
      </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarLabel: {
    fontFamily: 'OutfitRegular',
    
  }
})