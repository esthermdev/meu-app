// components/NotificationPrompt.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fonts } from '@/constants/Typography';
import usePushNotifications from '@/hooks/usePushNotifications';

const PROMPT_SHOWN_KEY = 'notification_prompt_shown';

const NotificationPrompt = () => {
  const [visible, setVisible] = useState(false);
  const { notificationPermission, requestNotificationPermissions } = usePushNotifications();

  useEffect(() => {
    // If we already have permission, don't show the prompt
    if (notificationPermission === true) {
      setVisible(false);
      return;
    }
    
    // Only check if the prompt should be shown when permissions aren't granted
    checkIfPromptShown();
  }, [notificationPermission]);

  const checkIfPromptShown = async () => {
    try {
      const promptShown = await AsyncStorage.getItem(PROMPT_SHOWN_KEY);
      if (promptShown !== 'true') {
        // Delay showing the prompt to avoid immediate display on first launch
        setTimeout(() => {
          setVisible(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Error checking prompt status:', error);
    }
  };

  const markPromptAsShown = async () => {
    try {
      await AsyncStorage.setItem(PROMPT_SHOWN_KEY, 'true');
    } catch (error) {
      console.error('Error marking prompt as shown:', error);
    }
  };

  const handleEnable = async () => {
    await requestNotificationPermissions();
    await markPromptAsShown();
    setVisible(false);
  };

  const handleSkip = async () => {
    await markPromptAsShown();
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={handleSkip}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.promptContainer}>
          <Text style={styles.title}>Stay Updated</Text>
          <Text style={styles.description}>
            Would you like to receive notifications on important tournament updates?
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.skipButton]} 
              onPress={handleSkip}
            >
              <Text style={styles.skipButtonText}>Not Now</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.enableButton]} 
              onPress={handleEnable}
            >
              <Text style={styles.enableButtonText}>Enable</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  promptContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    marginBottom: 16,
    textAlign: 'center',
    color: '#FE0000',
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  skipButton: {
    backgroundColor: '#F5F5F5',
  },
  enableButton: {
    backgroundColor: '#FE0000',
  },
  skipButtonText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#333',
  },
  enableButtonText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: 'white',
  },
});

export default NotificationPrompt;