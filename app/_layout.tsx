import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/hooks/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import 'react-native-reanimated';
import 'react-native-gesture-handler';
import { useColorScheme } from '@/hooks/useColorScheme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)

  const colorScheme = useColorScheme();

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

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            {session && session.user ? 
              <Stack.Screen name="(admin)" options={{ headerShown: false }} /> : <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            }
            <Stack.Screen name="+not-found" />
          </Stack>
        </ThemeProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
