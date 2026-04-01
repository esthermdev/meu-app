import { Platform, StatusBar, View } from 'react-native';
import { Stack } from 'expo-router';

import { CustomAdminHeader } from '@/components/headers/CustomAdminHeader';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminLayout() {
  const insets = useSafeAreaInsets();

  // Calculate proper padding for Android
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#EA1D25" translucent />
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            header: () => (
              <View
                style={{
                  paddingTop: Platform.OS === 'android' ? statusBarHeight : insets.top,
                  backgroundColor: '#EA1D25',
                }}>
                <CustomAdminHeader title="Admin" rightIcon={false} />
              </View>
            ),
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="update-scores"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="announcements"
          options={{
            header: () => (
              <View
                style={{
                  paddingTop: Platform.OS === 'android' ? statusBarHeight : insets.top,
                  backgroundColor: '#EA1D25',
                }}>
                <CustomAdminHeader title="Public Announcements" />
              </View>
            ),
          }}
        />
        <Stack.Screen
          name="misc"
          options={{
            header: () => (
              <View
                style={{
                  paddingTop: Platform.OS === 'android' ? statusBarHeight : insets.top,
                  backgroundColor: '#EA1D25',
                }}>
                <CustomAdminHeader title="General Requests / Feedback" />
              </View>
            ),
          }}
        />
      </Stack>
    </>
  );
}
