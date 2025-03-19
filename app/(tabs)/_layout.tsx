import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Tabs, router } from 'expo-router';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import Header from '@/components/headers/Header';
import { fonts } from '@/constants/Typography';

export default function TabLayout() {
  const notificationResponseListener = useRef<Notifications.Subscription>();
  
  useEffect(() => {
    // Set up notification response listener for navigation
    notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // Extract notification data
      const data = response.notification.request.content.data;

      // Handle notification navigation
      if (data.type === "new_water_request") {
        router.push('/(user)/admin/water-requests');
      } else if (data.type === "new_medic_request") {
        router.push('/(user)/admin/trainers-list');
      } else if (data.type === "new_cart_request") {
        router.push('/(user)/admin/cart-requests');
      }
    });

    return () => {
      if (notificationResponseListener.current) {
        Notifications.removeNotificationSubscription(notificationResponseListener.current);
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
              <TabBarIcon name='house' color={focused ? color : '#00000066'} />
            ),
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            title: 'Schedule',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name='calendar-week' color={focused ? color : '#00000066'} />
            ),
          }}
        />
        <Tabs.Screen
          name="standings"
          options={{
            title: 'Standings',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name='ranking-star' color={focused ? color : '#00000066'} />
            ),
          }}
        />
        <Tabs.Screen
          name="teams"
          options={{
            title: 'Teams',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name='people-group' color={focused ? color : '#00000066'} />
            ),
          }}
        />
        <Tabs.Screen
          name="info"
          options={{
            title: 'Info',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name='circle-info' color={focused ? color : '#00000066'} />
            ),
          }}
        />
      </Tabs>
  );
}