// components/NotificationPermission.tsx
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import usePushNotifications from '@/hooks/usePushNotifications';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';

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
        <CustomText style={styles.enabledText}>Notifications are enabled</CustomText>
      </View>
    );
  }

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {!compact && (
        <>
          <FontAwesome5 name="bell-slash" size={20} color="#757575" />
          <CustomText style={styles.disabledText}>
            Enable notifications to stay updated on game schedules and important tournament information
          </CustomText>
        </>
      )}
      <TouchableOpacity 
        style={[styles.button, compact && styles.compactButton]} 
        onPress={handleEnablePress}
        disabled={isChecking}
      >
        <CustomText style={styles.buttonText}>
          {isChecking ? "Checking..." : (compact ? "Enable Notifications" : "Enable Now")}
        </CustomText>
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
    marginBottom: 40,
  },
  compactContainer: {
    backgroundColor: 'transparent',
    padding: 0,
    alignItems: 'flex-end',
  },
  enabledText: {
    ...typography.textMedium,
    color: '#4CAF50',
  },
  disabledText: {
    color: '#616161',
    textAlign: 'center',
    ...typography.textMedium,
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
    ...typography.textMedium
  },
});

export default NotificationPermission;