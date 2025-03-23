import { Stack } from 'expo-router';
import CustomHeader from '@/components/headers/CustomHeader';

export default function GameTypeLayout() {
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
            <CustomHeader title="Pool Play" />
        }}
      />
    </Stack>
  );
}