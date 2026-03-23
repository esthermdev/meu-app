import { useCallback, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Updates from 'expo-updates';

export function useCheckForAppUpdates() {
  const [isChecking, setIsChecking] = useState(false);

  // Function to check for updates
  const checkForUpdates = useCallback(async () => {
    if (isChecking || __DEV__) return;

    try {
      setIsChecking(true);

      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();

        // Automatically restart the app to apply the update
        await Updates.reloadAsync();
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    } finally {
      setIsChecking(false);
    }
  }, [isChecking]);

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
  }, [checkForUpdates]);

  return { checkForUpdates, isChecking };
}
