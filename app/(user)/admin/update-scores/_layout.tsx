import { SafeAreaView } from 'react-native';
import { CustomAdminHeader } from '@/components/headers/CustomAdminHeader';
import { Stack } from 'expo-router';

export default function UpdateScoresLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          header: () =>
            <SafeAreaView style={{ backgroundColor: '#EA1D25' }}>
              <CustomAdminHeader title='Update Scores' />
            </SafeAreaView>
        }}
      />
      <Stack.Screen name="[division]" options={{ headerShown: false }} />
    </Stack>
  );
}