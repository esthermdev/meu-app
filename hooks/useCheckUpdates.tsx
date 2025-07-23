import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';

export function useCheckUpdates() {
  const [isChecking, setIsChecking] = useState(false);

  // Function to check for updates
  const checkForUpdates = async () => {
    if (isChecking || __DEV__) return;
    
    try {
      setIsChecking(true);
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        
        // Alert the user and let them know an update is ready
        Alert.alert(
          "Update Available",
          "A new version of the app is ready. Restart now to apply the changes?",
          [
            { 
              text: "Later", 
              style: "cancel" 
            },
            { 
              text: "Restart", 
              onPress: async () => {
                await Updates.reloadAsync();
              } 
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Check for updates when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkForUpdates();
      }
    });

    // Initial check when component mounts
    checkForUpdates();

    return () => {
      subscription.remove();
    };
  }, []);

  return { checkForUpdates, isChecking };
}