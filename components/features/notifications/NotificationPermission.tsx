// components/NotificationPermission.tsx
import React, { useCallback, useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import * as Notifications from 'expo-notifications';

import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';
import usePushNotifications from '@/hooks/usePushNotifications';

import { FontAwesome5 } from '@expo/vector-icons';

interface NotificationPermissionProps {
  compact?: boolean;
}

const NotificationPermission: React.FC<NotificationPermissionProps> = ({ compact = false }) => {
  const { notificationPermission, requestNotificationPermissions } = usePushNotifications();
  const [isChecking, setIsChecking] = useState(false);

  const openSettings = useCallback(() => {
    // Use Linking to open device settings
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      // For Android, open app settings
      Linking.openSettings();
    }
  }, []);

  const showSettingsAlert = useCallback(() => {
    Alert.alert(
      'Notifications Disabled',
      'Notifications are disabled in your device settings. Would you like to open settings to enable them?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: openSettings,
        },
      ],
    );
  }, [openSettings]);

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
  }, [requestNotificationPermissions, showSettingsAlert]);

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
        disabled={isChecking}>
        <CustomText style={styles.buttonText}>
          {isChecking ? 'Checking...' : compact ? 'Enable Notifications' : 'Enable Now'}
        </CustomText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#EA1D25',
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  buttonText: {
    ...typography.textMedium,
    color: '#FFFFFF',
  },
  compactButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  compactContainer: {
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
    padding: 0,
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    flexDirection: 'column',
    gap: 12,
    marginBottom: 40,
    marginVertical: 20,
    padding: 16,
  },
  disabledText: {
    color: '#616161',
    textAlign: 'center',
    ...typography.textMedium,
  },
  enabledText: {
    ...typography.textMedium,
    color: '#4CAF50',
  },
});

export default NotificationPermission;
