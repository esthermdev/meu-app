import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import usePushNotifications from '@/hooks/usePushNotifications';
import * as Notifications from "expo-notifications";
import { router } from 'expo-router';

export default function WaterRequestNotification() {
  const { expoPushToken, notification } = usePushNotifications();

  useEffect(() => {
    let isMounted = true;
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      if (isMounted) {
        handleNotificationResponse(response);
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const { notification: { request: { content: { data } } } } = response;
    console.log(response)

    if (data.type === "new_water_request") {
      console.log('This is a test:', data)
      router.push('/(tabs)/home');
    }
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'space-around' }}>
      <Text>WATER token: {expoPushToken ? expoPushToken : 'Not available'}</Text>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text>Title: {notification ? notification.request.content.title : 'No notification'} </Text>
        <Text>Body: {notification ? notification.request.content.body : 'No notification'}</Text>
        <Text>Data: {notification ? JSON.stringify(notification.request.content.data) : 'No data'}</Text>
      </View>
    </View>
  );
}