import { Stack } from 'expo-router';
import ScreenTitle from '@/components/headers/ScreenTitle';

export default function ScheduleLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          header: () => <ScreenTitle title='Schedule' route={'/(tabs)'} showBackButton={false} />
        }}
      />
      <Stack.Screen name="[division]" options={{ headerShown: false }} />
    </Stack>
  );
}