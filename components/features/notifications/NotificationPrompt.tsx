// components/NotificationPrompt.tsx
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

import { fonts } from '@/constants/Typography';
import usePushNotifications from '@/hooks/usePushNotifications';

import AsyncStorage from '@react-native-async-storage/async-storage';

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
    <Modal transparent={true} animationType="fade" visible={visible} onRequestClose={handleSkip}>
      <TouchableWithoutFeedback onPress={handleSkip}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.promptContainer}>
              <Text style={styles.title}>Stay Updated</Text>
              <Text style={styles.description}>
                Would you like to receive notifications on important tournament updates?
              </Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.button, styles.skipButton]} onPress={handleSkip}>
                  <Text style={styles.skipButtonText}>Not Now</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.enableButton]} onPress={handleEnable}>
                  <Text style={styles.enableButtonText}>Enable</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 8,
    paddingVertical: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  description: {
    color: '#333',
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  enableButton: {
    backgroundColor: '#FE0000',
  },
  enableButtonText: {
    color: 'white',
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  promptContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    maxWidth: 400,
    padding: 24,
    width: '100%',
  },
  skipButton: {
    backgroundColor: '#F5F5F5',
  },
  skipButtonText: {
    color: '#333',
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  title: {
    color: '#FE0000',
    fontFamily: fonts.bold,
    fontSize: 22,
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default NotificationPrompt;
