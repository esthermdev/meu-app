import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import usePushNotifications from '@/hooks/usePushNotifications';
import { Tabs, router } from 'expo-router';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import Header from '@/components/headers/Header';
import { fonts } from '@/constants/Typography';
import { Platform } from 'react-native';

export default function TabLayout() {
  const { expoPushToken } = usePushNotifications();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  
  useEffect(() => {
    console.log('Tab layout mounted, setting up notification listeners');
    
    // Listen for incoming notifications while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
    });
    
    // Handle notification interaction
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const { notification: { request: { content: { data } } } } = response;
      console.log('Notification response received in tabs:', data);
      
      // Handle different notification types with routing
      if (data.type === "new_water_request") {
        router.push('/(user)/admin/water-requests');
        console.log('Navigating to water requests');
      } else if (data.type === "new_medic_request") {
        router.push('/(user)/admin/trainers-list');
        console.log('Navigating to trainers list');
      } else if (data.type === "new_cart_request") {
        router.push('/(user)/admin/cart-requests');
        console.log('Navigating to cart requests');
      } else {
        console.log('Unknown notification type:', data.type);
      }
    });

    // Request notification permissions explicitly (redundant but helpful for testing)
    const requestPermissions = async () => {
      if (Platform.OS === 'ios') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        console.log('iOS notification permission status:', status);
      }
    };
    
    requestPermissions();

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
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