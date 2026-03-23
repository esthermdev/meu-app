import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AuthProvider } from '@/context/AuthProvider';
import { useCheckForAppUpdates } from '@/hooks/useCheckForAppUpdates';

import 'expo-dev-client';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch((error) => {
  console.warn('Error preventing splash screen from auto-hiding:', error);
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    GeistThin: require('../assets/fonts/Geist-Thin.ttf'),
    GeistExtraLight: require('../assets/fonts/Geist-ExtraLight.ttf'),
    GeistLight: require('../assets/fonts/Geist-Light.ttf'),
    GeistRegular: require('../assets/fonts/Geist-Regular.ttf'),
    GeistMedium: require('../assets/fonts/Geist-Medium.ttf'),
    GeistSemiBold: require('../assets/fonts/Geist-SemiBold.ttf'),
    GeistBold: require('../assets/fonts/Geist-Bold.ttf'),
    GeistExtraBold: require('../assets/fonts/Geist-ExtraBold.ttf'),
    GeistBlack: require('../assets/fonts/Geist-Black.ttf'),
  });

  useCheckForAppUpdates();

  // Use an effect to hide the splash screen when fonts are loaded and version check is complete
  useEffect(() => {
    const hideSplash = async () => {
      if (fontsLoaded) {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          console.warn('Error hiding splash screen:', e);
        }
      }
    };

    hideSplash();
  }, [fontsLoaded]);

  // Don't render anything until fonts are loaded and version check is complete
  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="(user)" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen
              name="sign-in"
              options={{
                headerShown: false,
                gestureEnabled: false,
                animation: 'none',
              }}
            />
            <Stack.Screen name="sign-up" options={{ headerShown: false, gestureEnabled: false, animation: 'none' }} />
            <Stack.Screen name="+not-found" />
            <Stack.Screen name="index" options={{ headerShown: false }} />
          </Stack>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
