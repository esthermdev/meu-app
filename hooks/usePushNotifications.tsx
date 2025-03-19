// hooks/usePushNotifications.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Key for storing if we've already initialized notifications
const NOTIFICATIONS_INITIALIZED = 'notifications_initialized';

const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>(undefined);
  const [notificationPermission, setNotificationPermission] = useState<boolean | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const isInitialized = useRef(false);

  // Register for push notifications
  const registerForPushNotifications = useCallback(async () => {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        console.error('Missing project ID for push notifications');
        return null;
      }
      
      const pushTokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      
      const token = pushTokenResponse.data;
      console.log('Push token obtained:', token);
      setExpoPushToken(token);
      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }, []);

  // Check if notification permissions are granted
  const checkPermissions = useCallback(async () => {
    // Only run this once per session to avoid excessive permission checks
    if (isInitialized.current) return notificationPermission;
    
    isInitialized.current = true;
    
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const isGranted = status === 'granted';
      
      // Update state only if different to avoid re-renders
      setNotificationPermission(isGranted);
      
      if (isGranted) {
        await registerForPushNotifications();
      }
      
      return isGranted;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }, [registerForPushNotifications]);

  // Request notification permissions
  const requestNotificationPermissions = useCallback(async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const isGranted = status === 'granted';
      
      // Important: Update the permission state
      setNotificationPermission(isGranted);
      
      if (isGranted) {
        await registerForPushNotifications();
      }
      
      return isGranted;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }, [registerForPushNotifications]);

  // Initial setup
  useEffect(() => {
    // Configure Android channel
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Check existing permissions only once at startup
    const initializeNotifications = async () => {
      await checkPermissions();
      
      // Mark as initialized in storage to avoid showing prompt again
      await AsyncStorage.setItem(NOTIFICATIONS_INITIALIZED, 'true');
    };

    initializeNotifications();

    // Setup notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
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
  }, [checkPermissions]);

  // Send local test notification
  const sendTestNotification = useCallback(async () => {
    if (!notificationPermission) {
      console.log('Notification permission not granted');
      return false;
    }
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Notification",
          body: "This is a test notification",
          data: { type: "test" },
        },
        trigger: null, // Send immediately
      });
      
      console.log('Test notification sent');
      return true;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  }, [notificationPermission]);

  return {
    expoPushToken,
    notificationPermission,
    requestNotificationPermissions,
    sendTestNotification,
    checkPermissions,
  };
};

export default usePushNotifications;