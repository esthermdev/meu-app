// app/(tabs)/home/index.tsx (Add this to your existing Home screen)
import React from 'react';
import { View, Button, StyleSheet } from 'react-native';
import usePushNotifications from '@/hooks/usePushNotifications';

// Add this component inside your Home screen
const NotificationTester = () => {
  const { sendTestNotification, expoPushToken, notificationPermission } = usePushNotifications();
  
  return (
    <View style={styles.container}>
      <Button 
        title="Send Test Notification" 
        onPress={sendTestNotification} 
        disabled={!expoPushToken || !notificationPermission}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginTop: 16,
  },
});

export default NotificationTester;