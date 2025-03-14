import { useEffect } from 'react';
import 'expo-dev-client';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/context/AuthProvider';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import 'react-native-reanimated';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {

  const [loaded] = useFonts({
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

  // Use an effect to hide the splash screen when fonts are loaded
  useEffect(() => {
    const hideSplash = async () => {
      if (loaded) {
        try {
          // Only hide the splash screen once the fonts have loaded
          await SplashScreen.hideAsync();
        } catch (e) {
          console.warn("Error hiding splash screen:", e);
        }
      }
    };

    hideSplash();
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(user)" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="sign-in" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="sign-up" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="+not-found" />
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
