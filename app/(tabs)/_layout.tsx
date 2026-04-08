import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { router, Tabs } from 'expo-router';

import Header from '@/components/headers/Header';
import { TabBarIcon } from '@/components/TabBarIcon';
import { typography } from '@/constants/Typography';

export default function TabLayout() {
  const notificationResponseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Set up notification response listener for navigation
    notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      // Extract notification data
      const data = response.notification.request.content.data;
      const type = typeof data?.type === 'string' ? data.type : null;

      // Handle notification navigation
      if (type === 'new_water_request') {
        router.push('/(user)/water-requests');
      } else if (type === 'new_medic_request') {
        router.push('/(user)/trainers-list');
      } else if (type === 'new_cart_request') {
        router.push('/(user)/cart-requests');
      } else if (type === 'announcement') {
        router.push('/(tabs)/home/notifications');
      } else if (type === 'admin_chat_message') {
        const conversationId = typeof data?.conversationId === 'string' ? data.conversationId : null;
        if (conversationId) {
          router.push(`/(user)/admin/chat/${conversationId}`);
        } else {
          router.push('/(user)/admin/chat-list');
        }
      } else if (type === 'user_chat_message') {
        router.push('/(tabs)/home/chat');
      }
    });

    return () => {
      if (notificationResponseListener.current) {
        notificationResponseListener.current.remove();
      }
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#EA1D25',
        header: () => <Header />,
        tabBarLabelStyle: {
          ...typography.textXSmall,
        },
        tabBarItemStyle: {
          height: '100%',
        },
        tabBarAllowFontScaling: false,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="house" color={focused ? color : '#00000066'} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="calendar-week" color={focused ? color : '#00000066'} />,
        }}
      />
      <Tabs.Screen
        name="standings"
        options={{
          title: 'Standings',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="ranking-star" color={focused ? color : '#00000066'} />,
        }}
      />
      <Tabs.Screen
        name="teams"
        options={{
          title: 'Teams',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="people-group" color={focused ? color : '#00000066'} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="circle-user" color={focused ? color : '#00000066'} />,
        }}
      />
    </Tabs>
  );
}
