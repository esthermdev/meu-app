import { Platform, StatusBar, View } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomAdminHeader } from '@/components/headers/CustomAdminHeader';

export default function GameTypeLayout() {
  const insets = useSafeAreaInsets();

  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="poolplay"
        options={{
          header: () =>
            <View style={{
              paddingTop: Platform.OS === 'android' ? statusBarHeight : insets.top,
              backgroundColor: '#EA1D25'
            }}>
              <CustomAdminHeader title='Pool Play' />
            </View>
        }}
      />
    </Stack>
  );
}