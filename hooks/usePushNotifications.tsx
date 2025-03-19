// hooks/usePushNotifications.tsx
import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';

// Define the type for the push token
export type ExpoPushToken = string;

// Define notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<ExpoPushToken | undefined>(undefined);
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
  const [notificationPermission, setNotificationPermission] = useState<boolean>(false);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Setup notification listeners immediately for all users
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
    });

    // Configure Android channel
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      }).catch(err => console.log('Error setting Android channel:', err));
    }

    // Check for existing permissions first, don't auto-request for non-logged in users
    Notifications.getPermissionsAsync().then(({ status }) => {
      setNotificationPermission(status === 'granted');
      
      // Only attempt to get push token if already granted permissions AND logged in
      if (status === 'granted') {
        registerForPushNotificationsIfLoggedIn().catch(err => {
          // Silently handle errors - no console.error
          console.log('Push registration skipped or failed');
        });
      }
    });

    // Cleanup on unmount
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Check auth and register for push if user is logged in
  const registerForPushNotificationsIfLoggedIn = async () => {
    try {
      // Check authentication first
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // User not logged in, exit silently without errors
        return;
      }
      
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.log('Missing project ID');
        return;
      }
      
      // Only get token if user is authenticated
      const pushToken = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      
      setExpoPushToken(pushToken.data);
      
      // Update token in database
      await supabase
        .from('profiles')
        .update({ expo_push_token: pushToken.data })
        .eq('id', user.id);
        
    } catch (err) {
      // Log quietly to avoid error messages
      console.log('Push token registration issue');
    }
  };

  // Function to request permissions explicitly - call this when user logs in
  const requestNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationPermission(status === 'granted');
      
      if (status === 'granted') {
        await registerForPushNotificationsIfLoggedIn();
      }
      
      return status === 'granted';
    } catch (err) {
      console.log('Permission request issue');
      return false;
    }
  };

  return {
    expoPushToken,
    notification,
    notificationPermission,
    requestNotificationPermissions,
    registerForPushNotificationsIfLoggedIn,
  };
};

export default usePushNotifications;