import { Tabs } from 'expo-router';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import Header from '@/components/headers/Header';
import { fonts } from '@/constants/Typography';

export default function TabLayout() {
  return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#EA1D25',
          header: () => <Header />,
          tabBarLabelStyle: {
            fontFamily: fonts.regular,
            fontSize: 12,
          },
          tabBarItemStyle: {
            height: '100%',
          },
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
            title: 'Info',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'information-circle' : 'information-circle-outline'} color={color} />
            ),
          }}
        />
      </Tabs>
  );
}