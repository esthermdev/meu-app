// hooks/usePushNotifications.tsx
import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
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
    // Register for push notifications
    registerForPushNotificationsAsync().then(result => {
      if (result.token) {
        console.log('Push token received:', result.token);
        setExpoPushToken(result.token);
        setNotificationPermission(result.permission);
        // Update the user's profile with the token
        updateUserPushToken(result.token);
      } else {
        console.error('Failed to get push token:', result.error);
      }
    });

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      setNotification(notification);
    });

    // Listen for notification responses (when user taps on notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
    });

    // Add foreground notification handler for testing
    const foregroundSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Foreground notification tapped:', response);
    });

    // Cleanup on unmount
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      foregroundSubscription.remove();
    };
  }, []);

  // Update the user's profile with the push token
  const updateUserPushToken = async (token: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        console.log('Updating token for user:', user.id);
        const { error, data } = await supabase
          .from('profiles')
          .update({ expo_push_token: token })
          .eq('id', user.id)
          .select();
        
        if (error) {
          console.error('Error updating push token:', error);
        } else {
          console.log('Push token updated successfully:', data);
        }
      } else {
        console.log('No authenticated user found');
      }
    } catch (error) {
      console.error('Error in updateUserPushToken:', error);
    }
  };

  // Test sending a notification to the current device
  const sendTestNotification = async () => {
    if (!expoPushToken) {
      Alert.alert('Error', 'No push token available');
      return;
    }

    try {
      const message = {
        to: expoPushToken,
        sound: 'default',
        title: 'Test Notification',
        body: 'This is a test notification from your app',
        data: { type: 'test_notification' },
      };

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      Alert.alert('Success', 'Test notification sent');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  return {
    expoPushToken,
    notification,
    notificationPermission,
    sendTestNotification,
  };
};

// Function to register for push notifications
async function registerForPushNotificationsAsync() {
  let token;
  let errorMsg = '';
  let hasPermission = false;

  // Configure Android channel
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      console.log('Android notification channel configured');
    } catch (error) {
      console.error('Error setting Android notification channel:', error);
    }
  }

  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('Existing notification permission status:', existingStatus);
    
    let finalStatus = existingStatus;
    
    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      console.log('Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('New notification permission status:', finalStatus);
    }
    
    if (finalStatus !== 'granted') {
      errorMsg = 'Failed to get push token for push notification!';
      console.warn(errorMsg);
      return { 
        token: undefined, 
        permission: false, 
        error: errorMsg 
      };
    }
    
    hasPermission = true;
    
    // Verify project ID
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    console.log("Project ID:", projectId);
    
    if (!projectId) {
      errorMsg = 'Missing project ID in app config';
      console.error(errorMsg);
      return { 
        token: undefined, 
        permission: hasPermission, 
        error: errorMsg 
      };
    }
    
    // Get the token
    const pushToken = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    
    token = pushToken.data;
    console.log("Received push token:", token);
  } catch (error) {
    console.error("Error in registerForPushNotificationsAsync:", error);
    errorMsg = `Error getting push token: ${error}`;
  }

  return { 
    token, 
    permission: hasPermission, 
    error: errorMsg || null 
  };
}

export default usePushNotifications;