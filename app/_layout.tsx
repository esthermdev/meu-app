import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/context/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import 'react-native-reanimated';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {

  const [loaded] = useFonts({
    OutfitBlack: require('../assets/fonts/Outfit-Black.ttf'),
    OutfitBold: require('../assets/fonts/Outfit-Bold.ttf'),
    OutfitExtraBold: require('../assets/fonts/Outfit-ExtraBold.ttf'),
    OutfitExtraLight: require('../assets/fonts/Outfit-ExtraLight.ttf'),
    OutfitLight: require('../assets/fonts/Outfit-Light.ttf'),
    OutfitMedium: require('../assets/fonts/Outfit-Medium.ttf'),
    OutfitRegular: require('../assets/fonts/Outfit-Regular.ttf'),
    OutfitSemiBold: require('../assets/fonts/Outfit-SemiBold.ttf'),
    OutfitThin: require('../assets/fonts/Outfit-Thin.ttf'),
  });

  if (!loaded) {
    SplashScreen.hideAsync()
    return null;
  }


  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(user)" options={{ headerShown: false }} />
            <Stack.Screen name="sign-in" options={{ headerShown: false  }} />
            <Stack.Screen name="sign-up" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
            <Stack.Screen name="index" />
          </Stack>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
