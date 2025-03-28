import { Platform, SafeAreaView, StatusBar, View } from 'react-native';
import { CustomAdminHeader } from '@/components/headers/CustomAdminHeader';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function UpdateScoresLayout() {
  const insets = useSafeAreaInsets();
  
  // Calculate proper padding for Android
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#EA1D25"
        translucent
      />
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            header: () => (
              <View style={{ 
                paddingTop: Platform.OS === 'android' ? statusBarHeight : insets.top,
                backgroundColor: '#EA1D25' 
              }}>
                <CustomAdminHeader title='Update Scores' />
              </View>
            )
          }}
        />
        <Stack.Screen name="[division]" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}