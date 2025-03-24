// hooks/usePushNotifications.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';

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
  const { user } = useAuth();

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

      await saveTokenToStorage(token);

      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }, [user]);

  // Save token function - handles both authenticated and anonymous users
  const saveTokenToStorage = async (token: string) => {
    try {
      // If user is authenticated, save to their profile
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ expo_push_token: token })
          .eq('id', user.id);
          
        if (error) throw error;
        console.log('Push token saved to user profile');
      }
      
      // Always save token to local storage (for anonymous users or backup)
      await AsyncStorage.setItem('expo_push_token', token);
      
      // Store a device identifier for anonymous users
      const deviceId = await getOrCreateDeviceId();
      await AsyncStorage.setItem('device_token_pair', JSON.stringify({
        device_id: deviceId,
        token: token
      }));
    
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };

  // Get or create a unique device ID
  const getOrCreateDeviceId = async () => {
    try {
      const deviceId = await AsyncStorage.getItem('device_id');
      if (deviceId) return deviceId;
      
      // Create a new UUID-like identifier
      const newId = 'device_' + Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);
      await AsyncStorage.setItem('device_id', newId);
      return newId;
    } catch (error) {
      console.error('Error with device ID:', error);
      return 'unknown_device';
    }
  };

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