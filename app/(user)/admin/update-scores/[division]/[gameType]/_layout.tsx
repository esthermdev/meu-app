import { SafeAreaView } from 'react-native';
import { CustomUpdateScoresHeader } from '@/components/headers/CustomUpdateScoresHeader';
import { Stack } from 'expo-router';

export default function UpdateScoresLayout() {
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
            <SafeAreaView style={{ backgroundColor: '#EA1D25' }}>
              <CustomUpdateScoresHeader title='Pool Play' />
            </SafeAreaView>
        }}
      />
    </Stack>
  );
}