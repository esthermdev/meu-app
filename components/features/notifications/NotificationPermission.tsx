// components/NotificationPermission.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import usePushNotifications from '@/hooks/usePushNotifications';
import { fonts } from '@/constants/Typography';

interface NotificationPermissionProps {
  compact?: boolean;
}

const NotificationPermission: React.FC<NotificationPermissionProps> = ({ compact = false }) => {
  const { notificationPermission, requestNotificationPermissions } = usePushNotifications();
  const [isChecking, setIsChecking] = useState(false);

  const handleEnablePress = useCallback(async () => {
    setIsChecking(true);
    
    // First, check current permission status
    const { status } = await Notifications.getPermissionsAsync();
    
    if (status === 'denied') {
      // If permissions are denied at the system level, we need to direct user to settings
      showSettingsAlert();
    } else {
      // Try to request permissions normally
      await requestNotificationPermissions();
    }
    
    setIsChecking(false);
  }, [requestNotificationPermissions]);

  const showSettingsAlert = () => {
    Alert.alert(
      "Notifications Disabled",
      "Notifications are disabled in your device settings. Would you like to open settings to enable them?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Open Settings", 
          onPress: openSettings 
        }
      ]
    );
  };

  const openSettings = () => {
    // Use Linking to open device settings
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      // For Android, open app settings
      Linking.openSettings();
    }
  };

  // If permission is granted, either show nothing (compact mode) or the enabled message
  if (notificationPermission) {
    return compact ? null : (
      <View style={styles.container}>
        <FontAwesome5 name="bell" size={20} color="#4CAF50" />
        <Text style={styles.enabledText}>Notifications are enabled</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {!compact && (
        <>
          <FontAwesome5 name="bell-slash" size={20} color="#757575" />
          <Text style={styles.disabledText}>
            Enable notifications to stay updated on game schedules and important tournament information
          </Text>
        </>
      )}
      <TouchableOpacity 
        style={[styles.button, compact && styles.compactButton]} 
        onPress={handleEnablePress}
        disabled={isChecking}
      >
        <Text style={styles.buttonText}>
          {isChecking ? "Checking..." : (compact ? "Enable Notifications" : "Enable Now")}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'column',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  compactContainer: {
    backgroundColor: 'transparent',
    padding: 0,
    alignItems: 'flex-end',
  },
  enabledText: {
    fontFamily: fonts.medium,
    color: '#4CAF50',
    fontSize: 16,
  },
  disabledText: {
    fontFamily: fonts.regular,
    color: '#616161',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#EA1D25',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  compactButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonText: {
    fontFamily: fonts.medium,
    color: 'white',
    fontSize: 14,
  },
});

export default NotificationPermission;