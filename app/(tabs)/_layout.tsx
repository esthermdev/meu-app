import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Tabs, router } from 'expo-router';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import Header from '@/components/headers/Header';
import { fonts } from '@/constants/Typography';

export default function TabLayout() {
  const responseListener = useRef<Notifications.Subscription>();
  
  useEffect(() => {
    // This won't conflict with the listener in usePushNotifications 
    // because we're adding specific routing logic here
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const { notification: { request: { content: { data } } } } = response;
      
      // Handle different notification types with routing
      if (data.type === "new_water_request") {
        router.push('/(user)/admin/water-requests');
        console.log('Notification received:', data);
      }
    });
    
    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

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